const libraryService = require('../services/library.service');
const asyncHandler = require('../utils/asyncHandler');
const { parsePositiveInt, requirePositiveInt } = require('../utils/request');

const getBooks = asyncHandler(async (req, res) => {
  const search = req.query.search || null;
  const category = req.query.category || null;
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 10);
  const sort = (req.query.sort || 'newest').toLowerCase(); // newest | trending

  const result = await libraryService.listBooks({ search, category, page, limit, sort });
  return res.json(result);
});

const getModels = asyncHandler(async (req, res) => {
  const search = req.query.search || null;
  const category = req.query.category || null;
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 10);

  const result = await libraryService.listModels({ search, category, page, limit });
  return res.json(result);
});

const getMappings = asyncHandler(async (req, res) => {
  const bookId = requirePositiveInt(req.query.book_id, 'book_id and page query params required');
  const page = requirePositiveInt(req.query.page, 'book_id and page query params required');
  const mappings = await libraryService.getMappings(bookId, page);
  return res.json({ data: mappings });
});

const getBookMappings = asyncHandler(async (req, res) => {
  const bookId = requirePositiveInt(req.params.bookId, 'Valid book id required');
  const mappings = await libraryService.getBookMappings(bookId);
  return res.json({ data: mappings });
});

module.exports = { getBooks, getModels, getMappings, getBookMappings };
