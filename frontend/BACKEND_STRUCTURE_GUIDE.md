# 🏗️ TestTrack Pro - RECOMMENDED PROJECT STRUCTURE & REFACTORING GUIDE

**Purpose:** Guide for refactoring TestTrack Pro to production-grade architecture  
**Scope:** Backend service layer, repository pattern, TypeScript migration  
**Estimated Implementation Time:** 80-120 hours

---

## 1. CURRENT vs. RECOMMENDED STRUCTURE

### Current Architecture Problem
```
Routes directly handle:
❌ Database queries
❌ Business logic
❌ Error handling
❌ Validation
❌ Data transformation

Result: Tightly coupled, hard to test, difficult to maintain
```

### Recommended Architecture
```
Request → Validation → Route → Service → Repository → Database
   ↓         (Zod)       ↓        ↓          ↓
Response ← Error Handler ← Business Logic ← Data Access
```

---

## 2. DETAILED FOLDER STRUCTURE

### Complete Backend Structure

```
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── db.js                    # Database connection
│   │   ├── env.js                   # Environment validation
│   │   └── constants.js             # Application constants
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js        # Auth validation
│   │   ├── roleMiddleware.js        # Role-based access
│   │   ├── validationMiddleware.js  # Request validation
│   │   ├── errorHandler.js          # Error handling
│   │   ├── csrfProtection.js        # CSRF tokens
│   │   ├── rateLimiter.js           # Rate limiting
│   │   └── requestLogger.js         # Request logging
│   │
│   ├── routes/
│   │   ├── index.js                 # Route aggregator
│   │   ├── auth.routes.js           # Auth endpoints
│   │   ├── testcase.routes.js       # Test case endpoints
│   │   ├── bug.routes.js            # Bug endpoints
│   │   ├── execution.routes.js      # Execution endpoints
│   │   ├── project.routes.js        # Project endpoints
│   │   ├── admin.routes.js          # Admin endpoints
│   │   ├── report.routes.js         # Report endpoints
│   │   ├── notification.routes.js   # Notification endpoints
│   │   └── webhook.routes.js        # Webhook endpoints (NEW)
│   │
│   ├── controllers/                 # NEW - Request handlers
│   │   ├── auth.controller.js
│   │   ├── testcase.controller.js
│   │   ├── bug.controller.js
│   │   ├── execution.controller.js
│   │   ├── project.controller.js
│   │   ├── report.controller.js
│   │   └── notification.controller.js
│   │
│   ├── services/                    # Business logic
│   │   ├── auth.service.js
│   │   ├── testcase.service.js
│   │   ├── bug.service.js
│   │   ├── execution.service.js
│   │   ├── project.service.js
│   │   ├── report.service.js
│   │   ├── notification.service.js
│   │   └── webhook.service.js       # NEW
│   │
│   ├── repositories/                # Data access layer
│   │   ├── base.repository.js       # Base class
│   │   ├── user.repository.js
│   │   ├── testcase.repository.js
│   │   ├── bug.repository.js
│   │   ├── execution.repository.js
│   │   ├── project.repository.js
│   │   └── testrun.repository.js
│   │
│   ├── validators/                  # Input validation schemas
│   │   ├── auth.validator.js
│   │   ├── testcase.validator.js
│   │   ├── bug.validator.js
│   │   ├── execution.validator.js
│   │   ├── project.validator.js
│   │   └── report.validator.js
│   │
│   ├── models/                      # Data models (NEW)
│   │   ├── User.js
│   │   ├── TestCase.js
│   │   ├── Bug.js
│   │   ├── Execution.js
│   │   ├── Project.js
│   │   └── TestRun.js
│   │
│   ├── types/                       # TypeScript types (if migrating)
│   │   ├── index.d.ts
│   │   ├── models.d.ts
│   │   ├── request.d.ts
│   │   └── response.d.ts
│   │
│   ├── utils/
│   │   ├── logger.js                # Logging utility
│   │   ├── errors.js                # Custom error classes
│   │   ├── response.js              # Response formatters
│   │   ├── sanitize.js              # Input sanitization
│   │   ├── validators.js            # Validation helpers
│   │   ├── emailService.js          # Email sending
│   │   ├── cryptoUtils.js           # Encryption utilities
│   │   └── dateUtils.js             # Date operations
│   │
│   ├── migrations/
│   │   ├── 001_create_tables.sql
│   │   ├── 002_add_indexes.sql
│   │   ├── 003_add_new_columns.sql
│   │   └── migration.runner.js      # Migration executor
│   │
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.test.js
│   │   │   │   ├── testcase.service.test.js
│   │   │   │   ├── bug.service.test.js
│   │   │   │   └── ...
│   │   │   ├── repositories/
│   │   │   │   ├── user.repository.test.js
│   │   │   │   └── ...
│   │   │   └── utils/
│   │   │       └── validators.test.js
│   │   │
│   │   ├── integration/
│   │   │   ├── auth.integration.test.js
│   │   │   ├── testcase.integration.test.js
│   │   │   ├── bug.integration.test.js
│   │   │   └── ...
│   │   │
│   │   ├── fixtures/
│   │   │   ├── users.fixtures.js
│   │   │   ├── testcases.fixtures.js
│   │   │   └── ...
│   │   │
│   │   └── setup.js                 # Test configuration
│   │
│   ├── seed/                        # Database seeders
│   │   ├── seed.runner.js
│   │   ├── users.seed.js
│   │   ├── projects.seed.js
│   │   └── testcases.seed.js
│   │
│   ├── events/                      # Event emitters (NEW)
│   │   ├── eventBus.js
│   │   ├── bugEvents.js
│   │   ├── testcaseEvents.js
│   │   └── notificationEvents.js
│   │
│   └── server.js                    # Entry point
│
├── .env.example
├── jest.config.js
├── nodemon.json
├── tsconfig.json                    # TypeScript config (when migrating)
├── Dockerfile
├── package.json
└── README.md
```

