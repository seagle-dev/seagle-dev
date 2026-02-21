require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'change_this_secret';
const token = jwt.sign({ id: 1, email: 'alice@example.com' }, secret, { expiresIn: '7d' });
console.log(token);