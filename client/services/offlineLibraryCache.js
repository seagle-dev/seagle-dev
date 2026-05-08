import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import {
  fetchBookMappings,
  getModelFileUrl,
  getModelThumbnailUrl,
  getToken,
} from './api';

const CACHE_ROOT = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}Seagle/`
  : null;

const CACHE_VERSION = 1;

function assertFileSystemAvailable() {
  if (!CACHE_ROOT) {
    throw new Error('Offline storage is not available on this platform.');
  }
}

async function ensureDir(uri) {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

function bookRoot(bookId) {
  return `${CACHE_ROOT}books/${bookId}/`;
}

function mappingsDir(bookId) {
  return `${bookRoot(bookId)}mappings/`;
}

function mappingFile(bookId) {
  return `${mappingsDir(bookId)}mapping.json`;
}

function modelsDir() {
  return `${CACHE_ROOT}models/`;
}

export function getOfflineModelFileUri(modelId) {
  if (!CACHE_ROOT || modelId == null) return null;
  return `${modelsDir()}model_${modelId}.glb`;
}

function getOfflineThumbnailFileUri(modelId) {
  if (!CACHE_ROOT || modelId == null) return null;
  return `${modelsDir()}model_${modelId}_thumb.png`;
}

function normalizeMappingRow(row, modelFiles) {
  const modelId = row.model_id;
  const hasDownloadedModel = modelFiles && Object.prototype.hasOwnProperty.call(modelFiles, modelId);
  const localFileUri = hasDownloadedModel
    ? modelFiles[modelId].fileUri
    : getOfflineModelFileUri(modelId);
  const localThumbnailUri = hasDownloadedModel
    ? modelFiles[modelId].thumbnailUri
    : getOfflineThumbnailFileUri(modelId);

  return {
    id: row.id,
    book_id: row.book_id,
    page_number: Number(row.page_number),
    model_id: modelId,
    x: Number(row.x),
    y: Number(row.y),
    width: Number(row.width),
    height: Number(row.height),
    label: row.label ?? row.model_name ?? '3D Model',
    model_name: row.model_name ?? row.label ?? '3D Model',
    model_thumbnail: localThumbnailUri,
    model_view_state: row.model_view_state ?? null,
    model: {
      id: modelId,
      name: row.model_name ?? row.label ?? '3D Model',
      thumbnail: localThumbnailUri,
      localFileUri,
      view_state: row.model_view_state ?? null,
    },
  };
}

function buildPageLookup(bookId, rows, modelFiles = {}) {
  const pages = {};
  const models = {};

  rows.forEach((row) => {
    if (!row?.page_number || row.model_id == null) return;

    const normalized = normalizeMappingRow(row, modelFiles);
    const pageKey = String(normalized.page_number);

    if (!pages[pageKey]) pages[pageKey] = [];
    pages[pageKey].push(normalized);

    models[String(normalized.model_id)] = normalized.model;
  });

  return {
    version: CACHE_VERSION,
    book_id: bookId,
    created_at: new Date().toISOString(),
    pages,
    models,
  };
}

async function downloadFileIfMissing(url, fileUri, token, force = false) {
  if (!url || !fileUri) return null;

  const existing = await FileSystem.getInfoAsync(fileUri);
  if (existing.exists && !force) return fileUri;
  if (existing.exists && force) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }

  await FileSystem.downloadAsync(url, fileUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return fileUri;
}

async function downloadModelFiles(rows, force = false) {
  await ensureDir(modelsDir());

  const token = await getToken();
  const modelIds = [...new Set(rows.map((row) => row.model_id).filter((id) => id != null))];
  const modelFiles = {};

  console.log('[offlineCache] downloadModelFiles - modelIds:', modelIds);

  await Promise.all(modelIds.map(async (modelId) => {
    const fileUri = getOfflineModelFileUri(modelId);
    const thumbnailUri = getOfflineThumbnailFileUri(modelId);
    let savedThumbnailUri = null;

    try {
      console.log('[offlineCache] Downloading model file for modelId:', modelId);
      await downloadFileIfMissing(getModelFileUrl(modelId), fileUri, token, force);
      console.log('[offlineCache] Model file downloaded:', modelId);
    } catch (err) {
      console.error('[offlineCache] Model file download failed for modelId:', modelId, {
        error: err.message,
        status: err?.response?.status,
      });
      throw err; // Re-throw so we know this failed
    }

    try {
      savedThumbnailUri = await downloadFileIfMissing(getModelThumbnailUrl(modelId), thumbnailUri, token, force);
    } catch {
      // Thumbnails are optional
    }

    modelFiles[modelId] = { fileUri, thumbnailUri: savedThumbnailUri };
  }));

  return modelFiles;
}

export async function readOfflineBookMapping(bookId) {
  if (!CACHE_ROOT) return null;

  const fileUri = mappingFile(bookId);
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists) return null;

  const raw = await FileSystem.readAsStringAsync(fileUri);
  const parsed = JSON.parse(raw);
  return parsed?.pages ? parsed : null;
}

export async function ensureOfflineBookMapping(bookId, { force = false } = {}) {
  if (!CACHE_ROOT) {
    console.log('[offlineCache] No CACHE_ROOT, fetching without caching');
    const rows = await fetchBookMappings(bookId);
    return buildPageLookup(bookId, Array.isArray(rows) ? rows : []);
  }

  const existing = !force ? await readOfflineBookMapping(bookId) : null;
  if (existing) {
    console.log('[offlineCache] Found existing cached mappings for bookId:', bookId);
    return existing;
  }

  await ensureDir(CACHE_ROOT);
  await ensureDir(bookRoot(bookId));
  await ensureDir(mappingsDir(bookId));

  console.log('[offlineCache] Fetching mappings from server for bookId:', bookId);
  const rows = await fetchBookMappings(bookId);
  console.log('[offlineCache] Got mappings from server:', rows.length, 'rows');
  
  const mappings = Array.isArray(rows) ? rows : [];
  const modelFiles = Platform.OS === 'web'
    ? {}
    : await downloadModelFiles(mappings, force);
  const lookup = buildPageLookup(bookId, mappings, modelFiles);

  await FileSystem.writeAsStringAsync(mappingFile(bookId), JSON.stringify(lookup));
  console.log('[offlineCache] Cached mappings for bookId:', bookId);
  return lookup;
}

export function getPageMappings(lookup, pageNumber) {
  return lookup?.pages?.[String(pageNumber)] ?? [];
}

/**
 * Clear all offline cached data (mappings + model files)
 * Call this when switching storage backends (Firebase → Supabase)
 */
export async function clearOfflineCache() {
  if (!CACHE_ROOT) {
    console.log('[offlineCache] No CACHE_ROOT, nothing to clear');
    return;
  }

  try {
    const info = await FileSystem.getInfoAsync(CACHE_ROOT);
    if (info.exists) {
      await FileSystem.deleteAsync(CACHE_ROOT, { idempotent: true });
      console.log('[offlineCache] ✓ Cleared all offline cache');
    } else {
      console.log('[offlineCache] Cache already empty');
    }
  } catch (err) {
    console.error('[offlineCache] Error clearing cache:', err.message);
    throw err;
  }
}
