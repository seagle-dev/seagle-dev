const libraryService = require('../services/library.service');

function parsePositiveInt(value, fallback) {
  const v = parseInt(value, 10);
  return Number.isInteger(v) && v > 0 ? v : fallback;
}

async function getBooks(req, res) {
  try {
    const search = req.query.search || null;
    const category = req.query.category || null;
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const sort = (req.query.sort || 'newest').toLowerCase(); // newest | trending

    const result = await libraryService.listBooks({ search, category, page, limit, sort });
    return res.json(result);
  } catch (err) {
    console.error('getBooks error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getModels(req, res) {
  try {
    const search = req.query.search || null;
    const category = req.query.category || null;
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);

    const result = await libraryService.listModels({ search, category, page, limit });
    return res.json(result);
  } catch (err) {
    console.error('getModels error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getMappings(req, res) {
  try {
    const bookId = req.query.book_id ? parseInt(req.query.book_id, 10) : null;
    const page = req.query.page ? parseInt(req.query.page, 10) : null;
    if (!bookId || !page) {
      return res.status(400).json({ message: 'book_id and page query params required' });
    }
    const mappings = await libraryService.getMappings(bookId, page);
    return res.json({ data: mappings });
  } catch (err) {
    console.error('getMappings error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getBookMappings(req, res) {
  try {
    const bookId = req.params.bookId ? parseInt(req.params.bookId, 10) : null;
    if (!bookId) {
      return res.status(400).json({ message: 'Valid book id required' });
    }

    const mappings = await libraryService.getBookMappings(bookId);
    return res.json({ data: mappings });
  } catch (err) {
    console.error('getBookMappings error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getBooks, getModels, getMappings, getBookMappings };
