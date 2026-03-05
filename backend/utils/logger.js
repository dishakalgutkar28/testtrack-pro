/**
 * Logger Utility
 * Centralized logging system for the application
 * In development: logs to console with colors
 * In production: can be extended to log to files/services
 */

const fs = require('fs');
const path = require('path');
const { config } = require('../config/env');

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  HTTP: 'HTTP'
};

// ANSI color codes for console output
const COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  HTTP: '\x1b[32m',  // Green
  RESET: '\x1b[0m'
};

// Emoji icons for different log levels
const ICONS = {
  ERROR: '❌',
  WARN: '⚠️ ',
  INFO: 'ℹ️ ',
  DEBUG: '🔍',
  HTTP: '🌐'
};

/**
 * Format log message
 */
function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  
  return {
    timestamp,
    level,
    message,
    meta: metaStr ? meta : undefined
  };
}

/**
 * Write log to console
 */
function logToConsole(level, message, meta = {}) {
  const color = COLORS[level] || COLORS.RESET;
  const icon = ICONS[level] || '';
  const timestamp = new Date().toLocaleTimeString();
  
  const formattedMessage = `${color}${icon} [${timestamp}] ${level}${COLORS.RESET} ${message}`;
  
  console.log(formattedMessage);
  
  // Log meta data if exists
  if (Object.keys(meta).length > 0) {
    console.log('  ', meta);
  }
}

/**
 * Write log to file (optional - for production)
 */
function logToFile(level, message, meta = {}) {
  // Skip file logging in development
  if (config.env !== 'production') return;
  
  try {
    const logDir = path.join(__dirname, '..', 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = JSON.stringify(formatMessage(level, message, meta)) + '\n';
    
    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

/**
 * Main logger object
 */
const logger = {
  /**
   * Log error message
   */
  error: (message, meta = {}) => {
    logToConsole(LOG_LEVELS.ERROR, message, meta);
    logToFile(LOG_LEVELS.ERROR, message, meta);
  },
  
  /**
   * Log warning message
   */
  warn: (message, meta = {}) => {
    logToConsole(LOG_LEVELS.WARN, message, meta);
    logToFile(LOG_LEVELS.WARN, message, meta);
  },
  
  /**
   * Log info message
   */
  info: (message, meta = {}) => {
    logToConsole(LOG_LEVELS.INFO, message, meta);
    logToFile(LOG_LEVELS.INFO, message, meta);
  },
  
  /**
   * Log debug message (only in development)
   */
  debug: (message, meta = {}) => {
    if (config.env === 'development' || config.logLevel === 'debug') {
      logToConsole(LOG_LEVELS.DEBUG, message, meta);
    }
  },
  
  /**
   * Log HTTP request
   */
  http: (message, meta = {}) => {
    if (config.env === 'development') {
      logToConsole(LOG_LEVELS.HTTP, message, meta);
    }
    logToFile(LOG_LEVELS.HTTP, message, meta);
  },
  
  /**
   * HTTP Request Logger Middleware
   */
  requestLogger: (req, res, next) => {
    const start = Date.now();
    
    // Log when response finishes
    res.on('finish', () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.url}`;
      const meta = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent')
      };
      
      // Use different log levels based on status code
      if (res.statusCode >= 500) {
        logger.error(message, meta);
      } else if (res.statusCode >= 400) {
        logger.warn(message, meta);
      } else {
        logger.http(message, meta);
      }
    });
    
    next();
  }
};

module.exports = logger;
