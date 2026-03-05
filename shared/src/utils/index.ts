/**
 * Shared Utilities Index
 * Common utility functions used across the monorepo
 */

/**
 * Generate a unique ID with specific format
 * Used for Test Cases: TC-YYYY-NNNNN
 * Used for Bugs: BG-YYYY-NNNNN
 */
export const generateEntityId = (prefix: string, counter: number): string => {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(counter).padStart(5, '0')}`;
};

/**
 * Format dates consistently across the application
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

/**
 * Format datetime with time
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
};

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Paginate array results
 */
export const paginateArray = <T>(
  items: T[],
  page: number,
  limit: number
): { data: T[]; total: number } => {
  const total = items.length;
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return { data, total };
};

/**
 * Sleep/delay promise resolution
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
