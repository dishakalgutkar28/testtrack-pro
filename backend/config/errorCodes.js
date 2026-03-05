/**
 * Error Codes System
 * Centralized error codes for consistent error handling across the application
 */

const ERROR_CODES = {
  // ============================================================================
  // Authentication & Authorization Errors (4000-4099)
  // ============================================================================
  INVALID_CREDENTIALS: {
    code: 'AUTH_4001',
    httpStatus: 401,
    message: 'Invalid email or password'
  },
  TOKEN_EXPIRED: {
    code: 'AUTH_4002',
    httpStatus: 401,
    message: 'Token has expired'
  },
  TOKEN_INVALID: {
    code: 'AUTH_4003',
    httpStatus: 401,
    message: 'Invalid token'
  },
  UNAUTHORIZED: {
    code: 'AUTH_4004',
    httpStatus: 403,
    message: 'You do not have permission to perform this action'
  },
  EMAIL_NOT_VERIFIED: {
    code: 'AUTH_4005',
    httpStatus: 403,
    message: 'Please verify your email before accessing this resource'
  },
  ACCOUNT_DISABLED: {
    code: 'AUTH_4006',
    httpStatus: 403,
    message: 'Your account has been disabled'
  },
  
  // ============================================================================
  // Validation Errors (4200-4299)
  // ============================================================================
  VALIDATION_FAILED: {
    code: 'VAL_4201',
    httpStatus: 400,
    message: 'Validation failed'
  },
  MISSING_REQUIRED_FIELD: {
    code: 'VAL_4202',
    httpStatus: 400,
    message: 'Missing required field'
  },
  INVALID_EMAIL_FORMAT: {
    code: 'VAL_4203',
    httpStatus: 400,
    message: 'Invalid email format'
  },
  INVALID_INPUT: {
    code: 'VAL_4204',
    httpStatus: 400,
    message: 'Invalid input provided'
  },
  PASSWORD_TOO_WEAK: {
    code: 'VAL_4205',
    httpStatus: 400,
    message: 'Password must be at least 8 characters'
  },
  
  // ============================================================================
  // Resource Errors (4400-4499)
  // ============================================================================
  RESOURCE_NOT_FOUND: {
    code: 'RES_4401',
    httpStatus: 404,
    message: 'Resource not found'
  },
  USER_NOT_FOUND: {
    code: 'RES_4402',
    httpStatus: 404,
    message: 'User not found'
  },
  TESTCASE_NOT_FOUND: {
    code: 'RES_4403',
    httpStatus: 404,
    message: 'Test case not found'
  },
  BUG_NOT_FOUND: {
    code: 'RES_4404',
    httpStatus: 404,
    message: 'Bug not found'
  },
  PROJECT_NOT_FOUND: {
    code: 'RES_4405',
    httpStatus: 404,
    message: 'Project not found'
  },
  EXECUTION_NOT_FOUND: {
    code: 'RES_4406',
    httpStatus: 404,
    message: 'Execution not found'
  },
  
  // ============================================================================
  // Conflict Errors (4090-4099)
  // ============================================================================
  RESOURCE_ALREADY_EXISTS: {
    code: 'CONFLICT_4091',
    httpStatus: 409,
    message: 'Resource already exists'
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'CONFLICT_4092',
    httpStatus: 409,
    message: 'Email already registered'
  },
  DUPLICATE_ENTRY: {
    code: 'CONFLICT_4093',
    httpStatus: 409,
    message: 'Duplicate entry'
  },
  
  // ============================================================================
  // Database Errors (5000-5099)
  // ============================================================================
  DATABASE_ERROR: {
    code: 'DB_5001',
    httpStatus: 500,
    message: 'Database error occurred'
  },
  DATABASE_CONNECTION_FAILED: {
    code: 'DB_5002',
    httpStatus: 503,
    message: 'Database connection failed'
  },
  QUERY_FAILED: {
    code: 'DB_5003',
    httpStatus: 500,
    message: 'Query execution failed'
  },
  
  // ============================================================================
  // Server Errors (5100-5199)
  // ============================================================================
  INTERNAL_SERVER_ERROR: {
    code: 'SRV_5100',
    httpStatus: 500,
    message: 'Internal server error'
  },
  SERVICE_UNAVAILABLE: {
    code: 'SRV_5101',
    httpStatus: 503,
    message: 'Service temporarily unavailable'
  },
  EMAIL_SERVICE_ERROR: {
    code: 'SRV_5102',
    httpStatus: 500,
    message: 'Email service error'
  },
  
  // ============================================================================
  // Rate Limiting (4290-4299)
  // ============================================================================
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_4291',
    httpStatus: 429,
    message: 'Too many requests, please try again later'
  }
};

/**
 * Get error details by code name
 * @param {string} codeName - Name of the error code (e.g., 'INVALID_CREDENTIALS')
 * @returns {object} Error details
 */
function getErrorCode(codeName) {
  return ERROR_CODES[codeName] || ERROR_CODES.INTERNAL_SERVER_ERROR;
}

/**
 * Check if error code exists
 * @param {string} codeName - Name of the error code
 * @returns {boolean}
 */
function hasErrorCode(codeName) {
  return codeName in ERROR_CODES;
}

module.exports = {
  ERROR_CODES,
  getErrorCode,
  hasErrorCode
};