---

## 3. IMPLEMENTATION EXAMPLES

### A. Base Repository Class

**File:** `backend/src/repositories/base.repository.js`

```javascript
/**
 * Base Repository Class
 * Provides common database operations for all repositories
 */
class BaseRepository {
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }

  /**
   * Find all records
   * @param {Object} filters - WHERE clause filters
   * @param {Object} options - Query options (limit, offset, orderBy)
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}, options = {}) {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM ${this.tableName}`;
      const values = [];

      // Add filters
      const whereClause = this._buildWhereClause(filters);
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
        values.push(...Object.values(filters));
      }

      // Add ordering
      if (options.orderBy) {
        query += ` ORDER BY ${options.orderBy}`;
      }

      // Add pagination
      if (options.limit) {
        query += ` LIMIT ${options.limit}`;
        if (options.offset) {
          query += ` OFFSET ${options.offset}`;
        }
      }

      this.db.query(query, values, (err, results) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
  }

  /**
   * Find single record by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return new Promise((resolve, reject) => {
      this.db.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results?.[0] || null);
        }
      );
    });
  }

  /**
   * Find single record by criteria
   * @param {Object} criteria
   * @returns {Promise<Object|null>}
   */
  async findOne(criteria) {
    return new Promise((resolve, reject) => {
      const whereClause = this._buildWhereClause(criteria);
      const values = Object.values(criteria);

      this.db.query(
        `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
        values,
        (err, results) => {
          if (err) reject(err);
          else resolve(results?.[0] || null);
        }
      );
    });
  }

  /**
   * Create new record
   * @param {Object} data
   * @returns {Promise<{id: number}>}
   */
  async create(data) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      this.db.query(
        `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
        values,
        (err, result) => {
          if (err) reject(err);
          else resolve({ id: result.insertId });
        }
      );
    });
  }

  /**
   * Update record
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<boolean>}
   */
  async update(id, data) {
    return new Promise((resolve, reject) => {
      const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];

      this.db.query(
        `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`,
        values,
        (err, result) => {
          if (err) reject(err);
          else resolve(result.affectedRows > 0);
        }
      );
    });
  }

  /**
   * Delete record (soft delete)
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return new Promise((resolve, reject) => {
      this.db.query(
        `UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id = ?`,
        [id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.affectedRows > 0);
        }
      );
    });
  }

  /**
   * Hard delete record
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async hardDelete(id) {
    return new Promise((resolve, reject) => {
      this.db.query(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.affectedRows > 0);
        }
      );
    });
  }

  /**
   * Count records
   * @param {Object} filters
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const values = [];

      const whereClause = this._buildWhereClause(filters);
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
        values.push(...Object.values(filters));
      }

      this.db.query(query, values, (err, results) => {
        if (err) reject(err);
        else resolve(results?.[0]?.count || 0);
      });
    });
  }

  /**
   * Helper to build WHERE clause
   * @private
   */
  _buildWhereClause(filters) {
    return Object.keys(filters)
      .map(key => `${key} = ?`)
      .join(' AND ');
  }
}

