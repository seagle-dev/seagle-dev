const db = require('../config/db');
const { uploadBuffer, uploadFile, deleteFileByPath, getFileBuffer } = require('./storage.service');
const { generateCoverFromPdf } = require('./pdfCover.service');
const { detectImagesOnPage: detectImagesFromPdf } = require('./pdfDetection.service');

// ==================== BOOKS ====================

async function listBooks() {
  console.log('listBooks called');
  try {
    const sql = `SELECT id, title, description, cover_image, pdf_url, category, created_at FROM books ORDER BY created_at DESC`;
    const [rows] = await db.execute(sql);
    console.log('listBooks result:', rows?.length || 0, 'rows');
    return rows || [];
  } catch (err) {
    console.error('admin.service.listBooks error', err.message);
    return [];
  }
}

async function getBookPdfPath(id) {
  if (!id) return null;
  const sql = `SELECT pdf_url FROM books WHERE id = ? LIMIT 1`;
  try {
    const [rows] = await db.execute(sql, [id]);
    return rows && rows[0] ? rows[0].pdf_url : null;
  } catch (err) {
    console.error('admin.service.getBookPdfPath error', err.message);
    return null;
  }
}

async function getBookCoverPath(id) {
  if (!id) return null;
  const sql = `SELECT cover_image FROM books WHERE id = ? LIMIT 1`;
  try {
    const [rows] = await db.execute(sql, [id]);
    return rows && rows[0] ? rows[0].cover_image : null;
  } catch (err) {
    console.error('admin.service.getBookCoverPath error', err.message);
    return null;
  }
}

/**
 * Detect images on a specific page of a book's PDF.
 * Downloads the PDF from GCS, then runs pdfDetection on the buffer.
 */
async function detectImagesOnPage(bookId, pageNumber) {
  const pdfPath = await getBookPdfPath(bookId);
  if (!pdfPath) throw new Error('Book PDF not found');

  const pdfBuffer = await getFileBuffer(pdfPath);
  if (!pdfBuffer) throw new Error('Could not download PDF from storage');

  return detectImagesFromPdf(pdfBuffer, pageNumber);
}


/**
 * Upload a book PDF to Firebase Storage, auto-generate cover from page 1,
 * and insert record into DB. Stores GCS paths (not URLs).
 */
