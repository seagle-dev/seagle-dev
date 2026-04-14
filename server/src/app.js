const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

<<<<<<< HEAD
// CORS configuration – allow web admin + Expo dev client
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:8081'],
  credentials: true
=======
// CORS configuration
// Allow WebView/pdf.js requests too; embedded HTML often sends a null/opaque origin.
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'http://localhost:8081',   // Expo web
      'http://localhost:19006',  // Expo web alt
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Debug: keep this permissive for native WebView readers; tighten later if needed.
    return callback(null, true);
  },
  credentials: true,
>>>>>>> 99037158edb5ad25e847a076a76812966a78ad73
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ========== STATIC FILES (legacy support for existing local files) ==========
app.use('/static', express.static(path.join(__dirname, '../static'), {
  setHeaders: (res, filepath) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (filepath.endsWith('.glb')) {
      res.set('Content-Type', 'model/gltf-binary');
    } else if (filepath.endsWith('.gltf')) {
      res.set('Content-Type', 'model/gltf+json');
    }
  }
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filepath) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    if (filepath.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
    } else if (filepath.endsWith('.glb')) {
      res.set('Content-Type', 'model/gltf-binary');
    } else if (filepath.endsWith('.gltf')) {
      res.set('Content-Type', 'model/gltf+json');
    }
  }
}));

// ========== API ROUTES ==========
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
<<<<<<< HEAD
const homeRoutes = require('./routes/home.routes');
const libraryRoutes = require('./routes/library.routes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/library', libraryRoutes);
=======
const libraryRoutes = require('./routes/library.routes');
const homeRoutes = require('./routes/home.routes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/home', homeRoutes);

>>>>>>> 99037158edb5ad25e847a076a76812966a78ad73

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== ERROR HANDLERS ==========
// Multer / file upload errors
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 100MB.' });
  }
  if (err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({
    message: 'Route not found',
    path: req.url,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;