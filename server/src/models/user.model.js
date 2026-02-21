const db = require('../config/db');

module.exports = {
  createUser: (email, password_hash, cb) => {
    const defaultRole = 'learner';
    db.query(
      "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
      [email, password_hash, defaultRole],
      cb
    );
  },

  findById: (id, cb) => {
    db.query(
      "SELECT id, email FROM users WHERE id = ?",
      [id],
      cb
    );
  },

  findByEmail: (email, cb) => {
    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      cb
    );
  }
};