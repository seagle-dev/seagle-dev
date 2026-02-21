const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/auth.middleware');
const { verifyAdmin } = require('../middleware/admin.middleware');
const adminController = require('../controllers/admin.controller');

// Multer with memory storage — files go to buffer, then to Firebase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.toLowerCase().split('.').pop();
    const allowedExts = ['pdf', 'glb', 'gltf', 'png', 'jpg', 'jpeg', 'webp'];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.originalname} (.${ext})`));
    }
  },
});

// ===== Books =====
router.get('/books', verifyToken, verifyAdmin, adminController.getBooks);
router.post('/books', verifyToken, verifyAdmin, upload.single('pdf'), adminController.uploadBook);
router.get('/books/:id/pdf', verifyToken, adminController.getBookPdf);       // Stream PDF
router.get('/books/:id/cover', adminController.getBookCover);                 // Stream cover (public, for thumbnails)
router.get('/books/:id/detect-images', verifyToken, verifyAdmin, adminController.detectImages);  // <-- ADD THIS
router.delete('/books/:id', verifyToken, verifyAdmin, adminController.removeBook);

// ===== 3D Models =====
router.get('/models', verifyToken, verifyAdmin, adminController.getModels);
router.post('/models', verifyToken, verifyAdmin, upload.single('model'), adminController.uploadModel);
router.get('/models/:id/file', verifyToken, adminController.getModelFile);            // Stream GLB/GLTF
router.get('/models/:id/thumbnail', adminController.getModelThumbnail);               // Stream thumbnail (public)
router.post('/models/:id/thumbnail', verifyToken, verifyAdmin, upload.single('thumbnail'), adminController.uploadModelThumbnail);
router.delete('/models/:id', verifyToken, verifyAdmin, adminController.removeModel);

// ===== Mappings =====
router.post('/mappings', verifyToken, verifyAdmin, adminController.createMapping);
router.get('/mappings', verifyToken, verifyAdmin, adminController.getMappings);
router.delete('/mappings/:id', verifyToken, verifyAdmin, adminController.deleteMapping);

module.exports = router;