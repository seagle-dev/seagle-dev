const db = require('../config/db');

async function verifyAdmin(req, res, next) {
  try {
    console.log('verifyAdmin called', { user: req.user });
    if (!req.user || !req.user.id) {
      console.warn('verifyAdmin unauthorized: no req.user');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { rows } = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    console.log('verifyAdmin DB role rows length=', rows?.length || 0);
    if (!rows || rows.length === 0) {
      console.warn('verifyAdmin user not found', { id: req.user.id });
      return res.status(401).json({ message: 'User not found' });
    }
    const role = rows[0].role;
    console.log('verifyAdmin found role=', role);
    
    // Added logging to explicitly check if user is admin
    if (role === 'admin' || role === 'superadmin') {
      console.log('verifyAdmin: User is admin (role:', role, ') - access granted');
      next();
    } else {
      console.warn('verifyAdmin: User is NOT admin (role:', role, ') - access denied');
      return res.status(403).json({ message: 'Admin access required' });
    }
  } catch (err) {
    console.error('verifyAdmin error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { verifyAdmin };