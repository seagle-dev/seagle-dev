const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

/**
 * Render the first page of a PDF buffer to a PNG buffer.
 * Uses pdf-poppler (native Poppler engine).
 * @param {Buffer} pdfBuffer - The raw PDF file content
 * @param {number} dpi - Render DPI (default 300 for good quality)
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateCoverFromPdf(pdfBuffer, dpi = 300) {
  console.log('[pdfCover] START - buffer size:', pdfBuffer?.length, 'bytes, DPI:', dpi);

  const tempDir = os.tmpdir();
  const tempId = uuidv4();
  const tempPdfPath = path.join(tempDir, `seagle_cover_${tempId}.pdf`);
  const outputPrefix = path.join(tempDir, `seagle_cover_${tempId}`);

  try {
    // 1. Write PDF buffer to temp file
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    console.log('[pdfCover] Temp PDF written to:', tempPdfPath);

    // 2. Convert page 1 to PNG using pdf-poppler
    const poppler = require('pdf-poppler');

    const opts = {
      format: 'png',
      out_dir: tempDir,
      out_prefix: `seagle_cover_${tempId}`,
      page: 1,
      scale: dpi,    // DPI: 300 = good quality, 600 = high quality
    };

    console.log('[pdfCover] Converting page 1 with pdf-poppler (DPI:', dpi, ')...');
    await poppler.convert(tempPdfPath, opts);
    console.log('[pdfCover] pdf-poppler conversion done');

    // 3. Find the output PNG file
    const expectedOutputPath = `${outputPrefix}-1.png`;

    let pngPath;
    if (fs.existsSync(expectedOutputPath)) {
      pngPath = expectedOutputPath;
    } else {
      const files = fs.readdirSync(tempDir).filter(f =>
        f.startsWith(`seagle_cover_${tempId}`) && f.endsWith('.png')
      );
      console.log('[pdfCover] Looking for output PNG. Found files:', files);
      if (files.length === 0) {
        throw new Error('pdf-poppler produced no output PNG');
      }
      pngPath = path.join(tempDir, files[0]);
    }

    // 4. Read the output PNG
    const pngBuffer = fs.readFileSync(pngPath);
    console.log('[pdfCover] ✅ PNG buffer created. Size:', pngBuffer.length, 'bytes');

    // 5. Log image dimensions for debugging
    // PNG header: bytes 16-19 = width, bytes 20-23 = height (big endian)
    if (pngBuffer.length > 24) {
      const width = pngBuffer.readUInt32BE(16);
      const height = pngBuffer.readUInt32BE(20);
      console.log('[pdfCover] ✅ Image dimensions:', width, 'x', height, 'pixels');
    }

    // 6. Clean up temp files
    safeDelete(pngPath);
    safeDelete(tempPdfPath);

    return pngBuffer;
  } catch (err) {
    safeDelete(tempPdfPath);
    try {
      const files = fs.readdirSync(tempDir).filter(f =>
        f.startsWith(`seagle_cover_${tempId}`)
      );
      files.forEach(f => safeDelete(path.join(tempDir, f)));
    } catch (e) { /* ignore */ }

    console.error('[pdfCover] ❌ Error:', err.message);
    throw err;
  }
}

function safeDelete(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.warn('[pdfCover] Failed to delete temp file:', filePath, e.message);
  }
}

module.exports = { generateCoverFromPdf };