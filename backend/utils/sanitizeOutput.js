/**
 * Output Sanitization Utilities
 * Sanitizes data before sending to clients
 * Prevents sensitive data leakage
 */

/**
 * Remove sensitive fields from user object
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  
  const { password, refresh_token, email_verification_token, password_reset_token, ...sanitized } = user;
  
  return sanitized;
};

/**
 * Remove sensitive fields from multiple users
 */
const sanitizeUsers = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(user => sanitizeUser(user));
};

/**
 * Sanitize database error messages
 * Remove technical details that might help attackers
 */
const sanitizeError = (error) => {
  if (!error) return null;
  
  // Don't expose internal error messages in production
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An error occurred',
      timestamp: new Date().toISOString()
    };
  }
  
  // In development, show more details but still sanitize
  const sanitized = {
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString()
  };
  
  // Don't expose SQL queries or file paths
  if (error.sql) {
    sanitized.sql = '[SQL query hidden]';
  }
  
  return sanitized;
};

/**
 * Remove password fields from any object
 */
const removePasswords = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => removePasswords(item));
  }
  
  const cleaned = { ...obj };
  
  const sensitiveKeys = [
    'password',
    'password_hash',
    'hashed_password',
    'newPassword',
    'oldPassword',
    'confirmPassword',
    'refresh_token',
    'refreshToken',
    'access_token',
    'accessToken',
    'secret',
    'api_key',
    'apiKey',
    'private_key',
    'privateKey'
  ];
  
  for (const key of sensitiveKeys) {
    if (key in cleaned) {
      delete cleaned[key];
    }
  }
  
  // Recurse into nested objects
  for (const key in cleaned) {
    if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
      cleaned[key] = removePasswords(cleaned[key]);
    }
  }
  
  return cleaned;
};

/**
 * Redact sensitive information with asterisks
 */
const redactSensitiveData = (data, fieldsToRedact = []) => {
  if (!data || typeof data !== 'object') return data;
  
  const redacted = { ...data };
  
  const defaultSensitiveFields = [
    'password',
    'ssn',
    'social_security_number',
    'credit_card',
    'creditCard',
    'api_key',
    'secret'
  ];
  
  const allFieldsToRedact = [...defaultSensitiveFields, ...fieldsToRedact];
  
  for (const field of allFieldsToRedact) {
    if (field in redacted && typeof redacted[field] === 'string') {
      redacted[field] = '*'.repeat(redacted[field].length);
    }
  }
  
  return redacted;
};

/**
 * Limit array size in responses to prevent DOS
 */
const limitArraySize = (arr, maxSize = 1000) => {
  if (!Array.isArray(arr)) return arr;
  
  if (arr.length > maxSize) {
    return {
      data: arr.slice(0, maxSize),
      truncated: true,
      totalCount: arr.length,
      returnedCount: maxSize
    };
  }
  
  return arr;
};

/**
 * Format API response consistently
 */
const formatResponse = (data, meta = {}) => {
  return {
    success: true,
    data: removePasswords(data),
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
};

/**
 * Format paginated response
 */
const formatPaginatedResponse = (items, page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    success: true,
    data: removePasswords(items),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Sanitize object for logging (remove sensitive data but keep structure)
 */
const sanitizeForLogging = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /auth/i,
    /credential/i
  ];
  
  for (const key in sanitized) {
    const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
    
    if (isSensitive) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
};

/**
 * Mask email address (show first 2 chars and domain)
 */
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedLocal = local.substring(0, 2) + '*'.repeat(Math.max(0, local.length - 2));
  return `${maskedLocal}@${domain}`;
};

/**
 * Mask phone number (show last 4 digits)
 */
const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '*'.repeat(cleaned.length);
  
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
};

/**
 * Express middleware to add security headers to responses
 */
const addSecurityHeaders = () => {
  return (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    // Hide server information
    res.removeHeader('X-Powered-By');
    
    next();
  };
};

module.exports = {
  sanitizeUser,
  sanitizeUsers,
  sanitizeError,
  removePasswords,
  redactSensitiveData,
  limitArraySize,
  formatResponse,
  formatPaginatedResponse,
  sanitizeForLogging,
  maskEmail,
  maskPhone,
  addSecurityHeaders
};
