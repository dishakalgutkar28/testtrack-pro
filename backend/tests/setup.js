/**
 * Jest Setup File
 * Configure test environment and global mocks
 */

// Suppress console errors during tests (optional)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'testtrack_test';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_EXPIRY = '24h';

// Set test timeout to 10 seconds
jest.setTimeout(10000);
