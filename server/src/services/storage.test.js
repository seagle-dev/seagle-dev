const storageService = require('./storage.service');
const db = require('../config/db');
const crypto = require('crypto');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234')
}));

describe('storage.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadBuffer', () => {
    it('should insert buffer into file_storage table', async () => {
      db.query.mockResolvedValue([{ insertId: 1 }]);
      
      const buffer = Buffer.from('test data');
      const destPath = 'test/path.pdf';
      const contentType = 'application/pdf';

      const result = await storageService.uploadBuffer(buffer, destPath, contentType);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query.mock.calls[0][0]).toContain('INSERT INTO file_storage');
      expect(db.query.mock.calls[0][1]).toEqual([destPath, contentType, buffer]);
      expect(result).toBe(destPath);
    });

    it('should throw an error if db query fails', async () => {
      db.query.mockRejectedValue(new Error('DB Error'));
      
      await expect(
        storageService.uploadBuffer(Buffer.from('test'), 'path', 'type')
      ).rejects.toThrow('DB Error');
    });
  });

  describe('uploadFile', () => {
    it('should extract extension and generate uuid filename', async () => {
      db.query.mockResolvedValue([{}]);
      
      const file = {
        originalname: 'my_doc.PDF',
        buffer: Buffer.from('test'),
        mimetype: 'application/pdf'
      };

      const result = await storageService.uploadFile(file, 'books');

      expect(result).toBe('books/test-uuid-1234.pdf');
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFileBuffer', () => {
    it('should return null if filePath is missing', async () => {
      const result = await storageService.getFileBuffer(null);
      expect(result).toBeNull();
    });

    it('should return buffer if found in db', async () => {
      const mockBuffer = Buffer.from('db data');
      db.query.mockResolvedValue({ rows: [{ file_data: mockBuffer }] });

      const result = await storageService.getFileBuffer('test/path.pdf');

      expect(db.query).toHaveBeenCalledWith('SELECT file_data FROM file_storage WHERE file_path = $1', ['test/path.pdf']);
      expect(result).toBe(mockBuffer);
    });

    it('should return null if not found in db', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await storageService.getFileBuffer('test/path.pdf');
      expect(result).toBeNull();
    });
  });

  describe('deleteFileByPath', () => {
    it('should execute delete query', async () => {
      db.query.mockResolvedValue([{}]);
      
      await storageService.deleteFileByPath('test/path.pdf');
      
      expect(db.query).toHaveBeenCalledWith('DELETE FROM file_storage WHERE file_path = $1', ['test/path.pdf']);
    });
  });
});
