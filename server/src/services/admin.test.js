const adminService = require('./admin.service');
const db = require('../config/db');
const storageService = require('./storage.service');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

jest.mock('./storage.service', () => ({
  uploadBuffer: jest.fn(),
  uploadFile: jest.fn(),
  deleteFileByPath: jest.fn(),
  getFileBuffer: jest.fn()
}));

jest.mock('./pdfCover.service', () => ({
  generateCoverFromPdf: jest.fn()
}));

describe('admin.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listBooks', () => {
    it('should return books list', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, title: 'Test' }] });
      const result = await adminService.listBooks();
      expect(result).toEqual([{ id: 1, title: 'Test' }]);
    });
  });

  describe('createMapping', () => {
    it('should throw error if required fields are missing', async () => {
      await expect(adminService.createMapping({})).rejects.toThrow('Missing fields');
    });

    it('should insert mapping and return id', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 10 }] });
      const result = await adminService.createMapping({
        book_id: 1,
        page_number: 1,
        x: 0.1, y: 0.1, width: 0.1, height: 0.1,
        model_id: 2
      });
      expect(result).toBe(10);
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteBook', () => {
    it('should fetch cover and pdf urls and delete them via storageService', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ cover_image: 'cover.jpg', pdf_url: 'book.pdf' }] }) // SELECT
        .mockResolvedValueOnce({}); // DELETE

      await adminService.deleteBook(1);

      expect(storageService.deleteFileByPath).toHaveBeenCalledWith('cover.jpg');
      expect(storageService.deleteFileByPath).toHaveBeenCalledWith('book.pdf');
      expect(db.query).toHaveBeenCalledWith('DELETE FROM books WHERE id = $1', [1]);
    });
  });
});
