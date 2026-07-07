const mysql = require('mysql2/promise');

let pool;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql:')) {
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'railway',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  pool = mysql.createPool(config);
}

console.log('MySQL pool initialized.');

// Custom query wrapper to translate PG queries to MySQL
const db = {
  async query(sql, params) {
    // 1. Convert PostgreSQL parameters $1, $2 to MySQL ?
    let convertedSql = sql.replace(/\$\d+/g, '?');

    // 2. Handle PostgreSQL RETURNING id clause
    let isReturningId = false;
    if (/RETURNING\s+id/i.test(convertedSql)) {
      isReturningId = true;
      convertedSql = convertedSql.replace(/RETURNING\s+id/i, '');
    }

    // 3. Execute query
    const [result] = await pool.query(convertedSql, params);

    // 4. Return compatible PG structure { rows }
    let rows;
    if (isReturningId && result && typeof result.insertId === 'number') {
      rows = [{ id: result.insertId }];
    } else {
      rows = Array.isArray(result) ? result : [];
    }

    // Form compatible structure for both:
    // - const { rows } = await db.query(...)
    // - const [rows] = await db.query(...)
    const response = [rows, null];
    response.rows = rows;
    
    return response;
  },
  
  pool
};

module.exports = db;