const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/firebase', authController.firebaseAuth);
router.get('/auto', authController.autoLogin);
router.post('/refresh', authController.refreshToken);

module.exports = router;