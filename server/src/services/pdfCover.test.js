const mockContext = {
  fillStyle: '',
  fillRect: jest.fn(),
};
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => mockContext),
  toBuffer: jest.fn(),
};
const mockCreateCanvas = jest.fn(() => mockCanvas);
const mockGetDocument = jest.fn();

jest.mock('canvas', () => ({
  createCanvas: mockCreateCanvas,
  DOMMatrix: class DOMMatrix {},
  ImageData: class ImageData {},
}));

describe('pdfCover.service', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    mockCanvas.width = 0;
    mockCanvas.height = 0;
    mockCanvas.toBuffer.mockReturnValue(Buffer.from('mock png content'));

    await jest.unstable_mockModule('pdfjs-dist/legacy/build/pdf.mjs', () => ({
      getDocument: mockGetDocument,
    }));
  });

  it('generates a PNG buffer from the first page of a PDF buffer', async () => {
    const mockRender = jest.fn(() => ({ promise: Promise.resolve() }));
    const mockPage = {
      getViewport: jest.fn(({ scale }) => ({ width: 612 * scale, height: 792 * scale })),
      render: mockRender,
    };
    const mockPdf = {
      numPages: 1,
      getPage: jest.fn().mockResolvedValue(mockPage),
      destroy: jest.fn().mockResolvedValue(),
    };
    mockGetDocument.mockReturnValue({ promise: Promise.resolve(mockPdf) });

    const { generateCoverFromPdf } = require('./pdfCover.service');
    const result = await generateCoverFromPdf(Buffer.from('mock pdf content'));

    expect(mockGetDocument).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.any(Uint8Array),
      disableWorker: true,
      useSystemFonts: true,
    }));
    expect(mockPdf.getPage).toHaveBeenCalledWith(1);
    expect(mockCreateCanvas).toHaveBeenCalledWith(2550, 3300);
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 2550, 3300);
    expect(mockRender).toHaveBeenCalledWith(expect.objectContaining({
      canvasContext: mockContext,
      background: 'white',
    }));
    expect(result).toEqual(Buffer.from('mock png content'));
    expect(mockPdf.destroy).toHaveBeenCalled();
  });

  it('rejects empty or invalid PDF buffers', async () => {
    const { generateCoverFromPdf } = require('./pdfCover.service');

    await expect(generateCoverFromPdf(Buffer.alloc(0))).rejects.toThrow('PDF buffer is required');
    await expect(generateCoverFromPdf('not a buffer')).rejects.toThrow('PDF buffer is required');
  });

  it('wraps pdf.js rendering errors with cover-generation context', async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.reject(new Error('Invalid PDF structure')),
    });

    const { generateCoverFromPdf } = require('./pdfCover.service');

    await expect(generateCoverFromPdf(Buffer.from('bad pdf'))).rejects.toThrow(
      'Failed to generate PDF cover: Invalid PDF structure'
    );
  });
});
