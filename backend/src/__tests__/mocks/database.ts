/**
 * Database Mock Helpers
 * Utilities for mocking database connections and queries
 */

export class MockDatabasePool {
  private mockConnections: any[] = [];
  private queryResults: Map<string, any> = new Map();

  constructor() {
    this.setupDefaultMocks();
  }

  private setupDefaultMocks() {
    // Default query responses
    this.queryResults.set('SELECT * FROM test_cases', []);
    this.queryResults.set('SELECT COUNT(*) as count FROM test_cases', [{ count: 0 }]);
  }

  /**
   * Get a connection from the pool
   */
  getConnection = jest.fn().mockImplementation(() => ({
    query: this.query.bind(this),
    execute: this.execute.bind(this),
    release: jest.fn(),
  }));

  /**
   * Mock query method
   */
  query = jest.fn().mockImplementation((sql: string) => {
    const result = this.queryResults.get(sql) || [];
    return Promise.resolve(result);
  });

  /**
   * Mock execute method (for INSERT, UPDATE, DELETE)
   */
  execute = jest.fn().mockImplementation((sql: string) => {
    return Promise.resolve({
      insertId: 1,
      affectedRows: 1,
    });
  });

  /**
   * Set mock response for a query
   */
  setQueryResult(sql: string, result: any) {
    this.queryResults.set(sql, result);
    this.query.mockImplementation((q: string) => {
      return Promise.resolve(this.queryResults.get(q) || []);
    });
  }

  /**
   * Make query throw an error
   */
  setQueryError(sql: string, error: Error) {
    this.query.mockImplementation((q: string) => {
      if (q.includes(sql)) {
        return Promise.reject(error);
      }
      return Promise.resolve(this.queryResults.get(q) || []);
    });
  }

  /**
   * Reset all mocks
   */
  reset() {
    this.queryResults.clear();
    this.setupDefaultMocks();
    this.getConnection.mockClear();
    this.query.mockClear();
    this.execute.mockClear();
  }
}

/**
 * Create a mock database instance
 */
export function createMockDatabase() {
  return new MockDatabasePool();
}
