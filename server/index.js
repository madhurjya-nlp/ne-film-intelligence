const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRouter = require('./routes/api');
const ingestionRouter = require('./routes/ingestion');
const intelligenceRouter = require('./routes/intelligence');
const publicRouter = require('./routes/public');
const pagesRouter = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable cross-origin resource sharing
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// API Routes
app.use('/api', apiRouter);
app.use('/api/ingestion', ingestionRouter);
app.use('/api/intelligence', intelligenceRouter);
app.use('/api/public', publicRouter);

// Clean URL routes + SEO (before static fallback)
app.use(pagesRouter);

// Serve static files from the project root (index.html, programs.html, css/, js/, data/, etc.)
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

// SPA Fallback: Send static files directly (non-routed files are handled by express.static)
app.get('*', (req, res, next) => {
  // If it's looking for API or something and got here, return 404
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  // Otherwise proceed
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error] Exception caught:', err.stack || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🎬 NE Film Intelligence (NEFI) Research Platform Server`);
  console.log(`🌍 Local Access: http://localhost:${PORT}`);
  console.log(`⚙️  API Endpoints under: http://localhost:${PORT}/api/`);
  console.log(`=============================================================\n`);
});

module.exports = app;
