const db = require('../config/db');

async function getRecentlyRead(userId) {
  const sql = `
    SELECT b.id, b.title, b.cover_image, b.pdf_url, b.description, b.category, uba.last_read_at
    FROM user_book_activity uba
    JOIN books b ON uba.book_id = b.id
    WHERE uba.user_id = ?
    ORDER BY uba.last_read_at DESC
    LIMIT 5
  `;
  const [rows] = await db.execute(sql, [userId]);
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    coverImage: r.cover_image,
    pdfUrl: r.pdf_url,
    description: r.description,
    category: r.category,
    lastReadAt: r.last_read_at
  }));
}

async function getTrending() {
  const sql = `
    SELECT b.id, b.title, b.cover_image, b.pdf_url, b.category, COUNT(uba.id) AS read_count
    FROM user_book_activity uba
    JOIN books b ON uba.book_id = b.id
    GROUP BY b.id, b.title, b.cover_image, b.pdf_url, b.category
    ORDER BY read_count DESC
    LIMIT 5
  `;
  const [rows] = await db.execute(sql);
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    coverImage: r.cover_image,
    pdfUrl: r.pdf_url,
    category: r.category,
    readCount: r.read_count
  }));
}

module.exports = { getRecentlyRead, getTrending };