/**
 * Root Jest Configuration for TestTrack Pro Monorepo
 * Coordinates testing across all packages
 */

module.exports = {
  projects: [
    '<rootDir>/backend/jest.config.js',
    '<rootDir>/shared/jest.config.js',
  ],
  collectCoverageFrom: [
    'backend/src/**/*.{ts,js}',
    'shared/src/**/*.{ts,js}',
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
};
