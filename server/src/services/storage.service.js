// server/src/services/storage.service.js
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { supabase, bucketName } = require('../config/supabase');

/**
 * Upload a buffer to Supabase Storage and return the file path.
 * @param {Buffer} buffer - File content
 * @param {string} destPath - Path in bucket, e.g. 'books/pdf/abc.pdf'
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} The file path (e.g. 'books/pdf/abc.pdf')
 */
async function uploadBuffer(buffer, destPath, contentType) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(destPath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    console.log('Uploaded to Supabase:', destPath);
    return destPath;
  } catch (err) {
    console.error('uploadBuffer error:', err.message);
    throw err;
  }
}

/**
 * Upload a multer file to Supabase Storage.
 * @param {object} file - Multer file with .buffer, .originalname, .mimetype
 * @param {string} folder - Destination folder, e.g. 'books/pdf'
 * @returns {Promise<string>} The file path
 */
async function uploadFile(file, folder) {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${uuidv4()}${ext}`;
  const destPath = `${folder}/${filename}`;
  return uploadBuffer(file.buffer, destPath, file.mimetype);
}

/**
 * Download a file from Supabase and return its contents as a Buffer.
 */
async function getFileBuffer(filePath) {
  if (!filePath) return null;

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error('getFileBuffer error for', filePath, ':', error.message);
      return null;
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('getFileBuffer error for', filePath, ':', err.message);
    return null;
  }
}

/**
 * Stream a file from Supabase.
 * @param {string} filePath - The file path in Supabase (e.g. 'books/pdf/abc.pdf')
 * @returns {{ stream: ReadableStream, contentType, size }} The readable stream and metadata
 */
async function getFileStream(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error('getFileStream error for', filePath, ':', error.message);
      return null;
    }

    // Create a readable stream from the blob
    const { Readable } = require('stream');
    const stream = Readable.from(data.stream());

    return {
      stream,
      contentType: data.type || 'application/octet-stream',
      size: data.size,
    };
  } catch (err) {
    console.error('getFileStream error for', filePath, ':', err.message);
    return null;
  }
}

/**
 * Delete a file from Supabase Storage by its path.
 * @param {string} filePath - The file path (e.g. 'books/pdf/abc.pdf')
 */
async function deleteFileByPath(filePath) {
  if (!filePath) return;

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.warn('Failed to delete from Supabase:', error.message);
      return;
    }

    console.log('Deleted from Supabase:', filePath);
  } catch (err) {
    console.warn('Failed to delete from storage:', err.message);
  }
}

module.exports = { uploadBuffer, uploadFile, getFileStream, getFileBuffer, deleteFileByPath };