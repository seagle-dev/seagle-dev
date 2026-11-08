require('dotenv').config();
const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Connecting to Supabase Postgres...');
    
    const query = `
      CREATE TABLE IF NOT EXISTS file_storage (
        file_path VARCHAR(255) PRIMARY KEY,
        content_type VARCHAR(100),
        file_data BYTEA,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.query(query);
    console.log('Successfully created file_storage table.');
  } catch (err) {
    console.error('Database migration error:', err);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
}

migrate();
