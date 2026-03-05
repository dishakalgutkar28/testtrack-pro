/**
 * Error Handling Middleware
 * Centralized error handling for the application
 * Works with both old and new error classes
 */

const { getErrorCode } = require('../config/errorCodes');
const { sendError } = require('../src/utils/response');
const { AppError: NewAppError } = require('../src/utils/errors');

/**
 * Custom Application Error Class (Legacy - kept for backward compatibility)
 * Use this to throw errors with specific error codes
 */
class AppError extends Error {
  constructor(errorCodeName, customMessage = null, details = null) {
    const errorInfo = getErrorCode(errorCodeName);
    super(customMessage || errorInfo.message);
    
    this.name = 'AppError';
    this.code = errorInfo.code;
    this.statusCode = errorInfo.httpStatus;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true; // Distinguishes operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware
 * Catches all errors and formats them consistently
 * Supports both legacy AppError and new error classes
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'SRV_5100';
  let message = err.message || 'Internal server error';
  let details = err.details || null;
  
  // Log error (will use proper logger in next step)
  const errorLog = {
    timestamp: new Date().toISOString(),
    code: errorCode,
    message: message,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  };
  
  // Log full stack trace for server errors
  if (statusCode >= 500) {
    console.error('❌ Server Error:', errorLog);
    console.error('Stack:', err.stack);
  } else {
    console.warn('⚠️  Client Error:', errorLog);
  }
  
  // Handle specific error types
  
  // JWT Errors
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'AUTH_4002';
    message = 'Token has expired';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'AUTH_4003';
    message = 'Invalid token';
  }
  
  // MySQL Errors
  else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    errorCode = 'CONFLICT_4093';
    message = 'Duplicate entry - resource already exists';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    errorCode = 'VAL_4204';
    message = 'Invalid reference - related resource does not exist';
  } else if (err.code && err.code.startsWith('ER_')) {
    statusCode = 500;
    errorCode = 'DB_5001';
    message = 'Database error occurred';
  }
  
  // Validation Errors (from express-validator or similar)
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VAL_4201';
    message = 'Validation failed';
    details = err.errors || err.details;
  }
  
  // CORS Errors
  else if (err.message && err.message.includes('CORS')) {
    statusCode = 403;
    errorCode = 'AUTH_4004';
    message = 'CORS policy violation';
  }
  
  // Format error response
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message
    }
  };
  
  // Add details if available
  if (details) {
    errorResponse.error.details = details;
  }
  
  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack.split('\n').slice(0, 5); // First 5 lines only
  }
  
  // Add timestamp
  errorResponse.error.timestamp = err.timestamp || new Date().toISOString();
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 * Handles routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError('RESOURCE_NOT_FOUND', `Route ${req.method} ${req.url} not found`);
  next(error);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 * Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation Error Handler
 * Helper to throw validation errors
 */
const throwValidationError = (field, message) => {
  throw new AppError('VALIDATION_FAILED', message, { field });
};

/**
 * Database Error Handler
 * Helper to handle database errors consistently
 */
const handleDatabaseError = (err, operation = 'Database operation') => {
  console.error(`Database Error in ${operation}:`, err);
  
  if (err.code === 'ER_DUP_ENTRY') {
    throw new AppError('DUPLICATE_ENTRY', 'This record already exists');
  }
  
  throw new AppError('DATABASE_ERROR', 'An error occurred while accessing the database');
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  throwValidationError,
  handleDatabaseError
};
