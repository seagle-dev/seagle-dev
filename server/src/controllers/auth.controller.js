const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const admin = require('../config/firebase');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

exports.register = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const hash = await bcrypt.hash(password, 10);

    let firebaseUser = null;
    try {
      firebaseUser = await admin.auth().createUser({ email, password });
    } catch (fbErr) {
      if (fbErr.code !== 'auth/email-already-exists') {
        return res.status(500).json({ message: "Firebase error", error: fbErr.message });
      }
    }

    // keep default role in DB to satisfy schema
    const defaultRole = 'learner';

    db.query(
      "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
      [email, hash, defaultRole],
      async (err, result) => {
        if (err) {
          if (firebaseUser && firebaseUser.uid) {
            try { await admin.auth().deleteUser(firebaseUser.uid); } catch (_) {}
          }
          if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "User already exists" });
          return res.status(500).json({ message: "DB error", error: err.message });
        }

        const userId = result.insertId;
        const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });

        return res.status(201).json({ token, user: { id: userId, email } });
      }
    );
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, idToken } = req.body;

  if (idToken) {
    if (!idToken) return res.status(400).json({ message: "idToken required" });
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const fEmail = decoded.email;
      if (!fEmail) return res.status(400).json({ message: "Firebase token has no email" });

      return db.query("SELECT * FROM users WHERE email = ?", [fEmail], (err, results) => {
        if (err) return res.status(500).json({ message: "DB error", error: err.message });

        const defaultRole = 'learner';

        if (results && results.length > 0) {
          const user = results[0];
          const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
          return res.json({ token, user: { id: user.id, email: user.email } });
        }

        db.query(
          "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
          [fEmail, '', defaultRole],
          (insertErr, insertRes) => {
            if (insertErr) return res.status(500).json({ message: "DB error", error: insertErr.message });
            const newId = insertRes.insertId;
            const token = jwt.sign({ id: newId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
            return res.json({ token, user: { id: newId, email: fEmail } });
          }
        );
      });
    } catch (err) {
      return res.status(401).json({ message: "Invalid Firebase token", error: err.message });
    }
  }

  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.message });
    if (!results || results.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    const user = results[0];
    try {
      if (!user.password_hash) return res.status(401).json({ message: "Account uses Firebase authentication. Sign in with Firebase." });

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
      res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });
};

exports.firebaseAuth = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: "idToken required" });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) return res.status(400).json({ message: "Firebase token has no email" });

    const defaultRole = 'learner';

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });

      if (results && results.length > 0) {
        const user = results[0];
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
        return res.json({ token, user: { id: user.id, email: user.email } });
      }

      db.query(
        "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
        [email, '', defaultRole],
        (insertErr, insertRes) => {
          if (insertErr) return res.status(500).json({ message: "DB error", error: insertErr.message });
          const newId = insertRes.insertId;
          const token = jwt.sign({ id: newId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
          return res.json({ token, user: { id: newId, email } });
        }
      );
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid Firebase token", error: err.message });
  }
};

// Development convenience: return or create an admin user and issue JWT
exports.autoLogin = async (req, res) => {
  try {
    const devEmail = process.env.AUTO_LOGIN_EMAIL;
    const devPassword = process.env.AUTO_LOGIN_PASSWORD;
    console.log('auth.autoLogin called, AUTO_LOGIN_EMAIL=', devEmail ? devEmail : undefined);

    if (!devEmail || !devPassword) {
      return res.status(400).json({ message: 'AUTO_LOGIN_EMAIL and AUTO_LOGIN_PASSWORD must be set in .env' });
    }

    const [rows] = await db.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [devEmail]);
    console.log('auth.autoLogin DB rows length=', rows?.length || 0);

    if (!rows || rows.length === 0) {
      console.warn('auth.autoLogin account not found for', devEmail);
      return res.status(404).json({ message: 'Auto-login account not found' });
    }

    const user = rows[0];
    if (!user.password_hash) {
      console.warn('auth.autoLogin user has no password_hash stored', { email: devEmail });
      return res.status(401).json({ message: 'User has no password set' });
    }

    const match = await bcrypt.compare(devPassword, user.password_hash);
    if (!match) {
      console.warn('auth.autoLogin password mismatch for', devEmail);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    console.log('auth.autoLogin issuing token (masked)=', token?.slice?.(0,8) + '...');
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('auth.autoLogin error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.refreshToken = (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Verify the current token
    // Issue a new token with extended expiration
    const newToken = jwt.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token: newToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};