const adminService = require('../services/admin.service');
const { getFileStream } = require('../services/storage.service');
const asyncHandler = require('../utils/asyncHandler');
const { requirePositiveInt } = require('../utils/request');
const { getBookUrls, getModelUrls } = require('../utils/responseUrls');
const { parseModelViewState } = require('../utils/viewState');

// ==================== FILE STREAMING (PROXY) ====================

function sendControllerError(res, err, fallbackMessage = 'Server error') {
  if (res.headersSent) return;
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: statusCode === 500 ? fallbackMessage : err.message,
    ...(statusCode === 500 && err.message ? { error: err.message } : {}),
  });
}

/**
 * Generic helper: stream a GCS file through Express.
 * Sets proper Content-Type, Content-Length, caching, and CORS headers.
 */
async function streamGcsFile(gcsPath, res, fallbackContentType) {
  if (!gcsPath) {
    return res.status(404).json({ message: 'File not found' });
  }

  const result = await getFileStream(gcsPath);
  if (!result) {
    return res.status(404).json({ message: 'File not found in storage' });
  }

  const { stream, contentType, size } = result;

  // Set headers
  res.set('Content-Type', contentType || fallbackContentType);
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.set('Cache-Control', 'public, max-age=86400'); // 1 day cache
  if (size) {
    res.set('Content-Length', String(size));
  }

  // Handle stream errors
  stream.on('error', (err) => {
    console.error('Stream error for', gcsPath, ':', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to stream file' });
    }
  });

  stream.pipe(res);
}

// ==================== BOOKS ====================

const getBooks = asyncHandler(async (req, res) => {
  console.log('DEBUG: getBooks endpoint hit at', new Date().toISOString());
  const books = await adminService.listBooks();
  const booksWithUrls = (Array.isArray(books) ? books : []).map(book => {
    const urls = getBookUrls(req, book.id);
    return {
      ...book,
      cover_image: book.cover_image ? urls.cover : null,
      pdf_url: book.pdf_url ? urls.pdf : null,
    };
  });

  return res.status(200).json({ data: booksWithUrls });
});

async function getBookPdf(req, res) {
  try {
    const id = requirePositiveInt(req.params.id, 'Invalid book id');

    const pdfPath = await adminService.getBookPdfPath(id);
    await streamGcsFile(pdfPath, res, 'application/pdf');
  } catch (err) {
    console.error('getBookPdf error', err);
    sendControllerError(res, err);
  }
}

async function getBookCover(req, res) {
  try {
    const id = requirePositiveInt(req.params.id, 'Invalid book id');

    const coverPath = await adminService.getBookCoverPath(id);
    await streamGcsFile(coverPath, res, 'image/png');
  } catch (err) {
    console.error('getBookCover error', err);
    sendControllerError(res, err);
  }
}

const uploadBook = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

  const { title, description, category } = req.body;
  const result = await adminService.createBook({
    title: title || req.file.originalname.replace(/\.pdf$/i, ''),
    description,
    category,
    pdfFile: req.file,
    uploadedBy: req.user?.id,
  });

  const urls = getBookUrls(req, result.id);
  result.cover_image = result.cover_image ? urls.cover : null;
  result.pdf_url = urls.pdf;

  return res.status(201).json({ data: result });
});

async function removeBook(req, res) {
  try {
    const id = requirePositiveInt(req.params.id, 'Invalid book id');
    await adminService.deleteBook(id);
    return res.status(204).send();
  } catch (err) {
    console.error('removeBook error', err);
    return sendControllerError(res, err);
  }
}

// ==================== MODELS ====================

const getModels = asyncHandler(async (req, res) => {
  const models = await adminService.listModels();
  const modelsWithUrls = models.map(model => {
    const urls = getModelUrls(req, model.id);
    return {
      ...model,
      file_url: model.file_url ? urls.file : null,
      thumbnail: model.thumbnail ? urls.thumbnail : null,
    };
  });

  res.json({ data: modelsWithUrls });
});

