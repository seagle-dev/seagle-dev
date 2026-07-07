jest.mock('crypto', () => ({
  randomUUID: () => 'test-uuid'
}));

jest.mock('fs');
jest.mock('pdf-poppler');

const { generateCoverFromPdf } = require('./pdfCover.service');
const fs = require('fs');
const poppler = require('pdf-poppler');
describe('pdfCover.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a PNG buffer from PDF buffer', async () => {
    const mockPdfBuffer = Buffer.from('mock pdf content');
    const mockPngBuffer = Buffer.from('mock png content');

    // Mock fs functions
    fs.writeFileSync.mockImplementation(() => {});
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(mockPngBuffer);
    fs.unlinkSync.mockImplementation(() => {});

    // Mock poppler convert
    poppler.convert.mockResolvedValue();

    const result = await generateCoverFromPdf(mockPdfBuffer);

    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(poppler.convert).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(result).toBe(mockPngBuffer);
  });

  it('should throw error if no PNG is produced', async () => {
    const mockPdfBuffer = Buffer.from('mock pdf content');

    // Mock fs functions
    fs.writeFileSync.mockImplementation(() => {});
    fs.existsSync.mockReturnValue(false); // PNG not found
    fs.readdirSync.mockReturnValue([]); // No alternative PNGs found
    fs.unlinkSync.mockImplementation(() => {});

    // Mock poppler convert
    poppler.convert.mockResolvedValue();

    await expect(generateCoverFromPdf(mockPdfBuffer)).rejects.toThrow('pdf-poppler produced no output PNG');
  });
});
