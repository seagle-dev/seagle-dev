const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

async function verifyToken(req, res, next) {
  try {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (!token) return res.status(401).json({ message: "No token provided" });

    if (typeof token === 'string' && token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const { rows } = await db.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (!rows || rows.length === 0) return res.status(401).json({ message: "User not found" });
    req.user = { id: rows[0].id, email: rows[0].email };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
}

module.exports = { verifyToken };