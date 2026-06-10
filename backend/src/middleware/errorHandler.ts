/**
 * Enhanced Error Handler Middleware
 * Centralized error handling with logging and structured responses
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@testtrack-pro/shared';

/**
 * Error logger middleware
 */
export const errorLogger = (
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Log error details
  console.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    body: req.body,
    query: req.query,
    params: req.params,
    user: (req as any).user?.id || 'anonymous',
  });

  next(err);
};

/**
 * Enhanced error handler with structured responses
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details: any = undefined;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    details = err.errors || err.details;
  } else if (err.name === 'UnauthorizedError' || err.name === 'AuthenticationError') {
    statusCode = 401;
    code = 'AUTHENTICATION_ERROR';
    message = 'Authentication required';
  } else if (err.name === 'ForbiddenError' || err.name === 'AuthorizationError') {
    statusCode = 403;
    code = 'AUTHORIZATION_ERROR';
    message = 'Access denied';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    code = 'NOT_FOUND';
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    code = 'DUPLICATE_ERROR';
    message = 'Resource already exists';
  } else if (err.name === 'DatabaseError') {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
  }

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred';
    details = undefined;
  }

  // Send structured error response
  res.status(statusCode).json({
    status: 'error',
    code,
    message,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack?.split('\n').slice(0, 5),
    }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route ${req.method} ${req.path} not found`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
