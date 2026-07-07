const request = require('supertest');
const app = require('../app');
const libraryService = require('../services/library.service');
const adminService = require('../services/admin.service'); // for getBookPdfPath
const storageService = require('../services/storage.service');

jest.mock('../services/library.service', () => ({
  listBooks: jest.fn(),
  listModels: jest.fn(),
  getBookMappings: jest.fn()
}));

jest.mock('../services/admin.service', () => ({
  getBookPdfPath: jest.fn()
}));

jest.mock('../services/storage.service', () => ({
  getFileBuffer: jest.fn()
}));

describe('Library Controller Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/library/books', () => {
    it('should return books from libraryService', async () => {
      libraryService.listBooks.mockResolvedValue({
        data: [{ id: 1, title: 'Book 1' }],
        pagination: { totalItems: 1, page: 1, limit: 10, totalPages: 1 }
      });

      const response = await request(app).get('/api/library/books');
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.totalItems).toBe(1);
    });
  });
});
