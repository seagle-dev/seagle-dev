// Removed: const fs = require('fs');
// Removed: const path = require('path');

const matIdentity = () => [1, 0, 0, 1, 0, 0];
const matCopy = (m) => (m ? m.slice() : matIdentity());
const matMul = (a, b) => {
  const [a0, a1, a2, a3, a4, a5] = a;
  const [b0, b1, b2, b3, b4, b5] = b;
  return [
    a0 * b0 + a2 * b1,
    a1 * b0 + a3 * b1,
    a0 * b2 + a2 * b3,
    a1 * b2 + a3 * b3,
    a0 * b4 + a2 * b5 + a4,
    a1 * b4 + a3 * b5 + a5
  ];
};

const figRegex = /\b(?:Figure|Fig\.?)\s*\d+(?:\.\d+)*/i;

function findTitleForLineIndex(lines, idx) {
  const line = lines[idx];
  if (!line) return null;
  const m = figRegex.exec(line.text);
  if (m) {
    const after = line.text.slice(m.index + m[0].length).trim();
    if (after && after.length > 3) return after;
    for (let j = idx + 1; j <= idx + 2 && j < lines.length; j++) {
      const cand = lines[j].text;
      if (cand && cand.length > 3 && /^[A-Z0-9]/.test(cand)) return cand;
    }
    for (let j = idx - 1; j >= Math.max(0, idx - 2); j--) {
      const cand = lines[j].text;
      if (cand && cand.length > 3 && /^[A-Z0-9]/.test(cand)) return cand;
    }
  }
  return null;
}

/**
 * Detect images on a single page of a PDF.
 * Now accepts a Buffer instead of a file path (for GCS compatibility).
 * @param {Buffer} pdfBuffer - The PDF file content as a buffer
 * @param {number} pageNum - Page number (1-based)
 * @returns {Promise<object>} Detection results with normalized coordinates
 */
async function detectImagesOnPage(pdfBuffer, pageNum) {
  // Dynamically import the pdfjs v5 ESM build
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { getDocument, OPS } = pdfjs;
  const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer), disableWorker: true });
  const pdf = await loadingTask.promise;

  if (pageNum < 1 || pageNum > pdf.numPages) {
    throw new Error(`Page ${pageNum} out of range (1-${pdf.numPages})`);
  }

  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  const pageWidth = viewport.width;
  const pageHeight = viewport.height;

  const opList = await page.getOperatorList();
  const ctmStack = [matIdentity()];
  let currentCTM = matCopy(ctmStack[0]);

  const rawImages = [];

  for (let i = 0, len = opList.fnArray.length; i < len; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];

    if (fn === OPS.save) {
      ctmStack.push(matCopy(currentCTM));
      continue;
    }
    if (fn === OPS.restore) {
      ctmStack.pop();
      currentCTM = matCopy(ctmStack[ctmStack.length - 1] || matIdentity());
      continue;
    }
    if (fn === OPS.transform && Array.isArray(args) && args.length >= 6) {
      currentCTM = matMul(currentCTM, args);
      ctmStack[ctmStack.length - 1] = matCopy(currentCTM);
      continue;
    }

    if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintInlineImageXObject) {
      let matrixForImage = null;
      const prevFn = opList.fnArray[i - 1];
      const prevArgs = opList.argsArray[i - 1];
      if (prevFn === OPS.transform && Array.isArray(prevArgs) && prevArgs.length >= 6) {
        matrixForImage = matMul(ctmStack[ctmStack.length - 1] || matIdentity(), prevArgs);
      }
      if (!matrixForImage) matrixForImage = matCopy(currentCTM);

      let intrinsicW = null, intrinsicH = null;
      if (fn === OPS.paintInlineImageXObject && Array.isArray(args) && args.length > 0) {
        try {
          const inlineInfo = args[0];
          if (inlineInfo && typeof inlineInfo === 'object') {
            if (typeof inlineInfo.width === 'number') intrinsicW = inlineInfo.width;
            if (typeof inlineInfo.height === 'number') intrinsicH = inlineInfo.height;
          }
        } catch (e) { }
      }

      const [a, b, c, d, e, f] = matrixForImage;
      let w, h, x, y;
      if (intrinsicW && intrinsicH) {
        const scaleX = Math.sqrt(a * a + b * b);
        const scaleY = Math.sqrt(c * c + d * d);
        w = intrinsicW * scaleX;
        h = intrinsicH * scaleY;
        x = e;
        y = viewport.height - f - h;
      } else {
        w = Math.sqrt(a * a + b * b);
        h = Math.sqrt(c * c + d * d);
        x = e;
        y = viewport.height - f - h;
      }

      // Filter out tiny images (optional)
      if (w / pageWidth < 0.05 || h / pageHeight < 0.05) continue;

      rawImages.push({
        id: `img_${pageNum}_${i}`,
        x, y, width: w, height: h
      });
    }
  }

  // Extract text for figure labels
  let textLines = [];
  try {
    const textContent = await page.getTextContent();
    const items = textContent.items || [];
    const textItems = [];
    for (const it of items) {
      const tr = it.transform || [1, 0, 0, 1, 0, 0];
      const tx = tr[4];
      const ty = viewport.height - tr[5];
      const s = (it.str || '').trim();
      if (s) textItems.push({ str: s, x: tx, y: ty });
    }

    const linesMap = Object.create(null);
    for (const t of textItems) {
      const key = Math.round(t.y / 4) * 4;
      (linesMap[key] || (linesMap[key] = [])).push(t);
    }

    textLines = Object.entries(linesMap)
      .map(([key, arr]) => {
        arr.sort((a, b) => a.x - b.x);
        return { y: Number(key), text: arr.map(x => x.str).join(' ').trim() };
      })
      .sort((a, b) => a.y - b.y);
  } catch (e) { }

  // Associate figure labels with images
  const detectedImages = rawImages.map((img) => {
    const imgBottom = img.y + img.height;
    let figureLabel = null;
    let figureTitle = null;

    for (let li = 0; li < textLines.length; li++) {
      const ln = textLines[li];
      const verticalOK =
        (ln.y >= imgBottom - 8 && ln.y <= imgBottom + 160) ||
        (Math.abs(ln.y - imgBottom) <= 32) ||
        (ln.y >= img.y - 40 && ln.y <= img.y + img.height + 40);

      if (verticalOK) {
        const m = figRegex.exec(ln.text);
        if (m) {
          figureLabel = m[0].replace(/\s+/g, ' ').trim();
          figureTitle = findTitleForLineIndex(textLines, li);
          if (figureTitle) break;
        }
      }
    }

    return {
      id: img.id,
      x: img.x / viewport.width,
      y: img.y / viewport.height,
      width: img.width / viewport.width,
      height: img.height / viewport.height,
      figureLabel: figureLabel || null,
      figureTitle: figureTitle || null,
    };
  });

  return {
    pageNum,
    pageWidth: viewport.width,
    pageHeight: viewport.height,
    images: detectedImages,
  };
}

module.exports = { detectImagesOnPage };