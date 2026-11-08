jest.mock('../config/firebase', () => {
  const bucket = { file: jest.fn() };
  return { storage: () => ({ bucket: () => bucket }) };
});

const admin = require('../config/firebase');
const storageService = require('./storage.service');
const bucket = admin.storage().bucket();

jest.mock('crypto', () => ({ randomUUID: jest.fn(() => 'test-uuid-1234') }));

describe('storage.service', () => {
  let file;

  beforeEach(() => {
    jest.clearAllMocks();
    file = {
      save: jest.fn().mockResolvedValue(undefined),
      download: jest.fn(),
      getMetadata: jest.fn(),
      exists: jest.fn(),
      createReadStream: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    bucket.file.mockReturnValue(file);
  });

  it('uploads buffers with their content type', async () => {
    const buffer = Buffer.from('test');
    await expect(storageService.uploadBuffer(buffer, 'books/a.pdf', 'application/pdf'))
      .resolves.toBe('books/a.pdf');
    expect(bucket.file).toHaveBeenCalledWith('books/a.pdf');
    expect(file.save).toHaveBeenCalledWith(buffer, {
      resumable: false,
      metadata: { contentType: 'application/pdf' },
    });
  });

  it('creates a UUID object name for uploaded files', async () => {
    await storageService.uploadFile({
      originalname: 'my_doc.PDF', buffer: Buffer.from('test'), mimetype: 'application/pdf',
    }, 'books');
    expect(bucket.file).toHaveBeenCalledWith('books/test-uuid-1234.pdf');
  });

  it('downloads an object buffer and returns null for a missing object', async () => {
    const buffer = Buffer.from('stored');
    file.download.mockResolvedValue([buffer]);
    await expect(storageService.getFileBuffer('books/a.pdf')).resolves.toBe(buffer);
    file.download.mockRejectedValue({ code: 404 });
    await expect(storageService.getFileBuffer('missing.pdf')).resolves.toBeNull();
  });

  it('returns a readable stream and object metadata', async () => {
    const stream = {};
    file.getMetadata.mockResolvedValue([{ contentType: 'image/png', size: '42' }]);
    file.exists.mockResolvedValue([true]);
    file.createReadStream.mockReturnValue(stream);
    await expect(storageService.getFileStream('covers/a.png')).resolves.toEqual({
      stream, contentType: 'image/png', size: 42,
    });
  });

  it('deletes an object and ignores an empty path', async () => {
    await storageService.deleteFileByPath('books/a.pdf');
    expect(file.delete).toHaveBeenCalledWith({ ignoreNotFound: true });
    await storageService.deleteFileByPath(null);
    expect(bucket.file).toHaveBeenCalledTimes(1);
  });
});
