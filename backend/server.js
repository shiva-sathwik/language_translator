require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const translateRoutes = require('./routes/translateRoutes');
const errorHandler = require('./middleware/errorHandler');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 5000;

// --- Global Middleware ---

// Enable Cross-Origin Resource Sharing (CORS) to allow requests from the client-side frontend
app.use(cors());

// Parse incoming request JSON payloads
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Routing ---

// Simple API health check endpoint to verify backend status
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Language Translator Backend is running!',
    timestamp: new Date()
  });
});

// Mount modular translate routes under /api prefix
app.use('/api', translateRoutes);

// Catch-all 404 handler for non-existent paths
app.use((req, res, next) => {
  res.statusCode = 404;
  next(new Error(`Endpoint not found: ${req.method} ${req.originalUrl}`));
});

// --- Global Error Handling Middleware ---
// MUST be placed after all route definitions and middlewares
app.use(errorHandler);

// --- Server Lifecycle ---
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  Language Translator Server is running!`);
  console.log(`  Mode: ${process.env.NODE_ENV || 'production'}`);
  console.log(`  URL:  http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});

module.exports = app; // Export for testing purposes
