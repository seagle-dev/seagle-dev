const homeService = require('./home.service');
const db = require('../config/db');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

describe('home.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentlyRead', () => {
    it('should return mapped recently read books', async () => {
      db.query.mockResolvedValue({
        rows: [{
          id: 1, title: 'Book 1', cover_image: 'cover1.jpg', pdf_url: 'book1.pdf',
          description: 'Desc 1', category: 'Cat 1', last_read_at: '2023-01-01'
        }]
      });

      const result = await homeService.getRecentlyRead(123);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1, title: 'Book 1', coverImage: 'cover1.jpg', pdfUrl: 'book1.pdf',
        description: 'Desc 1', category: 'Cat 1', lastReadAt: '2023-01-01'
      });
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT b.id, b.title'), [123]);
    });
  });

  describe('getTrending', () => {
    it('should return mapped trending books', async () => {
      db.query.mockResolvedValue({
        rows: [{
          id: 2, title: 'Book 2', cover_image: 'cover2.jpg', pdf_url: 'book2.pdf',
          category: 'Cat 2', read_count: '10'
        }]
      });

      const result = await homeService.getTrending();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 2, title: 'Book 2', coverImage: 'cover2.jpg', pdfUrl: 'book2.pdf',
        category: 'Cat 2', readCount: '10'
      });
    });
  });
});
