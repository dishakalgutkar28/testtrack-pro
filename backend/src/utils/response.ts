import { Response } from 'express';
import { ApiSuccess, ApiError } from '../types';

/**
 * Response Formatting Utilities - TypeScript Version
 * Standardizes all API responses with proper typing
 */

/**
 * Send success response
 */
export function sendSuccess<T = any>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  extras: Record<string, any> = {}
): void {
  const response: ApiSuccess<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...extras
  };

  res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(res: Response, error: any): void {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  const response: ApiError = {
    success: false,
    error: {
      code,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      ...(error.details && { details: error.details })
    },
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(response);
}

/**
 * Async handler wrapper for express routes
 * Automatically catches errors and passes to next middleware
 */
export function asyncHandler(fn: (...args: any[]) => Promise<any>) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Type-safe response sending helper
 */
export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): void {
    sendSuccess(res, data, message, statusCode);
  }

  static error(res: Response, error: any): void {
    sendError(res, error);
  }

  static created<T>(res: Response, data: T, message: string = 'Created'): void {
    sendSuccess(res, data, message, 201);
  }

  static noContent(res: Response, message: string = 'No content'): void {
    res.status(204).send();
  }

  static badRequest(res: Response, message: string = 'Bad request'): void {
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message
      },
      timestamp: new Date().toISOString()
    });
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message
      },
      timestamp: new Date().toISOString()
    });
  }

  static forbidden(res: Response, message: string = 'Forbidden'): void {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message
      },
      timestamp: new Date().toISOString()
    });
  }

  static notFound(res: Response, message: string = 'Not found'): void {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message
      },
      timestamp: new Date().toISOString()
    });
  }

  static internalError(res: Response, message: string = 'Internal server error'): void {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message
      },
      timestamp: new Date().toISOString()
    });
  }
}