async function getModelFile(req, res) {
  try {
    const id = requirePositiveInt(req.params.id, 'Invalid model id');

    const filePath = await adminService.getModelFilePath(id);
    if (!filePath) return res.status(404).json({ message: 'Model file not found' });

    // Determine content type from extension
    const ext = filePath.split('.').pop().toLowerCase();
    const contentTypeMap = {
      'glb': 'model/gltf-binary',
      'gltf': 'model/gltf+json',
    };

    await streamGcsFile(filePath, res, contentTypeMap[ext] || 'application/octet-stream');
  } catch (err) {
    console.error('getModelFile error', err);
    sendControllerError(res, err);
  }
}

async function getModelThumbnail(req, res) {
  try {
    const id = requirePositiveInt(req.params.id, 'Invalid model id');

    const thumbPath = await adminService.getModelThumbnailPath(id);
    await streamGcsFile(thumbPath, res, 'image/png');
  } catch (err) {
    console.error('getModelThumbnail error', err);
    sendControllerError(res, err);
  }
}

const uploadModel = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: '3D model file is required' });

  const { name, category } = req.body;
  const result = await adminService.createModel({
    name: name || req.file.originalname.replace(/\.(glb|gltf)$/i, ''),
    category,
    modelFile: req.file,
    uploadedBy: req.user?.id,
  });

  const urls = getModelUrls(req, result.id);
  result.file_url = urls.file;
  result.thumbnail = null;

  return res.status(201).json({ data: result });
});

const uploadModelThumbnail = asyncHandler(async (req, res) => {
  const modelId = requirePositiveInt(req.params.id, 'Invalid model id');
  if (!req.file) return res.status(400).json({ message: 'Thumbnail image required' });

  const parsedViewState = parseModelViewState(req.body?.viewState);
  if (req.body?.viewState && !parsedViewState) {
    console.warn('Invalid viewState JSON for model', modelId);
  }

  await adminService.updateModelThumbnail(modelId, req.file.buffer, parsedViewState);

  const thumbnailUrl = getModelUrls(req, modelId).thumbnail;
  return res.json({ data: { thumbnail: thumbnailUrl, view_state: parsedViewState } });
});

const updateModelViewState = asyncHandler(async (req, res) => {
  const modelId = requirePositiveInt(req.params.id, 'Invalid model id');
  const viewState = parseModelViewState(req.body?.viewState || req.body);
  
  if (!viewState) {
    return res.status(400).json({ message: 'Invalid viewState provided' });
  }

  await adminService.updateModelViewState(modelId, viewState);
  return res.json({ data: { view_state: viewState } });
});

async function removeModel(req, res) {
  try {
    const id = requirePositiveInt(req.params.id, 'Invalid model id');
    await adminService.deleteModel(id);
    return res.status(204).send();
  } catch (err) {
    console.error('removeModel error', err);
    return sendControllerError(res, err);
  }
}

// ==================== MAPPINGS ====================

async function createMapping(req, res) {
  try {
    const payload = req.body;
    const mappingId = await adminService.createMapping(payload, req.user.id);
    res.status(201).json({ id: mappingId });
  } catch (err) {
    console.error('createMapping error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getMappings(req, res) {
  try {
    const bookId = requirePositiveInt(req.query.book_id, 'book_id and page required');
    const page = requirePositiveInt(req.query.page, 'book_id and page required');
    const mappings = await adminService.getMappings(bookId, page);
    res.json({ data: mappings });
  } catch (err) {
    console.error('getMappings error', err);
    sendControllerError(res, err);
  }
}

async function deleteMapping(req, res) {
  try {
    const id = requirePositiveInt(req.params.id, 'Invalid id');
    await adminService.deleteMapping(id);
    res.status(204).send();
  } catch (err) {
    console.error('deleteMapping error', err);
    sendControllerError(res, err);
  }
}

async function detectImages(req, res) {
  try {
    const bookId = requirePositiveInt(req.params.id, 'book id and page query param required');
    const page = requirePositiveInt(req.query.page, 'book id and page query param required');

    const detections = await adminService.detectImagesOnPage(bookId, page);
    return res.json({ data: detections });
  } catch (err) {
    console.error('detectImages error', err);
    return sendControllerError(res, err, 'Detection failed');
  }
}

module.exports = {
  getBooks, getBookPdf, getBookCover, uploadBook, removeBook,
  getModels, getModelFile, getModelThumbnail, uploadModel, uploadModelThumbnail, removeModel, updateModelViewState,
  createMapping, getMappings, deleteMapping, detectImages
};
