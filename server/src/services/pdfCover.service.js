const {
  createCanvas,
  DOMMatrix,
  Image,
  ImageData,
} = require('canvas');

const PDFJS_RENDERER = 'pdfjs-dist/legacy/build/pdf.mjs';
const DEFAULT_DPI = 300;
const PDF_POINTS_PER_INCH = 72;
const MAX_CANVAS_PIXELS = 20_000_000;

let pdfjsPromise;

function ensurePdfJsPolyfills() {
  disableBrowserImageApi('createImageBitmap');
  disableBrowserImageApi('OffscreenCanvas');
  disableBrowserImageApi('ImageDecoder');

  if (typeof globalThis.DOMMatrix === 'undefined' && DOMMatrix) {
    globalThis.DOMMatrix = DOMMatrix;
  }

  if (typeof globalThis.ImageData === 'undefined' && ImageData) {
    globalThis.ImageData = ImageData;
  }

  if (typeof globalThis.Image === 'undefined' && Image) {
    globalThis.Image = Image;
  }
}

function disableBrowserImageApi(name) {
  if (typeof globalThis[name] === 'undefined') return;

  try {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: undefined,
    });
  } catch (err) {
    console.warn(`[pdfCover] Could not disable ${name}:`, err.message);
  }
}

async function loadPdfJs() {
  if (!pdfjsPromise) {
    ensurePdfJsPolyfills();
    pdfjsPromise = import(PDFJS_RENDERER);
  }

  return pdfjsPromise;
}

class NodeCanvasFactory {
  create(width, height) {
    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid canvas size: ${width}x${height}`);
    }

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  reset(canvasAndContext, width, height) {
    if (!canvasAndContext.canvas) {
      throw new Error('Canvas is not specified');
    }

    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid canvas size: ${width}x${height}`);
    }

    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext) {
    if (!canvasAndContext.canvas) return;

    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

function calculateRenderScale(viewport, dpi) {
  const requestedScale = dpi / PDF_POINTS_PER_INCH;
  const requestedPixels = viewport.width * requestedScale * viewport.height * requestedScale;

  if (requestedPixels <= MAX_CANVAS_PIXELS) {
    return requestedScale;
  }

  return Math.sqrt(MAX_CANVAS_PIXELS / (viewport.width * viewport.height));
}

/**
 * Render the first page of a PDF buffer to a PNG buffer.
 * Uses pdfjs-dist and node-canvas, avoiding Poppler binaries and temp files.
 * @param {Buffer} pdfBuffer - The raw PDF file content
 * @param {number} dpi - Render DPI (default 300 for good quality)
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateCoverFromPdf(pdfBuffer, dpi = DEFAULT_DPI) {
  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new Error('PDF buffer is required to generate a cover');
  }

  const targetDpi = Number.isFinite(dpi) && dpi > 0 ? dpi : DEFAULT_DPI;
  console.log('[pdfCover] START - buffer size:', pdfBuffer.length, 'bytes, DPI:', targetDpi);

  let pdf;
  let canvasAndContext;
  const canvasFactory = new NodeCanvasFactory();

  try {
    const { getDocument } = await loadPdfJs();
    const loadingTask = getDocument({
      data: new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength),
      disableWorker: true,
      isImageDecoderSupported: false,
      isOffscreenCanvasSupported: false,
      canvasMaxAreaInBytes: MAX_CANVAS_PIXELS * 4,
      useSystemFonts: true,
    });

    pdf = await loadingTask.promise;

    if (!pdf.numPages) {
      throw new Error('PDF has no pages');
    }

    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = calculateRenderScale(baseViewport, targetDpi);
    const viewport = page.getViewport({ scale });
    const width = Math.max(1, Math.round(viewport.width));
    const height = Math.max(1, Math.round(viewport.height));

    console.log('[pdfCover] Rendering page 1 at', width, 'x', height, 'pixels');

    canvasAndContext = canvasFactory.create(width, height);
    canvasAndContext.context.fillStyle = '#ffffff';
    canvasAndContext.context.fillRect(0, 0, width, height);

    await page.render({
      canvasContext: canvasAndContext.context,
      viewport,
      canvasFactory,
      background: 'white',
    }).promise;

    const pngBuffer = canvasAndContext.canvas.toBuffer('image/png');
    if (!pngBuffer || pngBuffer.length === 0) {
      throw new Error('PDF cover rendering produced an empty PNG');
    }

    console.log('[pdfCover] PNG buffer created. Size:', pngBuffer.length, 'bytes');
    return pngBuffer;
  } catch (err) {
    console.error('[pdfCover] Error generating PDF cover:', err.message);
    throw new Error(`Failed to generate PDF cover: ${err.message}`);
  } finally {
    if (canvasAndContext) {
      canvasFactory.destroy(canvasAndContext);
    }

    if (pdf) {
      try {
        await pdf.destroy();
      } catch (err) {
        console.warn('[pdfCover] Failed to destroy PDF document:', err.message);
      }
    }
  }
}

module.exports = { generateCoverFromPdf };
