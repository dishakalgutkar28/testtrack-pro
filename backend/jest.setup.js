/**
 * Jest Setup File
 * Configure test environment before running tests
 */

// Extend Jest matchers
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid date`
          : `Expected ${received} to be a valid date`,
    };
  },
});

// Suppress console errors in tests (optional)
global.console.error = jest.fn();
global.console.warn = jest.fn();

// Set default timeout
jest.setTimeout(10000);

// Mock Date for consistent testing
const mockDate = new Date('2026-02-26T00:00:00Z');
jest.useFakeTimers();
jest.setSystemTime(mockDate);

// Export type augmentation
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
    }
  }
}
