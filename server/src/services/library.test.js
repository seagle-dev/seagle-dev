jest.mock('../config/db', () => ({
  query: jest.fn()
}));

jest.mock('../utils/request', () => ({
  parsePositiveInt: jest.fn((val, def) => parseInt(val) || def)
}));

jest.mock('../utils/viewState', () => ({
  normalizeViewState: jest.fn(val => val ? JSON.parse(val) : null)
}));

const libraryService = require('./library.service');
const db = require('../config/db');

describe('library.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listBooks', () => {
    it('should query books without filters', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: 2 }] }) // COUNT query
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Book 1' }, { id: 2, title: 'Book 2' }] }); // SELECT query

      const result = await libraryService.listBooks({});
      
      expect(result.data.length).toBe(2);
      expect(result.pagination.totalItems).toBe(2);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should query books with search and category filters', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Test Book' }] });

      await libraryService.listBooks({ search: 'Test', category: 'Science' });
      
      const countCallArgs = db.query.mock.calls[0];
      expect(countCallArgs[0]).toContain('b.title LIKE $1');
      expect(countCallArgs[0]).toContain('b.category = $2');
      expect(countCallArgs[1]).toEqual(['%Test%', 'Science']);
    });
  });

  describe('listModels', () => {
    it('should return models with default pagination', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Model 1' }] });

      const result = await libraryService.listModels({});
      expect(result.data[0].name).toBe('Model 1');
      expect(result.pagination.totalItems).toBe(1);
    });
  });

  describe('getMappings', () => {
    it('should return mappings for book and page', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, label: 'Fig 1' }] });

      const result = await libraryService.getMappings(1, 2);
      expect(result.length).toBe(1);
      expect(db.query.mock.calls[0][0]).toContain('WHERE m.book_id = $1 AND m.page_number = $2');
      expect(db.query.mock.calls[0][1]).toEqual([1, 2]);
    });
  });

  describe('getBookMappings', () => {
    it('should fetch and normalize mappings for a book', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, book_id: 1, model_view_state: '{"zoom":1}' }] });

      const result = await libraryService.getBookMappings(1);
      
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result[0].model_view_state).toEqual({ zoom: 1 });
    });
  });
});