module.exports = BaseRepository;
```

---

### B. Test Case Repository

**File:** `backend/src/repositories/testcase.repository.js`

```javascript
const BaseRepository = require('./base.repository');

class TestCaseRepository extends BaseRepository {
  constructor(db) {
    super('testcases', db);
    this.db = db;
  }

  /**
   * Find test cases by project
   */
  async findByProject(projectId, filters = {}, options = {}) {
    return this.findAll(
      { project_id: projectId, ...filters, deleted_at: null },
      { orderBy: 'created_at DESC', ...options }
    );
  }

  /**
   * Find test cases with full details
   */
  async findWithDetails(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          tc.*,
          COUNT(DISTINCT ts.id) as step_count,
          COUNT(DISTINCT e.id) as execution_count
        FROM testcases tc
        LEFT JOIN test_steps ts ON ts.testcase_id = tc.id
        LEFT JOIN executions e ON e.testcase_id = tc.id
        WHERE tc.id = ? AND tc.deleted_at IS NULL
        GROUP BY tc.id
      `;
      
      this.db.query(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results?.[0] || null);
      });
    });
  }

  /**
   * Get test case with steps
   */
  async findWithSteps(id) {
    return new Promise((resolve, reject) => {
      this.db.query(
        `
        SELECT tc.*, ts.id as step_id, ts.step_number, ts.action, 
               ts.test_data, ts.expected_result
        FROM testcases tc
        LEFT JOIN test_steps ts ON ts.testcase_id = tc.id
        WHERE tc.id = ? AND tc.deleted_at IS NULL
        ORDER BY ts.step_number ASC
        `,
        [id],
        (err, results) => {
          if (err) {
            reject(err);
          } else {
            const testcase = results?.[0];
            if (!testcase) {
              resolve(null);
            } else {
              resolve({
                ...testcase,
                steps: results.map(r => ({
                  step_id: r.step_id,
                  step_number: r.step_number,
                  action: r.action,
                  test_data: r.test_data,
                  expected_result: r.expected_result
                }))
              });
            }
          }
        }
      );
    });
  }

  /**
   * Search test cases
   */
  async search(query, projectId = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT tc.* FROM testcases tc
        WHERE (MATCH(tc.title, tc.description) AGAINST(? IN BOOLEAN MODE)
           OR tc.title LIKE ?)
        AND tc.deleted_at IS NULL
      `;
      const values = [query, `%${query}%`];

      if (projectId) {
        sql += ` AND tc.project_id = ?`;
        values.push(projectId);
      }

      sql += ` LIMIT 50`;

      this.db.query(sql, values, (err, results) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
  }

  /**
   * Bulk update test cases
   */
  async bulkUpdate(ids, data) {
    return new Promise((resolve, reject) => {
      const updates = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
      const placeholders = ids.map(() => '?').join(', ');
      const values = [...Object.values(data), ...ids];

      this.db.query(
        `UPDATE testcases SET ${updates} WHERE id IN (${placeholders})`,
        values,
        (err, result) => {
          if (err) reject(err);
          else resolve(result.affectedRows);
        }
      );
    });
  }
}

module.exports = TestCaseRepository;
```

---

### C. Test Case Service

**File:** `backend/src/services/testcase.service.js`

```javascript
const TestCaseRepository = require('../repositories/testcase.repository');
const { ValidationError, NotFoundError } = require('../utils/errors');
const eventBus = require('../events/eventBus');

class TestCaseService {
  constructor(db) {
    this.repository = new TestCaseRepository(db);
    this.db = db;
  }

