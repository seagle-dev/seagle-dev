const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.min.mjs');

/**
 * Render the first page of a PDF buffer to a PNG buffer.
 * @param {Buffer} pdfBuffer - The raw PDF file content
 * @param {number} scale - Render scale (default 1.5)
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateCoverFromPdf(pdfBuffer, scale = 1.5) {
  // Load the PDF document from buffer
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    disableWorker: true,
    standardFontDataUrl: undefined,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });

  // Create a node-canvas
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  // pdf.js needs a CanvasFactory for node environments
  const canvasFactory = {
    create(w, h) {
      const c = createCanvas(w, h);
      return { canvas: c, context: c.getContext('2d') };
    },
    reset(canvasAndContext, w, h) {
      canvasAndContext.canvas.width = w;
      canvasAndContext.canvas.height = h;
    },
    destroy(canvasAndContext) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
    },
  };

  // Render page 1 to canvas
  await page.render({
    canvasContext: context,
    viewport,
    canvasFactory,
  }).promise;

  // Return as PNG buffer
  return canvas.toBuffer('image/png');
}

module.exports = { generateCoverFromPdf };