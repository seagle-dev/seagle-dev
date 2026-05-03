const express = require('express');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/firebase', authController.firebaseAuth);
router.get('/auto', authController.autoLogin);
router.post('/refresh', authController.refreshToken);
router.get('/profile', verifyToken, authController.profile);

module.exports = router;
