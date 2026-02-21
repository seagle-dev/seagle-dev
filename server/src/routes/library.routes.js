const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/library.controller');

router.get('/books', libraryController.getBooks);
router.get('/models', libraryController.getModels);

module.exports = router;