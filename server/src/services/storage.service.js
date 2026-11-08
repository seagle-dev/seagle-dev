const path = require('path');
const { randomUUID } = require('crypto');
const { Readable } = require('stream');
const { supabase, bucketName } = require('../config/supabase');

const storage = supabase.storage.from(bucketName);

function isNotFound(error) {
  return Number(error?.status) === 404 ||
    Number(error?.statusCode) === 404 ||
    error?.code === 'storage/object-not-found';
}

/** Upload a buffer to the configured Supabase Storage bucket and return its object path. */
async function uploadBuffer(buffer, destPath, contentType) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('Storage upload requires a Buffer');

  const { error } = await storage.upload(destPath, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: true,
  });
  if (error) throw error;

  console.log('Uploaded to Supabase Storage:', destPath);
  return destPath;
}

/** Upload a multer file under the given folder. */
async function uploadFile(file, folder) {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${randomUUID()}${ext}`;
  return uploadBuffer(file.buffer, `${folder}/${filename}`, file.mimetype);
}

/** Download a Supabase Storage object as a Buffer. */
async function getFileBuffer(filePath) {
  if (!filePath) return null;
  try {
    const { data, error } = await storage.download(filePath);
    if (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
    return Buffer.from(await data.arrayBuffer());
  } catch (error) {
    if (isNotFound(error)) return null;
    console.error('getFileBuffer error for', filePath, ':', error.message);
    return null;
  }
}

/** Return a readable stream and metadata for a Supabase Storage object. */
async function getFileStream(filePath) {
  if (!filePath) return null;
  try {
    const { data, error } = await storage.createSignedUrl(filePath, 60);
    if (error) {
      if (isNotFound(error)) return null;
      throw error;
    }

    const response = await fetch(data.signedUrl);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Supabase Storage download failed with HTTP ${response.status}`);
    }
    if (!response.body) throw new Error('Supabase Storage returned an empty response body');

    return {
      stream: Readable.fromWeb(response.body),
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      size: Number(response.headers.get('content-length')) || undefined,
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    console.error('getFileStream error for', filePath, ':', error.message);
    return null;
  }
}

/** Delete a Supabase Storage object by path. */
async function deleteFileByPath(filePath) {
  if (!filePath) return;
  try {
    const { error } = await storage.remove([filePath]);
    if (error) throw error;
    console.log('Deleted from Supabase Storage:', filePath);
  } catch (error) {
    console.warn('Failed to delete from storage:', error.message);
  }
}

module.exports = { uploadBuffer, uploadFile, getFileStream, getFileBuffer, deleteFileByPath };
