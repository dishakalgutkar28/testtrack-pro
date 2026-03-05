/**
 * Example Auth Routes (Phase 2 & 3 Implementation)
 * Demonstrates the new architecture with:
 * - Service Layer
 * - Error Handling Middleware
 * - Async Handler
 * - Database Abstraction
 * - Proper Logging
 * - Input Validation (Phase 3)
 * - Input/Output Sanitization (Phase 3)
 * 
 * This is an EXAMPLE to show the new pattern.
 * You can gradually migrate existing routes to this pattern.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const AuthService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');
const { ValidationSchemas } = require('../middleware/validation');
const { sanitizeRequestBody } = require('../utils/sanitize');
const { formatResponse, sanitizeUser } = require('../utils/sanitizeOutput');
const logger = require('../utils/logger');

// Initialize service
const authService = new AuthService(db);

/**
 * POST /api/auth/register-v2
 * Example of new registration endpoint using service layer WITH VALIDATION
 */
router.post(
  '/auth/register-v2',
  sanitizeRequestBody(['name', 'email']), // Sanitize input
  ValidationSchemas.register, // Validate input
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Call service - service handles validation and errors
    const user = await authService.register({ name, email, password, role });

    res.status(201).json(
      formatResponse(
        sanitizeUser(user), // Remove sensitive fields
        { message: 'User registered successfully' }
      )
    );
  })
);

/**
 * POST /api/auth/login-v2
 * Example of new login endpoint using service layer WITH VALIDATION
 */
router.post(
  '/auth/login-v2',
  sanitizeRequestBody(['email']), // Sanitize input
  ValidationSchemas.login, // Validate input
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Call service - throws AppError if login fails
    const result = await authService.login(email, password);

    res.json(
      formatResponse(result, {
        message: 'Login successful'
      })
    );
  })
);

/**
 * GET /api/auth/me
 * Get current user info
 * Example of using middleware and service together WITH OUTPUT SANITIZATION
 */
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/auth/me', authMiddleware, asyncHandler(async (req, res) => {
  // req.user is populated by authMiddleware
  const user = await authService.findUserById(req.user.id);

  res.json(
    formatResponse(
      sanitizeUser(user), // Remove password and tokens
      { message: 'User retrieved successfully' }
    )
  );
}));

/**
 * GET /api/auth/test-error
 * Test error handling
 */
router.get('/auth/test-error', asyncHandler(async (req, res) => {
  const { type } = req.query;

  // Demonstrate different error types
  const { AppError } = require('../middleware/errorHandler');

  switch (type) {
    case 'validation':
      throw new AppError('VALIDATION_FAILED', 'Test validation error');
    
    case 'notfound':
      throw new AppError('USER_NOT_FOUND');
    
    case 'unauthorized':
      throw new AppError('UNAUTHORIZED');
    
    case 'server':
      throw new AppError('INTERNAL_SERVER_ERROR');
    
    default:
      throw new Error('Unhandled error for testing');
  }
}));

module.exports = router;
