const TestCaseService = require('../services/TestCaseService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Test Case Controller
 * Handles HTTP requests/responses for test case operations
 * Delegates business logic to TestCaseService
 */
class TestCaseController {
  /**
   * @param {Object} db - MySQL database connection
   */
  constructor(db) {
    this.service = new TestCaseService(db);
  }

  /**
   * Create test case
   * POST /api/testcase
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const testcase = await this.service.createTestCase(userId, req.body);
      sendSuccess(res, testcase, 'Test case created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test case details with steps
   * GET /api/testcase/:id
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async getOne(req, res, next) {
    try {
      const testcase = await this.service.getTestCase(req.params.id);
      sendSuccess(res, testcase, 'Test case retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * List test cases with pagination
   * GET /api/testcase?projectId=X&page=1&limit=20&title=X&status=X
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async list(req, res, next) {
    try {
      const { projectId, page = 1, limit = 20, title, status, priority } = req.query;

      // Build filters
      const filters = {};
      if (title) filters.title = title;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;

      const result = await this.service.listByProject(
        projectId,
        filters,
        parseInt(page),
        parseInt(limit)
      );

      sendSuccess(
        res,
        result.data,
        'Test cases retrieved',
        200,
        { pagination: result.pagination }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update test case
   * PUT /api/testcase/:id
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const testcase = await this.service.updateTestCase(
        req.params.id,
        userId,
        req.body
      );
      sendSuccess(res, testcase, 'Test case updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clone test case with all steps
   * POST /api/testcase/:id/clone
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async clone(req, res, next) {
    try {
      const userId = req.user.id;
      const testcase = await this.service.cloneTestCase(req.params.id, userId);
      sendSuccess(res, testcase, 'Test case cloned successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete test case (soft delete)
   * DELETE /api/testcase/:id
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async delete(req, res, next) {
    try {
      const result = await this.service.deleteTestCase(req.params.id);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search test cases
   * GET /api/testcase/search?q=X&projectId=X
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async search(req, res, next) {
    try {
      const { q, projectId } = req.query;
      const results = await this.service.search(q, projectId);
      sendSuccess(res, results, `Found ${results.length} test case(s)`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update test cases
   * PUT /api/testcase/bulk-update
   * Body: { ids: [id1, id2], updates: {...} }
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async bulkUpdate(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await this.service.bulkUpdate(
        req.body.ids,
        req.body.updates,
        userId
      );
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test cases with execution statistics
   * GET /api/testcase/stats/:projectId
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async getStats(req, res, next) {
    try {
      const stats = await this.service.getWithStats(req.params.projectId);
      sendSuccess(res, stats, 'Test case statistics retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test cases by status
   * GET /api/testcase/status/:status?projectId=X
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async getByStatus(req, res, next) {
    try {
      const { projectId } = req.query;
      const testcases = await this.service.getByStatus(req.params.status, projectId);
      sendSuccess(res, testcases, `Retrieved ${testcases.length} test case(s)`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recently updated test cases
   * GET /api/testcase/recent/:projectId?days=7
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next middleware
   */
  async getRecent(req, res, next) {
    try {
      const { days = 7 } = req.query;
      const testcases = await this.service.getRecent(
        req.params.projectId,
        parseInt(days)
      );
      sendSuccess(res, testcases, `Retrieved ${testcases.length} recent test case(s)`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TestCaseController;
