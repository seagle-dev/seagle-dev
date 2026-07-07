const path = require('path');
const { randomUUID } = require('crypto');
const db = require('../config/db');
const { Readable } = require('stream');

/**
 * Upload a buffer to MySQL Storage and return the file path.
 * @param {Buffer} buffer - File content
 * @param {string} destPath - Path in bucket, e.g. 'books/pdf/abc.pdf'
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} The file path
 */
async function uploadBuffer(buffer, destPath, contentType) {
  try {
    const query = `
      INSERT INTO file_storage (file_path, content_type, file_data) 
      VALUES ($1, $2, $3) 
      ON DUPLICATE KEY UPDATE 
        content_type = VALUES(content_type), 
        file_data = VALUES(file_data)
    `;
    await db.query(query, [destPath, contentType, buffer]);
    console.log('Uploaded to MySQL file_storage:', destPath);
    return destPath;
  } catch (err) {
    console.error('uploadBuffer error:', err.message);
    throw err;
  }
}

/**
 * Upload a multer file to MySQL Storage.
 * @param {object} file - Multer file with .buffer, .originalname, .mimetype
 * @param {string} folder - Destination folder, e.g. 'books/pdf'
 * @returns {Promise<string>} The file path
 */
async function uploadFile(file, folder) {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${randomUUID()}${ext}`;
  const destPath = `${folder}/${filename}`;
  return uploadBuffer(file.buffer, destPath, file.mimetype);
}

/**
 * Download a file from MySQL and return its contents as a Buffer.
 */
async function getFileBuffer(filePath) {
  if (!filePath) return null;

  try {
    const { rows } = await db.query('SELECT file_data FROM file_storage WHERE file_path = $1', [filePath]);
    if (!rows || rows.length === 0) return null;
    return rows[0].file_data;
  } catch (err) {
    console.error('getFileBuffer error for', filePath, ':', err.message);
    return null;
  }
}

/**
 * Stream a file from MySQL.
 * @param {string} filePath - The file path (e.g. 'books/pdf/abc.pdf')
 * @returns {{ stream: ReadableStream, contentType, size }} The readable stream and metadata
 */
async function getFileStream(filePath) {
  if (!filePath) return null;

  try {
    const { rows } = await db.query('SELECT file_data, content_type FROM file_storage WHERE file_path = $1', [filePath]);
    if (!rows || rows.length === 0) return null;

    const buffer = rows[0].file_data;

    // Create a readable stream from the buffer
    const stream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });

    return {
      stream,
      contentType: rows[0].content_type || 'application/octet-stream',
      size: buffer.length,
    };
  } catch (err) {
    console.error('getFileStream error for', filePath, ':', err.message);
    return null;
  }
}

/**
 * Delete a file from MySQL Storage by its path.
 * @param {string} filePath - The file path (e.g. 'books/pdf/abc.pdf')
 */
async function deleteFileByPath(filePath) {
  if (!filePath) return;

  try {
    await db.query('DELETE FROM file_storage WHERE file_path = $1', [filePath]);
    console.log('Deleted from MySQL file_storage:', filePath);
  } catch (err) {
    console.warn('Failed to delete from storage:', err.message);
  }
}

module.exports = { uploadBuffer, uploadFile, getFileStream, getFileBuffer, deleteFileByPath };