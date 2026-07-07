require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  try {
    console.log('Connecting to MySQL database...');
    const pool = mysql.createPool(process.env.DATABASE_URL);
    
    const query = `
      CREATE TABLE IF NOT EXISTS file_storage (
        file_path VARCHAR(255) PRIMARY KEY,
        content_type VARCHAR(100),
        file_data LONGBLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(query);
    console.log('Successfully created file_storage table.');
    process.exit(0);
  } catch (err) {
    console.error('Database migration error:', err);
    process.exit(1);
  }
}

migrate();
