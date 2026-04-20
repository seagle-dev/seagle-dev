require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  console.log('Testing connection with:');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });
    console.log('✅ Connected to database!');
    
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('Tables in database:', rows.map(r => Object.values(r)[0]));
    
    const [bookCount] = await connection.execute('SELECT COUNT(*) as count FROM books');
    console.log('Number of books:', bookCount[0].count);
    
    await connection.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

test();
