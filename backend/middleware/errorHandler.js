/**
 * Global Error Handling Middleware
 * Catches any errors thrown in routes/controllers and sends a formatted JSON response.
 */
const errorHandler = (err, req, res, next) => {
  // Log error stack trace for debugging in development mode
  console.error(`[Error Handler] ${err.stack || err.message}`);

  // Determine HTTP status code (default to 500 Internal Server Error)
  const statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    // Show stack trace only when in development mode for easier debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
