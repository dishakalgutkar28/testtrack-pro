/**
 * Request Logger Middleware
 * Logs incoming requests with timing and user info
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Log levels
 */
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Request logger middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Attach request ID to request object
  (req as any).requestId = requestId;

  // Log request
  logRequest(req, requestId);

  // Capture response
  const originalSend = res.send;
  res.send = function (body: any): Response {
    const duration = Date.now() - startTime;
    logResponse(req, res, duration, requestId);
    return originalSend.call(this, body);
  };

  next();
};

/**
 * Log incoming request
 */
function logRequest(req: Request, requestId: string): void {
  const logData = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    body: sanitizeBody(req.body),
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id || 'anonymous',
  };

  console.log(`[${LogLevel.INFO}] ${req.method} ${req.path}`, JSON.stringify(logData, null, 2));
}

/**
 * Log outgoing response
 */
function logResponse(req: Request, res: Response, duration: number, requestId: string): void {
  const logLevel = res.statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;

  const logData = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: (req as any).user?.id || 'anonymous',
  };

  console.log(
    `[${logLevel}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
    JSON.stringify(logData, null, 2)
  );
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeBody(body: any): any {
  if (!body) return body;

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Performance logger for slow requests
 */
export const performanceLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > threshold) {
        console.warn(
          `[${LogLevel.WARN}] Slow request detected:`,
          JSON.stringify({
            method: req.method,
            path: req.path,
            duration: `${duration}ms`,
            threshold: `${threshold}ms`,
            timestamp: new Date().toISOString(),
          }, null, 2)
        );
      }
    });

    next();
  };
};
