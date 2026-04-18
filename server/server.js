require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/db');

// Test endpoint to verify database connection
app.get('/localhost', async (req, res) => {
  try {
    // Run a simple query to see if it's alive
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ message: "Connected!", data: rows });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test DB connection at http://localhost:${PORT}/seagle-db`);
});