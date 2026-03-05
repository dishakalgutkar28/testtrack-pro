const TestCaseRepository = require('../repositories/TestCaseRepository');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Test Case Service
 * Contains all business logic for test case operations
 * Handles validation, transformation, and repository calls
 */
class TestCaseService {
  /**
   * @param {Object} db - MySQL database connection
   */
  constructor(db) {
    this.repository = new TestCaseRepository(db);
  }

  /**
   * Create a new test case
   * @param {number} userId - ID of the user creating the test case
   * @param {Object} data - Test case data
   * @param {string} data.title - Test case title (min 3 chars)
   * @param {string} [data.description] - Test case description
   * @param {number} data.projectId - Project ID (required)
   * @param {string} [data.priority='medium'] - Priority (critical, high, medium, low)
   * @returns {Promise<Object>} Created test case with ID
   * @throws {ValidationError} If validation fails
   */
  async createTestCase(userId, data) {
    // Validation
    if (!data.title || data.title.trim().length < 3) {
      throw new ValidationError('Title must be at least 3 characters');
    }

    if (!data.projectId) {
      throw new ValidationError('Project ID is required');
    }

    if (data.priority && !['critical', 'high', 'medium', 'low'].includes(data.priority)) {
      throw new ValidationError('Invalid priority value');
    }

    // Create test case
    const testcaseId = this._generateId();
    const testcaseData = {
      id: testcaseId,
      project_id: data.projectId,
      title: data.title.trim(),
      description: data.description || null,
      priority: data.priority || 'medium',
      status: 'draft',
      created_by: userId,
      created_at: new Date(),
      version: 1
    };

    return this.repository.create(testcaseData);
  }

  /**
   * Get test case with all details including steps
   * @param {string} id - Test case ID
   * @returns {Promise<Object>} Complete test case object
   * @throws {NotFoundError} If test case not found
   */
  async getTestCase(id) {
    const testcase = await this.repository.findWithSteps(id);
    if (!testcase) {
      throw new NotFoundError(`Test case '${id}' not found`);
    }
    return testcase;
  }

  /**
   * List test cases by project with pagination
   * @param {number} projectId - Project ID
   * @param {Object} filters - Additional filters
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Records per page
   * @returns {Promise<Object>} {data: [], pagination: {...}}
   * @throws {ValidationError} If invalid parameters
   */
  async listByProject(projectId, filters = {}, page = 1, limit = 20) {
    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    if (page < 1) {
      throw new ValidationError('Page must be >= 1');
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    return this.repository.findByProject(projectId, filters, page, limit);
  }

  /**
   * Update test case
   * @param {string} id - Test case ID
   * @param {number} userId - ID of user making the update
   * @param {Object} data - Fields to update
   * @returns {Promise<Object>} Updated test case
   * @throws {NotFoundError} If test case not found
   * @throws {ValidationError} If validation fails
   */
  async updateTestCase(id, userId, data) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Test case '${id}' not found`);
    }

    // Validate if priority is being updated
    if (data.priority && !['critical', 'high', 'medium', 'low'].includes(data.priority)) {
      throw new ValidationError('Invalid priority value');
    }

    const updateData = {
      ...data,
      updated_by: userId,
      updated_at: new Date(),
      version: (existing.version || 1) + 1
    };

    await this.repository.update(id, updateData);
    return { ...existing, ...updateData };
  }

  /**
   * Clone test case with all steps
   * @param {string} id - Test case ID to clone
   * @param {number} userId - ID of user cloning
   * @returns {Promise<Object>} Cloned test case
   * @throws {NotFoundError} If original test case not found
   */
  async cloneTestCase(id, userId) {
    const original = await this.repository.findById(id);
    if (!original) {
      throw new NotFoundError(`Test case '${id}' not found`);
    }

    const cloneId = this._generateId();

    await this.repository.cloneWithSteps(id, cloneId);

    return {
      id: cloneId,
      ...original,
      status: 'draft',
      created_by: userId,
      created_at: new Date(),
      version: 1
    };
  }

  /**
   * Delete test case (soft delete)
   * @param {string} id - Test case ID
   * @returns {Promise<Object>} Success response
   * @throws {NotFoundError} If test case not found
   */
  async deleteTestCase(id) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Test case '${id}' not found`);
    }

    await this.repository.softDelete(id);
    return { success: true, id, message: 'Test case deleted successfully' };
  }

  /**
   * Search test cases
   * @param {string} query - Search query
   * @param {number} projectId - Optional project filter
   * @returns {Promise<Array>} Matching test cases
   * @throws {ValidationError} If query is too short
   */
  async search(query, projectId = null) {
    if (!query || query.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters');
    }

    return this.repository.search(query.trim(), projectId);
  }

  /**
   * Bulk update test cases
   * @param {Array<string>} ids - Test case IDs to update
   * @param {Object} updates - Fields to update
   * @param {number} userId - ID of user making updates
   * @returns {Promise<Object>} Update result
   * @throws {ValidationError} If no IDs provided
   */
  async bulkUpdate(ids, updates, userId) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('At least one test case ID is required');
    }

    const updateData = {
      ...updates,
      updated_by: userId,
      updated_at: new Date()
    };

    const count = await this.repository.bulkUpdate(ids, updateData);
    return {
      success: true,
      count,
      message: `${count} test case(s) updated successfully`
    };
  }

  /**
   * Get test cases with execution statistics
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} Test cases with performance metrics
   */
  async getWithStats(projectId) {
    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    return this.repository.findWithExecutionStats(projectId);
  }

  /**
   * Get test cases by status
   * @param {string} status - Test case status
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} Test cases with given status
   * @throws {ValidationError} If invalid status
   */
  async getByStatus(status, projectId) {
    const validStatuses = ['draft', 'ready', 'approved', 'deprecated'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Valid values: ${validStatuses.join(', ')}`);
    }

    return this.repository.findByStatus(status, projectId);
  }

  /**
   * Get recently updated test cases
   * @param {number} projectId - Project ID
   * @param {number} days - Days to look back (default 7)
   * @returns {Promise<Array>} Recent test cases
   */
  async getRecent(projectId, days = 7) {
    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    if (days < 1) {
      throw new ValidationError('Days must be >= 1');
    }

    return this.repository.findRecent(projectId, days);
  }

  /**
   * Generate unique test case ID
   * Format: TC-YYYY-NNNNN
   * @private
   * @returns {string} Generated ID
   */
  _generateId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return `TC-${year}-${random}`;
  }
}

module.exports = TestCaseService;
