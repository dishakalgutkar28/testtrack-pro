/**
 * Rate Limiting Middleware
 * Protects against brute force attacks and API abuse
 * 
 * Installation required:
 * npm install express-rate-limit
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Store rate limit info in memory (for production, use Redis)
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 attempts per 15 minutes per IP
 * Prevents brute force login attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    error: 'Too many login attempts, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      email: req.body?.email || 'unknown'
    });
    res.status(429).json({
      error: 'Too many authentication attempts. Your IP has been temporarily blocked.',
      message: 'Please try again after 15 minutes.',
      retryAfter: 900 // seconds
    });
  }
});

/**
 * Moderate rate limiter for password reset
 * 3 attempts per hour per IP
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset requests, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email || 'unknown'
    });
    res.status(429).json({
      error: 'Too many password reset requests.',
      message: 'Please try again after 1 hour.',
      retryAfter: 3600 // seconds
    });
  }
});

/**
 * Strict rate limiter for bug/test case creation
 * 30 creates per 15 minutes per user
 */
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit to 30 creations per 15 minutes
  message: {
    error: 'Rate limit exceeded for resource creation.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID as key instead of IP (requires authentication)
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Create rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: 'Too many resources created. Please slow down.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Lenient rate limiter for file uploads
 * 10 uploads per 15 minutes per user
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 uploads per 15 minutes
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip
    });
    res.status(429).json({
      error: 'Too many file uploads. Please wait before uploading more.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Very strict limiter for account registration
 * 3 registrations per hour per IP
 * Prevents mass account creation
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 registrations per hour
  message: {
    error: 'Too many accounts created from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Registration rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email || 'unknown'
    });
    res.status(429).json({
      error: 'Too many registration attempts from this IP address.',
      message: 'Please try again after 1 hour.',
      retryAfter: 3600 // seconds
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  createLimiter,
  uploadLimiter,
  registerLimiter
};
