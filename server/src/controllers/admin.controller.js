const adminService = require('../services/admin.service');
const { getFileStream } = require('../services/storage.service');

// ==================== FILE STREAMING (PROXY) ====================

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

async function getBooks(req, res) {
  console.log('DEBUG: getBooks endpoint hit at', new Date().toISOString());
  try {
    const books = await adminService.listBooks();

    // Convert GCS paths to proxy URLs for the frontend
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const booksWithUrls = (Array.isArray(books) ? books : []).map(book => ({
      ...book,
      cover_image: book.cover_image ? `${baseUrl}/api/admin/books/${book.id}/cover` : null,
      pdf_url: book.pdf_url ? `${baseUrl}/api/admin/books/${book.id}/pdf` : null,
    }));

    return res.status(200).json({ data: booksWithUrls });
  } catch (err) {
    console.error('admin.getBooks error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getBookPdf(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid book id' });

    const pdfPath = await adminService.getBookPdfPath(id);
    await streamGcsFile(pdfPath, res, 'application/pdf');
  } catch (err) {
    console.error('getBookPdf error', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

async function getBookCover(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid book id' });

    const coverPath = await adminService.getBookCoverPath(id);
    await streamGcsFile(coverPath, res, 'image/png');
  } catch (err) {
    console.error('getBookCover error', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

async function uploadBook(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

    const { title, description, category } = req.body;
    const result = await adminService.createBook({
      title: title || req.file.originalname.replace(/\.pdf$/i, ''),
      description,
      category,
      pdfFile: req.file,
      uploadedBy: req.user?.id,
    });

    // Convert to proxy URLs in response
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    result.cover_image = result.cover_image ? `${baseUrl}/api/admin/books/${result.id}/cover` : null;
    result.pdf_url = `${baseUrl}/api/admin/books/${result.id}/pdf`;

    return res.status(201).json({ data: result });
  } catch (err) {
    console.error('uploadBook error', err);
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
}

async function removeBook(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid book id' });
    await adminService.deleteBook(id);
    return res.status(204).send();
  } catch (err) {
    console.error('removeBook error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ==================== MODELS ====================

async function getModels(req, res) {
  try {
    const models = await adminService.listModels();

    // Convert GCS paths to proxy URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const modelsWithUrls = models.map(model => ({
      ...model,
      file_url: model.file_url ? `${baseUrl}/api/admin/models/${model.id}/file` : null,
      thumbnail: model.thumbnail ? `${baseUrl}/api/admin/models/${model.id}/thumbnail` : null,
    }));

    res.json({ data: modelsWithUrls });
  } catch (err) {
    console.error('getModels error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getModelFile(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid model id' });

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
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

async function getModelThumbnail(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid model id' });

    const thumbPath = await adminService.getModelThumbnailPath(id);
    await streamGcsFile(thumbPath, res, 'image/png');
  } catch (err) {
    console.error('getModelThumbnail error', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

async function uploadModel(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: '3D model file is required' });

    const { name, category } = req.body;
    const result = await adminService.createModel({
      name: name || req.file.originalname.replace(/\.(glb|gltf)$/i, ''),
      category,
      modelFile: req.file,
      uploadedBy: req.user?.id,
    });

    // Convert to proxy URLs in response
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    result.file_url = `${baseUrl}/api/admin/models/${result.id}/file`;
    result.thumbnail = null;

    return res.status(201).json({ data: result });
  } catch (err) {
    console.error('uploadModel error', err);
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
}

async function uploadModelThumbnail(req, res) {
  try {
    const modelId = parseInt(req.params.id, 10);
    if (!modelId) return res.status(400).json({ message: 'Invalid model id' });
    if (!req.file) return res.status(400).json({ message: 'Thumbnail image required' });

    await adminService.updateModelThumbnail(modelId, req.file.buffer);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const thumbnailUrl = `${baseUrl}/api/admin/models/${modelId}/thumbnail`;
    return res.json({ data: { thumbnail: thumbnailUrl } });
  } catch (err) {
    console.error('uploadModelThumbnail error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function removeModel(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid model id' });
    await adminService.deleteModel(id);
    return res.status(204).send();
  } catch (err) {
    console.error('removeModel error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
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
    const bookId = req.query.book_id ? parseInt(req.query.book_id, 10) : null;
    const page = req.query.page ? parseInt(req.query.page, 10) : null;
    if (!bookId || !page) return res.status(400).json({ message: 'book_id and page required' });
    const mappings = await adminService.getMappings(bookId, page);
    res.json({ data: mappings });
  } catch (err) {
    console.error('getMappings error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteMapping(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    await adminService.deleteMapping(id);
    res.status(204).send();
  } catch (err) {
    console.error('deleteMapping error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function detectImages(req, res) {
  try {
    const bookId = parseInt(req.params.id, 10);
    const page = parseInt(req.query.page, 10);
    if (!bookId || !page) {
      return res.status(400).json({ message: 'book id and page query param required' });
    }

    const detections = await adminService.detectImagesOnPage(bookId, page);
    return res.json({ data: detections });
  } catch (err) {
    console.error('detectImages error', err);
    return res.status(500).json({ message: 'Detection failed', error: err.message });
  }
}

module.exports = {
  getBooks, getBookPdf, getBookCover, uploadBook, removeBook,
  getModels, getModelFile, getModelThumbnail, uploadModel, uploadModelThumbnail, removeModel,
  createMapping, getMappings, deleteMapping, detectImages
};