  /**
   * Create a new test case
   */
  async createTestCase(userId, data) {
    // Validate input
    if (!data.title || data.title.trim().length < 3) {
      throw new ValidationError('Test case title must be at least 3 characters');
    }

    if (!data.projectId) {
      throw new ValidationError('Project ID is required');
    }

    // Auto-generate test case ID
    const testcaseId = this._generateTestCaseId();

    // Prepare data
    const testcaseData = {
      id: testcaseId,
      project_id: data.projectId,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      status: 'draft',
      created_by: userId,
      created_at: new Date()
    };

    try {
      const result = await this.repository.create(testcaseData);

      // Emit event
      eventBus.emit('testcase.created', {
        id: result.id,
        testcaseId,
        title: data.title,
        projectId: data.projectId,
        createdBy: userId
      });

      return { id: result.id, ...testcaseData };
    } catch (error) {
      throw new Error(`Failed to create test case: ${error.message}`);
    }
  }

  /**
   * Get test case with all details
   */
  async getTestCase(id) {
    const testcase = await this.repository.findWithDetails(id);
    
    if (!testcase) {
      throw new NotFoundError(`Test case ${id} not found`);
    }

    return testcase;
  }

  /**
   * Get test case with test steps
   */
  async getTestCaseWithSteps(id) {
    const testcase = await this.repository.findWithSteps(id);
    
    if (!testcase) {
      throw new NotFoundError(`Test case ${id} not found`);
    }

    return testcase;
  }

  /**
   * List test cases by project
   */
  async listByProject(projectId, filters = {}, pagination = {}) {
    const limit = pagination.limit || 20;
    const offset = pagination.offset || 0;

    const testcases = await this.repository.findByProject(
      projectId,
      filters,
      { limit, offset, orderBy: 'created_at DESC' }
    );

    const total = await this.repository.count({
      project_id: projectId,
      deleted_at: null
    });

    return {
      data: testcases,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update test case
   */
  async updateTestCase(id, userId, data) {
    const testcase = await this.repository.findById(id);
    
    if (!testcase) {
      throw new NotFoundError(`Test case ${id} not found`);
    }

    const updateData = {
      ...data,
      updated_by: userId,
      updated_at: new Date(),
      version: (testcase.version || 1) + 1
    };

    const success = await this.repository.update(id, updateData);
    
    if (!success) {
      throw new Error('Failed to update test case');
    }

    // Emit event
    eventBus.emit('testcase.updated', {
      id,
      updatedBy: userId,
      changes: data
    });

    return { ...testcase, ...updateData };
  }

  /**
   * Clone test case
   */
  async cloneTestCase(id, userId) {
    const original = await this.repository.findById(id);
    
    if (!original) {
      throw new NotFoundError(`Test case ${id} not found`);
    }

    const cloneData = {
      ...original,
      id: undefined,
      status: 'draft',
      created_by: userId,
      created_at: new Date()
    };

    const result = await this.repository.create(cloneData);

    eventBus.emit('testcase.cloned', {
      originalId: id,
      cloneId: result.id,
      clonedBy: userId
    });

    return { id: result.id, ...cloneData };
  }

  /**
   * Delete test case (soft delete)
   */
  async deleteTestCase(id, userId) {
    const testcase = await this.repository.findById(id);
    
    if (!testcase) {
      throw new NotFoundError(`Test case ${id} not found`);
    }

    const success = await this.repository.update(id, {
      deleted_at: new Date(),
      deleted_by: userId
    });

    if (!success) {
      throw new Error('Failed to delete test case');
    }

    eventBus.emit('testcase.deleted', {
      id,
      deletedBy: userId
    });

    return { success: true };
  }

  /**
   * Search test cases
   */
  async search(query, projectId = null) {
    if (!query || query.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters');
    }

    const results = await this.repository.search(query, projectId);
    return results;
  }

  /**
   * Bulk update test cases
   */
  async bulkUpdate(ids, data, userId) {
    if (!ids || ids.length === 0) {
      throw new ValidationError('At least one test case ID is required');
    }

    const count = await this.repository.bulkUpdate(ids, {
      ...data,
      updated_by: userId,
      updated_at: new Date()
    });

    if (count === 0) {
      throw new Error('No test cases were updated');
    }

    eventBus.emit('testcase.bulkUpdated', {
      count,
      ids,
      updatedBy: userId
    });

    return { success: true, count };
  }

  /**
   * Private: Generate test case ID
   */
  _generateTestCaseId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return `TC-${year}-${random}`;
  }
}

module.exports = TestCaseService;
```

---

### D. Test Case Controller

**File:** `backend/src/controllers/testcase.controller.js`

```javascript
const TestCaseService = require('../services/testcase.service');
const { sendSuccess, sendError } = require('../utils/response');

class TestCaseController {
  constructor(db) {
    this.service = new TestCaseService(db);
  }

