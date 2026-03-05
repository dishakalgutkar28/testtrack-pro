/**
 * Shared Test Utilities
 * Reusable testing helpers for unit and integration tests
 */

/**
 * Create a mock database connection
 */
export const createMockDatabaseConnection = () => {
  return {
    query: jest.fn().mockResolvedValue([]),
    execute: jest.fn().mockResolvedValue({ affectedRows: 0 }),
    release: jest.fn(),
  };
};

/**
 * Create mock test case data
 */
export const createMockTestCase = (overrides = {}) => {
  return {
    id: 'TC-2026-00001',
    project_id: 1,
    title: 'Sample Test Case',
    description: 'This is a sample test case',
    priority: 'medium' as const,
    status: 'draft' as const,
    assignee_id: 1,
    created_by: 1,
    version: 1,
    createdAt: new Date('2026-02-26'),
    updatedAt: new Date('2026-02-26'),
    ...overrides,
  };
};

/**
 * Create mock bug data
 */
export const createMockBug = (overrides = {}) => {
  return {
    id: 'BG-2026-00001',
    project_id: 1,
    title: 'Sample Bug',
    description: 'This is a sample bug',
    priority: 'high' as const,
    severity: 'major' as const,
    status: 'open' as const,
    assignee_id: 1,
    created_by: 1,
    testcase_id: 'TC-2026-00001',
    version: 1,
    createdAt: new Date('2026-02-26'),
    updatedAt: new Date('2026-02-26'),
    ...overrides,
  };
};

/**
 * Create mock user data
 */
export const createMockUser = (overrides = {}) => {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'tester' as const,
    avatar: 'https://example.com/avatar.jpg',
    createdAt: new Date('2026-02-26'),
    updatedAt: new Date('2026-02-26'),
    ...overrides,
  };
};

/**
 * Create mock pagination metadata
 */
export const createMockPaginationMeta = (overrides = {}) => {
  return {
    total: 50,
    page: 1,
    limit: 20,
    pages: 3,
    hasNextPage: true,
    hasPrevPage: false,
    ...overrides,
  };
};

/**
 * Create mock API response
 */
export const createMockApiSuccess = <T>(data: T, message = 'Success') => {
  return {
    status: 'success' as const,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Create mock API error
 */
export const createMockApiError = (message = 'Error', code = 'INTERNAL_ERROR') => {
  return {
    status: 'error' as const,
    code,
    message,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Wait for a condition to be true (useful for async testing)
 */
export const waitFor = (condition: () => boolean, timeout = 5000, interval = 100): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkCondition = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(checkCondition, interval);
      }
    };
    checkCondition();
  });
};

/**
 * Assert that an error is of a specific type
 */
export const expectError = (error: any, expectedCode: string, expectedStatus: number) => {
  expect(error).toBeDefined();
  expect(error.code).toBe(expectedCode);
  expect(error.statusCode).toBe(expectedStatus);
};

/**
 * Assertion helper for pagination results
 */
export const expectPaginatedResult = (result: any, expectedTotal: number, expectedPage: number) => {
  expect(result).toHaveProperty('data');
  expect(result).toHaveProperty('meta');
  expect(result.meta.total).toBe(expectedTotal);
  expect(result.meta.page).toBe(expectedPage);
};
