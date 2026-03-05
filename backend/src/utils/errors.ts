import { CustomError } from '../types';

/**
 * Custom Error Classes
 * All errors inherit from AppError with proper type safety
 */

export class AppError extends Error implements CustomError {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code: string = 'APP_ERROR', statusCode: number = 500, details?: any) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class DuplicateError extends AppError {
  constructor(message: string) {
    super(message, 'DUPLICATE_ENTRY', 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 500);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT', 429);
  }
}

/**
 * Is this an AppError?
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Is this a validation error?
 */
export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}