  /**
   * POST /testcase
   * Create new test case
   */
  async create = async (req, res, next) => {
    try {
      const { title, description, priority, projectId } = req.body;
      const userId = req.user.id;

      const testcase = await this.service.createTestCase(userId, {
        title,
        description,
        priority,
        projectId
      });

      sendSuccess(res, testcase, 'Test case created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /testcase/:id
   * Get test case details
   */
  async getOne = async (req, res, next) => {
    try {
      const { id } = req.params;
      const testcase = await this.service.getTestCaseWithSteps(id);
      sendSuccess(res, testcase);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /testcase?projectId=X
   * List test cases
   */
  async list = async (req, res, next) => {
    try {
      const { projectId, status, priority, limit, offset } = req.query;

      const result = await this.service.listByProject(
        projectId,
        { status, priority },
        { limit: parseInt(limit) || 20, offset: parseInt(offset) || 0 }
      );

      sendSuccess(res, result.data, 'Test cases retrieved', 200, {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /testcase/:id
   * Update test case
   */
  async update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      const testcase = await this.service.updateTestCase(id, userId, updates);
      sendSuccess(res, testcase, 'Test case updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /testcase/:id/clone
   * Clone test case
   */
  async clone = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const cloned = await this.service.cloneTestCase(id, userId);
      sendSuccess(res, cloned, 'Test case cloned successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /testcase/:id
   * Soft delete test case
   */
  async delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await this.service.deleteTestCase(id, userId);
      sendSuccess(res, null, 'Test case deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /testcase/search?q=X
   * Search test cases
   */
  async search = async (req, res, next) => {
    try {
      const { q, projectId } = req.query;
      const results = await this.service.search(q, projectId);
      sendSuccess(res, results, 'Search results retrieved');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /testcase/bulk-update
   * Bulk update test cases
   */
  async bulkUpdate = async (req, res, next) => {
    try {
      const { ids, updates } = req.body;
      const userId = req.user.id;

      const result = await this.service.bulkUpdate(ids, updates, userId);
      sendSuccess(res, result, 'Test cases updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = TestCaseController;
```

---

### E. Test Case Routes

**File:** `backend/src/routes/testcase.routes.js`

```javascript
const express = require('express');
const db = require('../config/db');
const TestCaseController = require('../controllers/testcase.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validationMiddleware } = require('../middleware/validationMiddleware');
const testcaseValidator = require('../validators/testcase.validator');

const router = express.Router();
const controller = new TestCaseController(db);

/**
 * Test Case Routes
 */

// Create test case
router.post(
  '/testcase',
  authMiddleware,
  requireRole('tester', 'admin'),
  validationMiddleware(testcaseValidator.create),
  (req, res, next) => controller.create(req, res, next)
);

// Get all test cases
router.get(
  '/testcase',
  authMiddleware,
  (req, res, next) => controller.list(req, res, next)
);

// Search test cases
router.get(
  '/testcase/search',
  authMiddleware,
  (req, res, next) => controller.search(req, res, next)
);

// Get test case details
router.get(
  '/testcase/:id',
  authMiddleware,
  (req, res, next) => controller.getOne(req, res, next)
);

// Update test case
router.put(
  '/testcase/:id',
  authMiddleware,
  requireRole('tester', 'admin'),
  validationMiddleware(testcaseValidator.update),
  (req, res, next) => controller.update(req, res, next)
);

// Clone test case
router.post(
  '/testcase/:id/clone',
  authMiddleware,
  requireRole('tester', 'admin'),
  (req, res, next) => controller.clone(req, res, next)
);

// Delete test case
router.delete(
  '/testcase/:id',
  authMiddleware,
  requireRole('tester', 'admin'),
  (req, res, next) => controller.delete(req, res, next)
);

// Bulk update
router.put(
  '/testcase/bulk-update',
  authMiddleware,
  requireRole('tester', 'admin'),
  validationMiddleware(testcaseValidator.bulkUpdate),
  (req, res, next) => controller.bulkUpdate(req, res, next)
);

module.exports = router;
```

---

### F. Validation Schemas

**File:** `backend/src/validators/testcase.validator.js`

```javascript
const { z } = require('zod');

const testcaseValidator = {
  create: z.object({
    body: z.object({
      title: z.string().min(3).max(200),
      description: z.string().min(10).optional(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      projectId: z.number().int().positive(),
      preconditions: z.string().optional(),
      postconditions: z.string().optional(),
      estimatedDuration: z.number().optional(),
      tags: z.array(z.string()).optional()
    })
  }),

  update: z.object({
    body: z.object({
      title: z.string().min(3).max(200).optional(),
      description: z.string().optional(),
      priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
      status: z.enum(['draft', 'ready', 'approved', 'deprecated']).optional(),
      tags: z.array(z.string()).optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be updated'
    })
  }),

  bulkUpdate: z.object({
    body: z.object({
      ids: z.array(z.number().int().positive()).min(1),
      updates: z.object({
        priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
        status: z.enum(['draft', 'ready', 'approved', 'deprecated']).optional(),
        tags: z.array(z.string()).optional()
      })
    })
  })
};

module.exports = testcaseValidator;
```

---

### G. Response Formatter

**File:** `backend/src/utils/response.js`

```javascript
/**
 * Success response formatter
 */
const sendSuccess = (res, data, message = 'Success', status = 200, extras = {}) => {
  res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...extras
  });
};

/**
 * Error response formatter
 */
const sendError = (res, error, status = 500) => {
  // Map error types to status codes
  let actualStatus = status;
  let code = error.code || 'INTERNAL_SERVER_ERROR';

  if (error.name === 'ValidationError') {
    actualStatus = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'NotFoundError') {
    actualStatus = 404;
    code = 'NOT_FOUND';
  } else if (error.name === 'AuthenticationError') {
    actualStatus = 401;
    code = 'UNAUTHORIZED';
  } else if (error.name === 'AuthorizationError') {
    actualStatus = 403;
    code = 'FORBIDDEN';
  }

  res.status(actualStatus).json({
    success: false,
    error: {
      code,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = { sendSuccess, sendError };
```

---

### H. Custom Error Classes

**File:** `backend/src/utils/errors.js`

```javascript
/**
 * Custom error classes
 */

class AppError extends Error {
  constructor(message, code = 'APP_ERROR') {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
    this.statusCode = 400;
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 'NOT_FOUND');
    this.statusCode = 404;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED');
    this.statusCode = 401;
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN');
    this.statusCode = 403;
  }
}

class DuplicateError extends AppError {
  constructor(message) {
    super(message, 'DUPLICATE_ENTRY');
    this.statusCode = 409;
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  DuplicateError
};
```

---

### I. Event Bus

**File:** `backend/src/events/eventBus.js`

```javascript
const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.maxListeners = 100;
  }

  /**
   * Emit event
   */
  emit(eventName, data) {
    console.log(`📢 Event: ${eventName}`, data);
    return super.emit(eventName, data);
  }

  /**
   * Subscribe to event
   */
  on(eventName, callback) {
    console.log(`👂 Listener registered: ${eventName}`);
    return super.on(eventName, callback);
  }

  /**
   * Subscribe to event once
   */
  once(eventName, callback) {
    return super.once(eventName, callback);
  }

  /**
   * Unsubscribe from event
   */
  off(eventName, callback) {
    return super.off(eventName, callback);
  }
}

// Singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
```

---

### J. Frontend Service Layer

**File:** `frontend/src/services/testcase.service.js`

```javascript
import api from './api';

class TestCaseService {
  /**
   * Create test case
   */
  async createTestCase(data) {
    try {
      const response = await api.post('/testcase', data);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get test case details
   */
  async getTestCase(id) {
    try {
      const response = await api.get(`/testcase/${id}`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * List test cases
   */
  async listTestCases(projectId, { status, priority, limit, offset } = {}) {
    try {
      const response = await api.get('/testcase', {
        params: { projectId, status, priority, limit, offset }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Update test case
   */
  async updateTestCase(id, data) {
    try {
      const response = await api.put(`/testcase/${id}`, data);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Clone test case
   */
  async cloneTestCase(id) {
    try {
      const response = await api.post(`/testcase/${id}/clone`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Delete test case
   */
  async deleteTestCase(id) {
    try {
      const response = await api.delete(`/testcase/${id}`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Search test cases
   */
  async searchTestCases(query, projectId = null) {
    try {
      const response = await api.get('/testcase/search', {
        params: { q: query, projectId }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Bulk update test cases
   */
  async bulkUpdateTestCases(ids, updates) {
    try {
      const response = await api.put('/testcase/bulk-update', { ids, updates });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Error handler
   */
  _handleError(error) {
    const message = error.response?.data?.error?.message ||
                   error.message ||
                   'An error occurred';
    throw new Error(message);
  }
}

export default new TestCaseService();
```

---

## 4. TESTING EXAMPLES

### Unit Test Example

**File:** `backend/src/tests/unit/services/testcase.service.test.js`

```javascript
const TestCaseService = require('../../../services/testcase.service');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

describe('TestCaseService', () => {
  let service;
  let mockDb;

  beforeEach(() => {
    // Mock database
    mockDb = {
      query: jest.fn()
    };
    service = new TestCaseService(mockDb);
  });

  describe('createTestCase', () => {
    it('should create a test case with valid input', async () => {
      const userId = 1;
      const data = {
        title: 'Login Test',
        projectId: 1,
        priority: 'high'
      };

      // Mock repository response
      jest.spyOn(service.repository, 'create')
        .mockResolvedValue({ id: 123 });

      const result = await service.createTestCase(userId, data);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(data.title);
      expect(result.status).toBe('draft');
    });

    it('should throw ValidationError if title is too short', async () => {
      const data = { title: 'ab', projectId: 1 };

      await expect(service.createTestCase(1, data))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if projectId is missing', async () => {
      const data = { title: 'Valid Title' };

      await expect(service.createTestCase(1, data))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getTestCase', () => {
    it('should return test case with details', async () => {
      const testcaseData = {
        id: 123,
        title: 'Test Case',
        project_id: 1
      };

      jest.spyOn(service.repository, 'findWithDetails')
        .mockResolvedValue(testcaseData);

      const result = await service.getTestCase(123);

      expect(result.id).toBe(123);
      expect(result.title).toBe('Test Case');
    });

    it('should throw NotFoundError if test case not found', async () => {
      jest.spyOn(service.repository, 'findWithDetails')
        .mockResolvedValue(null);

      await expect(service.getTestCase(999))
        .rejects.toThrow(NotFoundError);
    });
  });
});
```

---

## 5. MIGRATION CHECKLIST

### Week 1: Foundation
- [ ] Create base structure and folders
- [ ] Implement BaseRepository
- [ ] Create custom error classes
- [ ] Create response formatters
- [ ] Set up validation schemas (Zod)
- [ ] Migrate 1 module (TestCase) as reference

### Week 2: Service Layer
- [ ] Create all services (Bug, Execution, Project, etc.)
- [ ] Create all repositories
- [ ] Create all controllers
- [ ] Update routes to use controllers
- [ ] Implement event bus

### Week 3: Testing
- [ ] Write unit tests for all services
- [ ] Write integration tests
- [ ] Set up test database
- [ ] Add test fixtures
- [ ] Achieve 80%+ coverage

### Week 4: Frontend
- [ ] Create service layer for all modules
- [ ] Refactor components to use services
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add proper TypeScript types

---

**This structured approach makes the codebase:**
- ✅ Testable
- ✅ Maintainable
- ✅ Scalable
- ✅ Reusable
- ✅ Production-ready
