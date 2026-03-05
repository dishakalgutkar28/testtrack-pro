/**
 * Shared Utilities Unit Tests
 */

import {
  generateEntityId,
  formatDate,
  formatDateTime,
  sanitizeString,
  isValidEmail,
  paginateArray,
  delay,
} from '../utils/index';

describe('Shared Utilities', () => {
  describe('generateEntityId()', () => {
    it('should generate valid test case ID', () => {
      const id = generateEntityId('TC', 1);
      expect(id).toMatch(/^TC-\d{4}-\d{5}$/);
      expect(id).toContain('TC-');
    });

    it('should generate valid bug ID', () => {
      const id = generateEntityId('BG', 42);
      expect(id).toMatch(/^BG-\d{4}-\d{5}$/);
    });

    it('should pad counter with zeros', () => {
      const id = generateEntityId('TC', 1);
      expect(id).toContain('00001');
    });

    it('should handle large counters', () => {
      const id = generateEntityId('TC', 12345);
      expect(id).toContain('12345');
    });
  });

  describe('formatDate()', () => {
    it('should format Date to ISO date string', () => {
      const date = new Date('2026-02-26T10:30:45Z');
      const result = formatDate(date);
      expect(result).toBe('2026-02-26');
    });

    it('should format string date', () => {
      const result = formatDate('2026-02-26T10:30:45Z');
      expect(result).toBe('2026-02-26');
    });

    it('should handle different dates', () => {
      const date = new Date('2025-12-31');
      const result = formatDate(date);
      expect(result).toMatch(/^2025-/);
    });
  });

  describe('formatDateTime()', () => {
    it('should format to full ISO datetime', () => {
      const date = new Date('2026-02-26T10:30:45Z');
      const result = formatDateTime(date);
      expect(result).toContain('2026-02-26T');
      expect(result).toContain('Z');
    });

    it('should handle string input', () => {
      const result = formatDateTime('2026-02-26');
      expect(result).toContain('T');
    });
  });

  describe('sanitizeString()', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeString('<script>alert("xss")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should escape special characters', () => {
      const result = sanitizeString('<p>&"\'x</p>');
      expect(result).toContain('&amp;');
      expect(result).toContain('&quot;');
    });

    it('should handle normal strings', () => {
      const result = sanitizeString('Hello World');
      expect(result).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });
  });

  describe('isValidEmail()', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should validate email with subdomain', () => {
      expect(isValidEmail('user@sub.example.com')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should reject email without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should reject whitespace', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('paginateArray()', () => {
    const testArray = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

    it('should paginate first page', () => {
      const result = paginateArray(testArray, 1, 10);
      expect(result.data.length).toBe(10);
      expect(result.data[0].id).toBe(1);
      expect(result.total).toBe(100);
    });

    it('should paginate middle page', () => {
      const result = paginateArray(testArray, 5, 10);
      expect(result.data.length).toBe(10);
      expect(result.data[0].id).toBe(41);
    });

    it('should paginate last page', () => {
      const result = paginateArray(testArray, 10, 10);
      expect(result.data.length).toBe(10);
      expect(result.data[0].id).toBe(91);
    });

    it('should return partial last page', () => {
      const result = paginateArray(testArray, 11, 10);
      expect(result.data.length).toBe(0);
      expect(result.total).toBe(100);
    });

    it('should handle page 0', () => {
      const result = paginateArray(testArray, 0, 10);
      expect(result.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('delay()', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });

    it('should handle zero delay', async () => {
      const start = Date.now();
      await delay(0);
      expect(Date.now() - start).toBeLessThan(50);
    });

    it('should return a promise', () => {
      const result = delay(1000);
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
