const db = require('../config/db');

async function listBooks({ search, category, page = 1, limit = 10, sort = 'newest' }) {
  const limitInt = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 10;
  const pageInt = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const offset = (pageInt - 1) * limitInt;

  const where = ['b.pdf_url IS NOT NULL'];
  const params = [];

  if (search) {
    where.push('b.title LIKE ?');
    params.push(`%${search}%`);
  }
  if (category) {
    where.push('b.category = ?');
    params.push(category);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(DISTINCT b.id) AS total FROM books b ${whereSql}`;
  const [countRows] = await db.execute(countSql, params);
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
      GROUP BY b.id
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
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT ${limitInt} OFFSET ${offset}
    `;
  }

  const selectParams = params.slice(); // only bound params for WHERE clause
  const [rows] = await db.execute(selectSql, selectParams);

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
  const limitInt = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 10;
  const pageInt = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const offset = (pageInt - 1) * limitInt;

  const where = ['m.file_url IS NOT NULL'];
  const params = [];

  if (search) {
    where.push('m.name LIKE ?');
    params.push(`%${search}%`);
  }
  if (category) {
    where.push('m.category = ?');
    params.push(category);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  const countSql = `SELECT COUNT(*) AS total FROM models_3d m ${whereSql}`;
  const [countRows] = await db.execute(countSql, params);
  const totalItems = Number(countRows[0]?.total || 0);

  const selectSql = `
    SELECT m.id, m.name, m.file_url, m.thumbnail, m.category, m.uploaded_by, m.created_at
    FROM models_3d m
    ${whereSql}
    ORDER BY m.created_at DESC
    LIMIT ${limitInt} OFFSET ${offset}
  `;
  const execParams = params.slice();

  const [rows] = await db.execute(selectSql, execParams);

  const data = rows.map(r => ({
    id: r.id,
    name: r.name,
    fileUrl: r.file_url,
    thumbnail: r.thumbnail,
    category: r.category,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at
  }));

  return { data, pagination: { page: pageInt, limit: limitInt, totalItems } };
}

module.exports = { listBooks, listModels };