/**
 * Response formatting utilities
 * Standardizes all API responses with consistent format
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {Object} extras - Additional response properties
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200, extras = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...extras
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object with statusCode and code properties
 */
const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Async handler wrapper for express routes
 * Automatically catches errors and passes to next middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { 
  sendSuccess, 
  sendError, 
  asyncHandler 
};
