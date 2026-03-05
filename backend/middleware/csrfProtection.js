/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

// Store for CSRF tokens (in production, use Redis or database)
const csrfTokenStore = new Map();

// Token expiration time (30 minutes)
const TOKEN_EXPIRY = 30 * 60 * 1000;

/**
 * Generate CSRF token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware to generate and attach CSRF token
 */
const generateCsrfToken = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Generate new token
  const token = generateToken();
  const sessionId = req.session?.id || req.headers['x-session-id'] || req.user?.id;

  if (!sessionId) {
    logger.warn('CSRF: No session ID available');
    return next();
  }

  // Store token with expiry
  csrfTokenStore.set(sessionId, {
    token,
    expires: Date.now() + TOKEN_EXPIRY
  });

  // Attach token to response header
  res.setHeader('X-CSRF-Token', token);

  next();
};

/**
 * Middleware to validate CSRF token
 */
const validateCsrfToken = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for public routes (login, register, etc.)
  const publicRoutes = ['/api/login', '/api/register', '/api/verify-email', '/api/forgot-password', '/api/reset-password'];
  if (publicRoutes.some(route => req.path.includes(route))) {
    return next();
  }

  const sessionId = req.session?.id || req.headers['x-session-id'] || req.user?.id;
  const providedToken = req.headers['x-csrf-token'] || req.body._csrf;

  if (!sessionId) {
    logger.warn('CSRF validation: No session ID');
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      message: 'No active session'
    });
  }

  const storedData = csrfTokenStore.get(sessionId);

  // Check if token exists
  if (!storedData) {
    logger.warn('CSRF validation: No token found', { sessionId });
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      message: 'No CSRF token found'
    });
  }

  // Check if token expired
  if (Date.now() > storedData.expires) {
    csrfTokenStore.delete(sessionId);
    logger.warn('CSRF validation: Token expired', { sessionId });
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      message: 'CSRF token expired'
    });
  }

  // Validate token
  if (providedToken !== storedData.token) {
    logger.warn('CSRF validation: Token mismatch', { sessionId });
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      message: 'Invalid CSRF token'
    });
  }

  // Token is valid, rotate it (generate new one for next request)
  csrfTokenStore.delete(sessionId);
  const newToken = generateToken();
  csrfTokenStore.set(sessionId, {
    token: newToken,
    expires: Date.now() + TOKEN_EXPIRY
  });
  res.setHeader('X-CSRF-Token', newToken);

  next();
};

/**
 * Cleanup expired tokens periodically
 */
const cleanupExpiredTokens = () => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, data] of csrfTokenStore.entries()) {
    if (now > data.expires) {
      csrfTokenStore.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.info('CSRF: Cleaned up expired tokens', { count: cleanedCount });
  }
};

// Run cleanup every 15 minutes
setInterval(cleanupExpiredTokens, 15 * 60 * 1000);

/**
 * Get CSRF token for current session
 * @route GET /api/csrf-token
 */
const getCsrfToken = (req, res) => {
  const sessionId = req.session?.id || req.headers['x-session-id'] || req.user?.id || generateToken();
  
  // Generate new token
  const token = generateToken();
  csrfTokenStore.set(sessionId, {
    token,
    expires: Date.now() + TOKEN_EXPIRY
  });

  res.json({
    success: true,
    csrf_token: token,
    session_id: sessionId
  });
};

module.exports = {
  generateCsrfToken,
  validateCsrfToken,
  getCsrfToken
};
