/**
 * Validation Schemas
 * Express-validator schemas for request validation
 */

import { body, param, query } from 'express-validator';

/**
 * Test Case Validation Schemas
 */
export const testCaseValidation = {
  create: [
    body('projectId')
      .isInt({ min: 1 })
      .withMessage('Project ID must be a positive integer'),
    body('title')
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('Title must be between 3 and 500 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority value'),
    body('status')
      .optional()
      .isIn(['draft', 'ready', 'in-progress', 'passed', 'failed', 'blocked', 'deprecated'])
      .withMessage('Invalid status value'),
    body('assigneeId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Assignee ID must be a positive integer'),
  ],

  update: [
    param('id')
      .matches(/^TC-\d{4}-\d{5}$/)
      .withMessage('Invalid test case ID format'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('Title must be between 3 and 500 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority value'),
    body('status')
      .optional()
      .isIn(['draft', 'ready', 'in-progress', 'passed', 'failed', 'blocked', 'deprecated'])
      .withMessage('Invalid status value'),
    body('assigneeId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Assignee ID must be a positive integer'),
  ],

  getById: [
    param('id')
      .matches(/^TC-\d{4}-\d{5}$/)
      .withMessage('Invalid test case ID format'),
  ],

  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters'),
  ],
};

/**
 * Bug Validation Schemas
 */
export const bugValidation = {
  create: [
    body('projectId')
      .isInt({ min: 1 })
      .withMessage('Project ID must be a positive integer'),
    body('title')
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('Title must be between 3 and 500 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority value'),
    body('severity')
      .optional()
      .isIn(['minor', 'major', 'critical', 'blocker'])
      .withMessage('Invalid severity value'),
    body('status')
      .optional()
      .isIn(['open', 'in-progress', 'resolved', 'closed', 'reopened', 'on-hold'])
      .withMessage('Invalid status value'),
    body('testcaseId')
      .optional()
      .matches(/^TC-\d{4}-\d{5}$/)
      .withMessage('Invalid test case ID format'),
  ],

  update: [
    param('id')
      .matches(/^BG-\d{4}-\d{5}$/)
      .withMessage('Invalid bug ID format'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('Title must be between 3 and 500 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority value'),
    body('severity')
      .optional()
      .isIn(['minor', 'major', 'critical', 'blocker'])
      .withMessage('Invalid severity value'),
    body('status')
      .optional()
      .isIn(['open', 'in-progress', 'resolved', 'closed', 'reopened', 'on-hold'])
      .withMessage('Invalid status value'),
  ],
};

/**
 * User Validation Schemas
 */
export const userValidation = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'tester', 'developer'])
      .withMessage('Invalid role value'),
  ],

  login: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'tester', 'developer'])
      .withMessage('Invalid role value'),
  ],
};

/**
 * Execution Validation Schemas
 */
export const executionValidation = {
  create: [
    body('testcaseId')
      .matches(/^TC-\d{4}-\d{5}$/)
      .withMessage('Invalid test case ID format'),
    body('status')
      .optional()
      .isIn(['pending', 'in-progress', 'passed', 'failed', 'blocked', 'skipped'])
      .withMessage('Invalid status value'),
    body('result')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Result must not exceed 2000 characters'),
    body('duration')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Duration must be a non-negative integer'),
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid execution ID'),
    body('status')
      .optional()
      .isIn(['pending', 'in-progress', 'passed', 'failed', 'blocked', 'skipped'])
      .withMessage('Invalid status value'),
    body('result')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Result must not exceed 2000 characters'),
    body('duration')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Duration must be a non-negative integer'),
  ],
};
