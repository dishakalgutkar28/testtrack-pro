/**
 * Validation Middleware
 * Uses express-validator for input validation and sanitization
 */

const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Middleware to handle validation errors
 * Must be used after validation chains
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    
    logger.warn('Validation failed', { 
      url: req.url, 
      method: req.method,
      errors: errorDetails 
    });
    
    throw new AppError(
      'VALIDATION_FAILED',
      'Input validation failed',
      errorDetails
    );
  }
  
  next();
};

/**
 * Common validation rules
 */
const ValidationRules = {
  // Email validation
  email: () => 
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail()
      .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters'),
  
  // Password validation
  password: (fieldName = 'password') =>
    body(fieldName)
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/\d/).withMessage('Password must contain at least one number'),
  
  // Name validation
  name: (fieldName = 'name') =>
    body(fieldName)
      .trim()
      .notEmpty().withMessage(`${fieldName} is required`)
      .isLength({ min: 2, max: 100 }).withMessage(`${fieldName} must be between 2 and 100 characters`)
      .matches(/^[a-zA-Z\s'-]+$/).withMessage(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`),
  
  // ID parameter validation
  id: (paramName = 'id') =>
    param(paramName)
      .notEmpty().withMessage(`${paramName} is required`)
      .isInt({ min: 1 }).withMessage(`${paramName} must be a positive integer`)
      .toInt(),
  
  // Role validation
  role: () =>
    body('role')
      .optional()
      .isIn(['admin', 'developer', 'tester']).withMessage('Role must be admin, developer, or tester'),
  
  // Priority validation
  priority: () =>
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  
  // Status validation
  status: () =>
    body('status')
      .optional()
      .isIn(['pass', 'fail', 'pending', 'blocked']).withMessage('Invalid status value'),
  
  // Title/Description validation
  title: (fieldName = 'title') =>
    body(fieldName)
      .trim()
      .notEmpty().withMessage(`${fieldName} is required`)
      .isLength({ min: 3, max: 255 }).withMessage(`${fieldName} must be between 3 and 255 characters`),
  
  description: (fieldName = 'description') =>
    body(fieldName)
      .optional()
      .trim()
      .isLength({ max: 5000 }).withMessage(`${fieldName} must not exceed 5000 characters`),
  
  // URL validation
  url: (fieldName) =>
    body(fieldName)
      .optional()
      .trim()
      .isURL().withMessage(`${fieldName} must be a valid URL`)
      .isLength({ max: 500 }).withMessage(`${fieldName} must not exceed 500 characters`),
  
  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt()
  ],
  
  // Date validation
  date: (fieldName) =>
    body(fieldName)
      .optional()
      .isISO8601().withMessage(`${fieldName} must be a valid date`)
      .toDate(),
  
  // Boolean validation
  boolean: (fieldName) =>
    body(fieldName)
      .optional()
      .isBoolean().withMessage(`${fieldName} must be true or false`)
      .toBoolean()
};

/**
 * Pre-defined validation schemas for common operations
 */
const ValidationSchemas = {
  // User registration
  register: [
    ValidationRules.name('name'),
    ValidationRules.email(),
    ValidationRules.password(),
    ValidationRules.role(),
    handleValidationErrors
  ],
  
  // User login
  login: [
    ValidationRules.email(),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],
  
  // Update user
  updateUser: [
    ValidationRules.id(),
    ValidationRules.name('name'),
    ValidationRules.email(),
    ValidationRules.role(),
    handleValidationErrors
  ],
  
  // Create test case
  createTestCase: [
    ValidationRules.title('title'),
    ValidationRules.description('description'),
    ValidationRules.priority(),
    body('project_id')
      .optional()
      .isInt({ min: 1 }).withMessage('Project ID must be a positive integer')
      .toInt(),
    handleValidationErrors
  ],
  
  // Create bug
  createBug: [
    ValidationRules.title('title'),
    ValidationRules.description('description'),
    ValidationRules.priority(),
    body('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
    body('assigned_to')
      .optional()
      .isInt({ min: 1 }).withMessage('Assigned user ID must be a positive integer')
      .toInt(),
    handleValidationErrors
  ],
  
  // Get by ID
  getById: [
    ValidationRules.id(),
    handleValidationErrors
  ],
  
  // Pagination
  paginated: [
    ...ValidationRules.pagination(),
    handleValidationErrors
  ]
};

module.exports = {
  ValidationRules,
  ValidationSchemas,
  handleValidationErrors,
  // Export express-validator functions for custom validations
  body,
  param,
  query,
  validationResult
};
