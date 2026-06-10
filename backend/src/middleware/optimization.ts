/**
 * Performance Optimization Middleware
 * Response compression, caching, and optimization
 */

import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

/**
 * Response compression middleware
 * Compresses responses using gzip/deflate
 */
export const compressionMiddleware = compression({
  // Compression level (0-9, where 9 is maximum compression)
  level: 6,
  
  // Minimum response size to compress (in bytes)
  threshold: 1024,
  
  // Filter function to determine if response should be compressed
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't accept encoding
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Use compression filter
    return compression.filter(req, res);
  },
});

/**
 * Cache control middleware
 * Sets appropriate cache headers
 */
export const cacheControl = (duration: number = 300) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${duration}`);
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    next();
  };
};

/**
 * ETags middleware for client-side caching
 */
export const etagsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function (body: any): Response {
    // Generate simple ETag from response body
    if (body && req.method === 'GET') {
      const etag = generateETag(body);
      res.setHeader('ETag', etag);
      
      // Check if client has cached version
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return res;
      }
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Generate ETag from content
 */
function generateETag(content: any): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(content));
  return `"${hash.digest('hex')}"`;
}

/**
 * Response time header middleware
 */
export const responseTime = (_req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  
  next();
};