async function createBook({ title, description, category, pdfFile, uploadedBy }) {
  // 1. Upload PDF to Firebase Storage -> books/pdf/
  const pdfPath = await uploadFile(pdfFile, 'books/pdf');
  console.log('[createBook] ✅ Step 1 DONE - PDF uploaded:', pdfPath);

  // 2. Generate cover image from first page -> books/covers/
  let coverPath = null;
  try {
    console.log('[createBook] 🔄 Step 2 START - buffer size:', pdfFile.buffer?.length, 'bytes');
    console.log('[createBook] 🔄 Calling generateCoverFromPdf...');
    
    const coverBuffer = await generateCoverFromPdf(pdfFile.buffer);
    
    console.log('[createBook] 🔄 Cover buffer returned:', coverBuffer ? `${coverBuffer.length} bytes` : 'NULL/UNDEFINED');
    
    if (!coverBuffer || coverBuffer.length === 0) {
      console.error('[createBook] ❌ Cover buffer is empty!');
    } else {
      const coverDestPath = `books/covers/${Date.now()}_cover.png`;
      console.log('[createBook] 🔄 Uploading cover to:', coverDestPath);
      
      coverPath = await uploadBuffer(coverBuffer, coverDestPath, 'image/png');
      console.log('[createBook] ✅ Step 2 DONE - Cover uploaded:', coverPath);
    }
  } catch (err) {
    console.error('[createBook] ❌ Step 2 FAILED');
    console.error('[createBook] ❌ Error name:', err.name);
    console.error('[createBook] ❌ Error message:', err.message);
    console.error('[createBook] ❌ Full stack:', err.stack);
  }

  // 3. Insert into DB
  console.log('[createBook] 🔄 Step 3 - Inserting into DB, coverPath:', coverPath);
  const sql = `INSERT INTO books (title, description, cover_image, pdf_url, category, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [
    title || 'Untitled',
    description || null,
    coverPath,
    pdfPath,
    category || null,
    uploadedBy || null
  ];
  const [result] = await db.execute(sql, params);
  console.log('[createBook] ✅ Step 3 DONE - Book ID:', result.insertId, '| coverPath in DB:', coverPath);

  return {
    id: result.insertId,
    title: title || 'Untitled',
    description,
    cover_image: coverPath,
    pdf_url: pdfPath,
    category,
  };
}

async function deleteBook(id) {
  const [rows] = await db.execute('SELECT pdf_url, cover_image FROM books WHERE id = ?', [id]);
  if (rows && rows[0]) {
    await deleteFileByPath(rows[0].pdf_url);
    await deleteFileByPath(rows[0].cover_image);
  }
  await db.execute('DELETE FROM mappings WHERE book_id = ?', [id]);
  await db.execute('DELETE FROM books WHERE id = ?', [id]);
}

// ==================== 3D MODELS ====================

async function listModels() {
  const sql = `SELECT id, name, file_url, thumbnail, view_state, category, created_at FROM models_3d WHERE file_url IS NOT NULL ORDER BY created_at DESC`;
  try {
    const [rows] = await db.execute(sql);

    const normalizeViewState = (raw) => {
      if (!raw) return null;
      if (typeof raw === 'object') return raw;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
      return null;
    };

    return rows.map(model => ({
      id: model.id,
      name: model.name,
      file_url: model.file_url,       // GCS path
      thumbnail: model.thumbnail,       // GCS path
      view_state: normalizeViewState(model.view_state),
      category: model.category,
      created_at: model.created_at,
    }));
  } catch (err) {
    console.error('listModels error:', err);
    throw err;
  }
}

async function getModelFilePath(id) {
  if (!id) return null;
  const sql = `SELECT file_url FROM models_3d WHERE id = ? LIMIT 1`;
  try {
    const [rows] = await db.execute(sql, [id]);
    return rows && rows[0] ? rows[0].file_url : null;
  } catch (err) {
    console.error('admin.service.getModelFilePath error', err.message);
    return null;
  }
}

async function getModelThumbnailPath(id) {
  if (!id) return null;
  const sql = `SELECT thumbnail FROM models_3d WHERE id = ? LIMIT 1`;
  try {
    const [rows] = await db.execute(sql, [id]);
    return rows && rows[0] ? rows[0].thumbnail : null;
  } catch (err) {
    console.error('admin.service.getModelThumbnailPath error', err.message);
    return null;
  }
}

/**
 * Upload a 3D model (GLB/GLTF) to Firebase Storage and insert into DB.
 * Stores GCS path (not URL).
 */
async function createModel({ name, category, modelFile, uploadedBy }) {
  const filePath = await uploadFile(modelFile, 'models/files');
  console.log('3D model uploaded to GCS path:', filePath);

  const sql = `INSERT INTO models_3d (name, file_url, thumbnail, category, uploaded_by) VALUES (?, ?, ?, ?, ?)`;
  const params = [
    name || 'Untitled Model',
    filePath,
    null,
    category || null,
    uploadedBy || null
  ];
  const [result] = await db.execute(sql, params);

  return {
    id: result.insertId,
    name: name || 'Untitled Model',
    file_url: filePath,
    thumbnail: null,
    category,
  };
}

/**
 * Upload/update a thumbnail for a model.
 */
async function updateModelThumbnail(modelId, thumbnailBuffer, viewState = null) {
  const thumbnailPath = await uploadBuffer(
    thumbnailBuffer,
    `models/thumbnails/${modelId}_${Date.now()}.png`,
    'image/png'
  );

  // Delete old thumbnail
  const [rows] = await db.execute('SELECT thumbnail FROM models_3d WHERE id = ?', [modelId]);
  if (rows?.[0]?.thumbnail) {
    await deleteFileByPath(rows[0].thumbnail);
  }

  const viewStateJson = viewState ? JSON.stringify(viewState) : null;
  await db.execute('UPDATE models_3d SET thumbnail = ?, view_state = ? WHERE id = ?', [thumbnailPath, viewStateJson, modelId]);
  return thumbnailPath;
}

async function deleteModel(id) {
  const [rows] = await db.execute('SELECT file_url, thumbnail FROM models_3d WHERE id = ?', [id]);
  if (rows && rows[0]) {
    await deleteFileByPath(rows[0].file_url);
    await deleteFileByPath(rows[0].thumbnail);
  }
  await db.execute('UPDATE mappings SET model_id = NULL WHERE model_id = ?', [id]);
  await db.execute('DELETE FROM models_3d WHERE id = ?', [id]);
}

// ==================== MAPPINGS ====================

async function createMapping(payload, createdBy) {
  const { book_id, page_number, x, y, width, height, model_id, label } = payload;

  if (!book_id || !page_number || model_id == null) throw new Error('Missing fields');
  [x, y, width, height].forEach(v => {
    if (typeof v !== 'number' || v < 0 || v > 1) throw new Error('Coordinates must be 0..1');
  });

  const sql = `INSERT INTO mappings (book_id, page_number, x, y, width, height, model_id, label, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [book_id, page_number, x, y, width, height, model_id, label || null, createdBy || null];
  const [result] = await db.execute(sql, params);
  return result.insertId;
}

async function getMappings(bookId, pageNumber) {
  const sql = `SELECT id, book_id, page_number, x, y, width, height, model_id, label, created_at FROM mappings WHERE book_id = ? AND page_number = ? ORDER BY id`;
  const [rows] = await db.execute(sql, [bookId, pageNumber]);
  return rows;
}

async function deleteMapping(id) {
  await db.execute(`DELETE FROM mappings WHERE id = ?`, [id]);
}

module.exports = {
  listBooks, getBookPdfPath, getBookCoverPath, createBook, deleteBook,
  listModels, getModelFilePath, getModelThumbnailPath, createModel, updateModelThumbnail, deleteModel,
  createMapping, getMappings, deleteMapping, detectImagesOnPage
};