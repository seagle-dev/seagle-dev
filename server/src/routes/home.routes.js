const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const homeController = require('../controllers/home.controller');

router.get('/', verifyToken, homeController.getHome);

module.exports = router;