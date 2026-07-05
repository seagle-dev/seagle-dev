const db = require('../config/db');
const { parsePositiveInt } = require('../utils/request');
const { normalizeViewState } = require('../utils/viewState');

async function listBooks({ search, category, page = 1, limit = 10, sort = 'newest' }) {
  const limitInt = parsePositiveInt(limit, 10);
  const pageInt = parsePositiveInt(page, 1);
  const offset = (pageInt - 1) * limitInt;

  const where = ['b.pdf_url IS NOT NULL'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`b.title LIKE $${params.length}`);
  }
  if (category) {
    params.push(category);
    where.push(`b.category = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(DISTINCT b.id) AS total FROM books b ${whereSql}`;
  const { rows: countRows } = await db.query(countSql, params);
  const totalItems = Number(countRows[0]?.total || 0);

  let selectSql;
  // Note: LIMIT/OFFSET are injected after validation to avoid driver prepared-statement issues
  if (sort === 'trending') {
    selectSql = `
      SELECT b.id, b.title, b.description, b.cover_image, b.pdf_url, b.category, b.uploaded_by, b.created_at,
             COUNT(uba.id) AS read_count
      FROM books b
      LEFT JOIN user_book_activity uba ON uba.book_id = b.id
      ${whereSql}
      GROUP BY b.id, b.title, b.description, b.cover_image, b.pdf_url, b.category, b.uploaded_by, b.created_at
      ORDER BY read_count DESC, b.created_at DESC
      LIMIT ${limitInt} OFFSET ${offset}
    `;
  } else {
    selectSql = `
      SELECT b.id, b.title, b.description, b.cover_image, b.pdf_url, b.category, b.uploaded_by, b.created_at,
             COUNT(uba.id) AS read_count
      FROM books b
      LEFT JOIN user_book_activity uba ON uba.book_id = b.id
      ${whereSql}
      GROUP BY b.id, b.title, b.description, b.cover_image, b.pdf_url, b.category, b.uploaded_by, b.created_at
      ORDER BY b.created_at DESC
      LIMIT ${limitInt} OFFSET ${offset}
    `;
  }

  const selectParams = params.slice(); // only bound params for WHERE clause
  const { rows } = await db.query(selectSql, selectParams);

  const data = rows.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    coverImage: r.cover_image,
    pdfUrl: r.pdf_url,
    category: r.category,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at,
    readCount: r.read_count !== undefined ? Number(r.read_count) : 0
  }));

  return { data, pagination: { page: pageInt, limit: limitInt, totalItems } };
}

async function listModels({ search, category, page = 1, limit = 10 }) {
  const limitInt = parsePositiveInt(limit, 10);
  const pageInt = parsePositiveInt(page, 1);
  const offset = (pageInt - 1) * limitInt;

  const where = ['m.file_url IS NOT NULL'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`m.name LIKE $${params.length}`);
  }
  if (category) {
    params.push(category);
    where.push(`m.category = $${params.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  const countSql = `SELECT COUNT(*) AS total FROM models_3d m ${whereSql}`;
  const { rows: countRows } = await db.query(countSql, params);
  const totalItems = Number(countRows[0]?.total || 0);

  const selectSql = `
    SELECT m.id, m.name, m.file_url, m.thumbnail, m.view_state, m.category, m.uploaded_by, m.created_at
    FROM models_3d m
    ${whereSql}
    ORDER BY m.created_at DESC
    LIMIT ${limitInt} OFFSET ${offset}
  `;
  const execParams = params.slice();

  const { rows } = await db.query(selectSql, execParams);

  const data = rows.map(r => ({
    id: r.id,
    name: r.name,
    fileUrl: r.file_url,
    thumbnail: r.thumbnail,
    view_state: normalizeViewState(r.view_state),
    category: r.category,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at
  }));

  return { data, pagination: { page: pageInt, limit: limitInt, totalItems } };
}

/**
 * Get annotation mappings for a specific book page.
 * Returns array of { id, book_id, page_number, x, y, width, height, model_id, label, created_at }
 */
async function getMappings(bookId, pageNumber) {
  const sql = `
    SELECT
      m.id,
      m.book_id,
      m.page_number,
      m.x,
      m.y,
      m.width,
      m.height,
      m.model_id,
      m.label,
      m.created_at,
      md.name AS model_name,
      md.thumbnail AS model_thumbnail,
      md.view_state AS model_view_state
    FROM mappings m
    LEFT JOIN models_3d md ON md.id = m.model_id
    WHERE m.book_id = $1 AND m.page_number = $2
    ORDER BY m.id
  `;
  const { rows } = await db.query(sql, [bookId, pageNumber]);

  return rows.map((row) => ({
    ...row,
    model_view_state: normalizeViewState(row.model_view_state),
  }));
}

/**
 * Get all annotation mappings for a book in one request.
 * Used by mobile clients to build an offline page -> models lookup.
 */
async function getBookMappings(bookId) {
  const sql = `
    SELECT
      m.id,
      m.book_id,
      m.page_number,
      m.x,
      m.y,
      m.width,
      m.height,
      m.model_id,
      m.label,
      m.created_at,
      md.name AS model_name,
      md.thumbnail AS model_thumbnail,
      md.view_state AS model_view_state
    FROM mappings m
    LEFT JOIN models_3d md ON md.id = m.model_id
    WHERE m.book_id = $1
    ORDER BY m.page_number, m.id
  `;
  const { rows } = await db.query(sql, [bookId]);

  return rows.map((row) => ({
    ...row,
    model_view_state: normalizeViewState(row.model_view_state),
  }));
}

module.exports = { listBooks, listModels, getMappings, getBookMappings };
