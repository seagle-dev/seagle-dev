const admin = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function getBucket() {
  return admin.storage().bucket();
}

/**
 * Extract clean GCS path from a value that might be a full URL or a clean path.
 */
function extractGcsPath(value) {
  if (!value) return null;

  // Already a clean path (no http)
  if (!value.startsWith('http')) {
    return value;
  }

  // Handle: https://storage.googleapis.com/BUCKET/path/to/file?query...
  if (value.includes('storage.googleapis.com/')) {
    const bucket = getBucket();
    const prefix = `https://storage.googleapis.com/${bucket.name}/`;
    if (value.startsWith(prefix)) {
      const pathWithQuery = value.slice(prefix.length);
      return decodeURIComponent(pathWithQuery.split('?')[0]);
    }
    const match = value.match(/storage\.googleapis\.com\/[^/]+\/(.+?)(\?|$)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  // Handle: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/encoded%2Fpath?alt=media&token=...
  if (value.includes('firebasestorage.googleapis.com')) {
    const match = value.match(/\/o\/(.+?)(\?|$)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  return value;
}

/**
 * Upload a buffer to Firebase Storage and return the internal GCS path (not a signed URL).
 * The path is stored in the DB; files are served via backend proxy.
 * @param {Buffer} buffer - File content
 * @param {string} destPath - Path in bucket, e.g. 'books/pdf/abc.pdf'
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} The GCS object path (e.g. 'books/pdf/abc.pdf')
 */
async function uploadBuffer(buffer, destPath, contentType) {
  const bucket = getBucket();
  const file = bucket.file(destPath);

  await file.save(buffer, {
    metadata: {
      contentType,
    },
    resumable: false,
  });

  // Return the GCS path — NOT a signed URL
  // Files will be served through our Express proxy
  return destPath;
}

/**
 * Upload a multer file to Firebase Storage.
 * @param {object} file - Multer file with .buffer, .originalname, .mimetype
 * @param {string} folder - Destination folder, e.g. 'books/pdf'
 * @returns {Promise<string>} The GCS object path
 */
async function uploadFile(file, folder) {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${uuidv4()}${ext}`;
  const destPath = `${folder}/${filename}`;
  return uploadBuffer(file.buffer, destPath, file.mimetype);
}

/**
 * Download a file from GCS and return its contents as a Buffer.
 * Handles both clean GCS paths and legacy signed URLs.
 */
async function getFileBuffer(gcsPathOrUrl) {
  const gcsPath = extractGcsPath(gcsPathOrUrl);
  if (!gcsPath) return null;

  try {
    const bucket = getBucket();
    const file = bucket.file(gcsPath);
    const [buffer] = await file.download();
    return buffer;
  } catch (err) {
    console.error('getFileBuffer error for', gcsPath, ':', err.message);
    return null;
  }
}
/**
 * Stream a file from GCS.
 * @param {string} gcsPath - The object path in GCS (e.g. 'books/pdf/abc.pdf')
 * @returns {{ stream: ReadableStream, file: File }} The readable stream and file reference
 */
async function getFileStream(gcsPath) {
  const bucket = getBucket();
  const file = bucket.file(gcsPath);

  const [exists] = await file.exists();
  if (!exists) {
    return null;
  }

  const [metadata] = await file.getMetadata();
  const stream = file.createReadStream();

  return {
    stream,
    contentType: metadata.contentType || 'application/octet-stream',
    size: metadata.size ? parseInt(metadata.size, 10) : undefined,
  };
}

/**
 * Delete a file from Firebase Storage by its GCS path.
 * @param {string} gcsPath - The object path (e.g. 'books/pdf/abc.pdf')
 */
async function deleteFileByPath(gcsPath) {
  if (!gcsPath) return;
  try {
    const bucket = getBucket();
    const file = bucket.file(gcsPath);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log('Deleted from GCS:', gcsPath);
    }
  } catch (err) {
    console.warn('Failed to delete from storage:', err.message);
  }
}

module.exports = { uploadBuffer, uploadFile, getFileStream, getFileBuffer, deleteFileByPath, getBucket };