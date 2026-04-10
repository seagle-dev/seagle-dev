const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const libraryController = require('../controllers/library.controller');

router.get('/books', libraryController.getBooks);
router.get('/models', libraryController.getModels);
router.get('/mappings', verifyToken, libraryController.getMappings);

module.exports = router;