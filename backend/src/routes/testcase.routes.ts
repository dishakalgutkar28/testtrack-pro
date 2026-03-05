import { Router, Request, Response, NextFunction } from 'express';
import db from '../../config/db';
import TestCaseController from '../controllers/TestCaseController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/roleMiddleware';
import { asyncHandler } from '../utils/response';

const router = Router();
const controller = new TestCaseController(db);

/**
 * Test Case Routes - TypeScript Version
 * All routes require authentication
 * Some routes require specific roles
 */

/**
 * POST /api/testcase - Create new test case
 * Requires: tester or admin role
 * Body: {title, description, projectId, priority}
 */
router.post(
  '/testcase',
  authMiddleware,
  requireRole('tester', 'admin'),
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.create(req as any, res, next)
  )
);

/**
 * GET /api/testcase - List test cases with pagination
 * Requires: authenticated user
 * Query: projectId, page, limit, title, status, priority
 */
router.get(
  '/testcase',
  authMiddleware,
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.list(req as any, res, next)
  )
);

/**
 * GET /api/testcase/search - Search test cases
 * Requires: authenticated user
 * Query: q (search query), projectId (optional)
 */
router.get(
  '/testcase/search',
  authMiddleware,
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.search(req as any, res, next)
  )
);

/**
 * GET /api/testcase/stats/:projectId - Get test cases with execution stats
 * Requires: authenticated user
 * Params: projectId
 */
router.get(
  '/testcase/stats/:projectId',
  authMiddleware,
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.getStats(req as any, res, next)
  )
);

/**
 * GET /api/testcase/status/:status - Get test cases by status
 * Requires: authenticated user
 * Params: status (draft, ready, approved, deprecated)
 * Query: projectId
 */
router.get(
  '/testcase/status/:status',
  authMiddleware,
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.getByStatus(req as any, res, next)
  )
);

/**
 * GET /api/testcase/recent/:projectId - Get recently updated test cases
 * Requires: authenticated user
 * Params: projectId
 * Query: days (default 7)
 */
router.get(
  '/testcase/recent/:projectId',
  authMiddleware,
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.getRecent(req as any, res, next)
  )
);

/**
 * GET /api/testcase/:id - Get test case details with steps
 * Requires: authenticated user
 * Params: id
 */
router.get(
  '/testcase/:id',
  authMiddleware,
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.getOne(req as any, res, next)
  )
);

/**
 * PUT /api/testcase/:id - Update test case
 * Requires: tester or admin role
 * Params: id
 * Body: {title, description, priority, status, ...}
 */
router.put(
  '/testcase/:id',
  authMiddleware,
  requireRole('tester', 'admin'),
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.update(req as any, res, next)
  )
);

/**
 * POST /api/testcase/:id/clone - Clone test case with all steps
 * Requires: tester or admin role
 * Params: id
 */
router.post(
  '/testcase/:id/clone',
  authMiddleware,
  requireRole('tester', 'admin'),
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.clone(req as any, res, next)
  )
);

/**
 * DELETE /api/testcase/:id - Delete test case (soft delete)
 * Requires: tester or admin role
 * Params: id
 */
router.delete(
  '/testcase/:id',
  authMiddleware,
  requireRole('tester', 'admin'),
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.delete(req as any, res, next)
  )
);

/**
 * PUT /api/testcase/bulk-update - Bulk update test cases
 * Requires: tester or admin role
 * Body: {ids: [id1, id2], updates: {...}}
 */
router.put(
  '/testcase/bulk-update',
  authMiddleware,
  requireRole('tester', 'admin'),
  asyncHandler((req: Request, res: Response, next: NextFunction) =>
    controller.bulkUpdate(req as any, res, next)
  )
);

export default router;
