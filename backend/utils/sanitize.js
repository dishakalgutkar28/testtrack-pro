/**
 * Input Sanitization Utilities
 * Provides functions to sanitize user input and prevent XSS, SQL injection
 */

const validator = require('validator');

/**
 * Sanitize string input to prevent XSS attacks
 * Escapes HTML entities
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  // Escape HTML entities
  return validator.escape(input);
};

/**
 * Sanitize string but preserve some HTML (for rich text)
 * Use with caution and only for trusted content
 */
const sanitizeHTML = (input, allowedTags = []) => {
  if (typeof input !== 'string') return input;
  
  // For now, just escape everything
  // In production, use a library like DOMPurify or sanitize-html
  return validator.escape(input);
};

/**
 * Sanitize email
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  email = email.toLowerCase().trim();
  return validator.normalizeEmail(email) || email;
};

/**
 * Sanitize an object's string properties
 */
const sanitizeObject = (obj, keysToSanitize = null) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    // Skip if keysToSanitize is provided and key is not in the list
    if (keysToSanitize && !keysToSanitize.includes(key)) {
      continue;
    }
    
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, keysToSanitize);
    }
  }
  
  return sanitized;
};

/**
 * Remove dangerous characters from SQL-like strings
 * Note: Always use parameterized queries, this is additional protection
 */
const sanitizeSQL = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove SQL comment sequences
  let sanitized = input.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');
  
  // Remove semicolons that could end statements
  sanitized = sanitized.replace(/;/g, '');
  
  return sanitized.trim();
};

/**
 * Validate and sanitize URL
 */
const sanitizeURL = (url) => {
  if (typeof url !== 'string') return '';
  
  url = url.trim();
  
  // Check if valid URL
  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    return '';
  }
  
  return url;
};

/**
 * Sanitize filename to prevent directory traversal
 */
const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return '';
  
  // Remove path separators and parent directory references
  let sanitized = filename.replace(/[/\\]/g, '');
  sanitized = sanitized.replace(/\.\./g, '');
  
  // Remove special characters that might be dangerous
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  
  return sanitized.trim();
};

/**
 * Sanitize search query
 */
const sanitizeSearchQuery = (query) => {
  if (typeof query !== 'string') return '';
  
  // Remove special regex characters
  let sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }
  
  return sanitized.trim();
};

/**
 * Whitelist object properties
 * Remove any properties not in the allowed list
 */
const whitelistProperties = (obj, allowedKeys) => {
  if (!obj || typeof obj !== 'object') return {};
  
  const whitelisted = {};
  
  for (const key of allowedKeys) {
    if (key in obj) {
      whitelisted[key] = obj[key];
    }
  }
  
  return whitelisted;
};

/**
 * Blacklist object properties
 * Remove specified properties from object
 */
const blacklistProperties = (obj, forbiddenKeys) => {
  if (!obj || typeof obj !== 'object') return {};
  
  const filtered = { ...obj };
  
  for (const key of forbiddenKeys) {
    delete filtered[key];
  }
  
  return filtered;
};

/**
 * Express middleware to sanitize request body
 */
const sanitizeRequestBody = (keysToSanitize = null) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, keysToSanitize);
    }
    next();
  };
};

/**
 * Express middleware to sanitize query parameters
 */
const sanitizeQueryParams = () => {
  return (req, res, next) => {
    if (req.query && typeof req.query === 'object') {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeString(req.query[key]);
        }
      }
    }
    next();
  };
};

/**
 * Prevent SQL injection by validating against common patterns
 * This is a backup - always use parameterized queries!
 */
const detectSQLInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(--)/,
    /(\/\*)/,
    /(\*\/)/,
    /(';\s*DROP)/i,
    /('\s*OR\s*'1'\s*=\s*'1)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Express middleware to detect and block SQL injection attempts
 */
const blockSQLInjection = () => {
  return (req, res, next) => {
    const checkObject = (obj, path = '') => {
      for (const key in obj) {
        const value = obj[key];
        const fullPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && detectSQLInjection(value)) {
          const logger = require('../utils/logger');
          logger.warn('SQL injection attempt detected', {
            path: fullPath,
            value: value.substring(0, 100),
            ip: req.ip,
            url: req.url
          });
          
          const { AppError } = require('../middleware/errorHandler');
          throw new AppError('VALIDATION_FAILED', 'Invalid input detected', {
            field: fullPath,
            message: 'Input contains potentially dangerous patterns'
          });
        }
        
        if (typeof value === 'object' && value !== null) {
          checkObject(value, fullPath);
        }
      }
    };
    
    // Check body, query, and params
    if (req.body) checkObject(req.body, 'body');
    if (req.query) checkObject(req.query, 'query');
    if (req.params) checkObject(req.params, 'params');
    
    next();
  };
};

module.exports = {
  sanitizeString,
  sanitizeHTML,
  sanitizeEmail,
  sanitizeObject,
  sanitizeSQL,
  sanitizeURL,
  sanitizeFilename,
  sanitizeSearchQuery,
  whitelistProperties,
  blacklistProperties,
  sanitizeRequestBody,
  sanitizeQueryParams,
  detectSQLInjection,
  blockSQLInjection
};
