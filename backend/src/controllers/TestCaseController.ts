import { Request, Response, NextFunction } from 'express';
import TestCaseService from '../services/TestCaseService';
import { sendSuccess } from '../utils/response';
import { RequestWithUser, AuthUser } from '../types';
import { DatabaseConnection } from '../types';

/**
 * Test Case Controller - TypeScript Version
 * Handles HTTP requests/responses for test case operations
 * Delegates business logic to TestCaseService
 */
class TestCaseController {
  private service: TestCaseService;

  constructor(db: DatabaseConnection) {
    this.service = new TestCaseService(db);
  }

  /**
   * Create test case
   * POST /api/testcase
   */
  async create(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const testcase = await this.service.createTestCase(userId, req.body);
      sendSuccess(res, testcase, 'Test case created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test case details with steps
   * GET /api/testcase/:id
   */
  async getOne(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
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
   */
  async list(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId, page = '1', limit = '20', title, status, priority } = req.query;

      // Build filters
      const filters: Record<string, any> = {};
      if (title) filters.title = title;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;

      const result = await this.service.listByProject(
        Number(projectId),
        filters,
        parseInt(page as string),
        parseInt(limit as string)
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
   */
  async update(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const testcase = await this.service.updateTestCase(req.params.id, userId, req.body);
      sendSuccess(res, testcase, 'Test case updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clone test case with all steps
   * POST /api/testcase/:id/clone
   */
  async clone(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const testcase = await this.service.cloneTestCase(req.params.id, userId);
      sendSuccess(res, testcase, 'Test case cloned successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete test case (soft delete)
   * DELETE /api/testcase/:id
   */
  async delete(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
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
   */
  async search(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, projectId } = req.query;
      const results = await this.service.search(q as string, projectId ? Number(projectId) : null);
      sendSuccess(res, results, `Found ${results.length} test case(s)`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update test cases
   * PUT /api/testcase/bulk-update
   * Body: { ids: [id1, id2], updates: {...} }
   */
  async bulkUpdate(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const result = await this.service.bulkUpdate(req.body.ids, req.body.updates, userId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test cases with execution statistics
   * GET /api/testcase/stats/:projectId
   */
  async getStats(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.service.getWithStats(Number(req.params.projectId));
      sendSuccess(res, stats, 'Test case statistics retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test cases by status
   * GET /api/testcase/status/:status?projectId=X
   */
  async getByStatus(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.query;
      const testcases = await this.service.getByStatus(
        req.params.status,
        Number(projectId)
      );
      sendSuccess(res, testcases, `Retrieved ${testcases.length} test case(s)`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recently updated test cases
   * GET /api/testcase/recent/:projectId?days=7
   */
  async getRecent(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const { days = '7' } = req.query;
      const testcases = await this.service.getRecent(
        Number(req.params.projectId),
        parseInt(days as string)
      );
      sendSuccess(res, testcases, `Retrieved ${testcases.length} recent test case(s)`);
    } catch (error) {
      next(error);
    }
  }
}

export default TestCaseController;
