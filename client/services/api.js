import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '5000';
const API_PATH = '/api';

function getExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!hostUri) return null;

  return hostUri
    .replace(/^https?:\/\//, '')
    .replace(/^exp:\/\//, '')
    .split('/')[0]
    .split(':')[0];
}

function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }

  const expoHost = getExpoHost();
  if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
    return `http://${expoHost}:${API_PORT}${API_PATH}`;
  }

  // Android emulator uses 10.0.2.2 to reach the host machine's localhost.
  const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${fallbackHost}:${API_PORT}${API_PATH}`;
}

const DEFAULT_BASE = getApiBaseUrl();

export const api = axios.create({
  baseURL: DEFAULT_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== TOKEN HELPERS ====================

export async function setToken(token) {
  const normalizedToken = typeof token === 'string' ? token.trim() : token;
  if (normalizedToken) {
    await AsyncStorage.setItem('token', normalizedToken);
  } else {
    await AsyncStorage.removeItem('token');
  }
}

export async function getToken() {
  const token = await AsyncStorage.getItem('token');
  return typeof token === 'string' ? token.trim() : token;
}

export async function clearAuth() {
  await AsyncStorage.multiRemove(['token', 'user']);
}

// ==================== AUTH ====================

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  const { token, user } = res.data;
  await setToken(token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  return { token, user };
}

export async function register(email, password) {
  const res = await api.post('/auth/register', { email, password });
  const { token, user } = res.data;
  await setToken(token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  return { token, user };
}

export async function refreshToken() {
  const res = await api.post('/auth/refresh');
  const { token } = res.data;
  await setToken(token);
  return token;
}

export async function fetchProfile() {
  const res = await api.get('/auth/profile');
  return res.data;
}

// ==================== LIBRARY (public) ====================

export async function fetchBooks({ search, category, page = 1, limit = 10, sort = 'newest' } = {}) {
  const params = { page, limit, sort };
  if (search) params.search = search;
  if (category) params.category = category;
  const res = await api.get('/library/books', { params });
  return res.data; // { data: [...], pagination: {...} }
}

export async function fetchModels({ search, category, page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  if (category) params.category = category;
  const res = await api.get('/library/models', { params });
  return res.data;
}

export async function fetchAllModels() {
  const res = await api.get('/library/models', { params: { limit: 1000 } });
  return res.data.data || res.data;
}

export async function fetchMappings(bookId, page) {
  let res;
  try {
    res = await api.get('/library/mappings', { params: { book_id: bookId, page } });
  } catch (err) {
    if (err?.response?.status !== 401) throw err;
    await refreshToken();
    res = await api.get('/library/mappings', { params: { book_id: bookId, page } });
  }
  return res.data.data || res.data;
}

export async function fetchBookMappings(bookId) {
  let res;
  try {
    console.log('[API] fetchBookMappings - bookId:', bookId);
    res = await api.get(`/library/books/${bookId}/mappings`);
    console.log('[API] fetchBookMappings - success:', res.data);
  } catch (err) {
    console.error('[API] fetchBookMappings - error:', {
      url: err?.config?.url,
      method: err?.config?.method,
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      responseData: err?.response?.data,
      message: err?.message,
    });
    
    if (err?.response?.status !== 401) throw err;
    
    console.log('[API] Got 401, refreshing token...');
    await refreshToken();
    res = await api.get(`/library/books/${bookId}/mappings`);
  }
  return res.data.data || res.data;
}

// ==================== HOME (auth required) ====================

export async function fetchHome() {
  let res;
  try {
    res = await api.get('/home');
  } catch (err) {
    if (err?.response?.status !== 401) throw err;
    await refreshToken();
    res = await api.get('/home');
  }
  return res.data; // { recentlyRead: [...], trending: [...] }
}

// ==================== HELPERS ====================

/**
 * Build the full URL for a book cover image proxy endpoint.
 */
export function getBookCoverUrl(bookId) {
  return `${DEFAULT_BASE}/admin/books/${bookId}/cover`;
}

/**
 * Build the full URL for a book PDF proxy endpoint.
 */
export function getBookPdfUrl(bookId) {
  return `${DEFAULT_BASE}/admin/books/${bookId}/pdf`;
}

/**
 * Build the full URL for a model file (GLB/GLTF).
 */
export function getModelFileUrl(modelId) {
  return `${DEFAULT_BASE}/admin/models/${modelId}/file`;
}

/**
 * Build the full URL for a model thumbnail.
 */
export function getModelThumbnailUrl(modelId) {
  return `${DEFAULT_BASE}/admin/models/${modelId}/thumbnail`;
}

