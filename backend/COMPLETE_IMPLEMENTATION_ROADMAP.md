# 🚀 TestTrack Pro - COMPLETE IMPLEMENTATION ROADMAP

**Complete Transformation Plan: Architecture → TypeScript → Monorepo → Testing**  
**Total Timeline:** 12-16 weeks  
**Effort:** ~200-250 hours

---

## 📋 PHASE OVERVIEW & DEPENDENCIES

```
PHASE 1: Architecture Refactoring (Weeks 1-3)
        ↓ (Foundation for all other phases)
PHASE 2: TypeScript Migration (Weeks 4-5)
        ↓ (Requires architecture change first)
PHASE 3: Monorepo Restructuring (Week 6)
        ↓ (Needs TS + new architecture)
PHASE 4: Testing Infrastructure (Weeks 7-12)
        ↓ (Tests for refactored code)
PHASE 5: Quick Wins & Polish (Weeks 13-16)
        ↓ (Final optimizations)
PRODUCTION READY ✅
```

**Critical Path:** Architecture → TypeScript → Monorepo → Testing  
(Cannot skip steps - each builds on previous)

---

# PHASE 1: ARCHITECTURE REFACTORING (Weeks 1-3)
**Goal:** Separate concerns: Routes → Controllers → Services → Repositories → Database  
**Effort:** 40-50 hours  
**Files to Create:** ~50 files

## Step 1.1: Create Folder Structure

```bash
cd backend/src
mkdir -p controllers services repositories models validators utils/errors events
mkdir -p tests/unit/{services,repositories,controllers}
mkdir -p tests/integration tests/fixtures
```

## Step 1.2: Implement Error Classes

**File:** `backend/src/utils/errors.js`

```javascript
/**
 * Custom error classes for better error handling
 */

class AppError extends Error {
  constructor(message, code = 'APP_ERROR', statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 'NOT_FOUND', 404);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

class DuplicateError extends AppError {
  constructor(message) {
    super(message, 'DUPLICATE_ENTRY', 409);
  }
}

class DatabaseError extends AppError {
  constructor(message) {
    super(message, 'DATABASE_ERROR', 500);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  DuplicateError,
  DatabaseError
};
```

## Step 1.3: Response Formatter

**File:** `backend/src/utils/response.js`

```javascript
/**
 * Response formatting utilities
 */

const sendSuccess = (res, data, message = 'Success', statusCode = 200, extras = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...extras
  });
};

const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    },
    timestamp: new Date().toISOString()
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { sendSuccess, sendError, asyncHandler };
```

## Step 1.4: Base Repository Class

**File:** `backend/src/repositories/base.repository.js`

```javascript
const { DatabaseError } = require('../utils/errors');

/**
 * Base Repository - All repositories extend this
 */
class BaseRepository {
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }

  /**
   * Find all records with filters
   */
  async findAll(filters = {}, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        let query = `SELECT * FROM ${this.tableName}`;
        const values = [];

        // Build WHERE clause
        const whereConditions = [];
        for (const [key, value] of Object.entries(filters)) {
          if (value !== null && value !== undefined) {
            whereConditions.push(`${key} = ?`);
            values.push(value);
          }
        }

        if (whereConditions.length > 0) {
          query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        // Ordering
        if (options.orderBy) {
          query += ` ORDER BY ${options.orderBy}`;
        }

        // Pagination
        if (options.limit) {
          query += ` LIMIT ${parseInt(options.limit)}`;
          if (options.offset) {
            query += ` OFFSET ${parseInt(options.offset)}`;
          }
        }

        this.db.query(query, values, (err, results) => {
          if (err) reject(new DatabaseError(err.message));
          else resolve(results || []);
        });
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Find single record by ID
   */
  async findById(id) {
    return new Promise((resolve, reject) => {
      this.db.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id],
        (err, results) => {
          if (err) reject(new DatabaseError(err.message));
          else resolve(results?.[0] || null);
        }
      );
    });
  }

  /**
   * Find one record by criteria
   */
  async findOne(criteria) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(criteria);
      const values = Object.values(criteria);
      const whereClause = columns.map(col => `${col} = ?`).join(' AND ');

      this.db.query(
        `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
        values,
        (err, results) => {
          if (err) reject(new DatabaseError(err.message));
          else resolve(results?.[0] || null);
        }
      );
    });
  }

  /**
   * Create new record
   */
  async create(data) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(data);

      this.db.query(
        `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        values,
        (err, result) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              reject(new DuplicateError('Record already exists'));
            } else {
              reject(new DatabaseError(err.message));
            }
          } else {
            resolve({ id: result.insertId, ...data });
          }
        }
      );
    });
  }

  /**
   * Update record by ID
   */
  async update(id, data) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(data);
      const updates = columns.map(col => `${col} = ?`).join(', ');
      const values = [...Object.values(data), id];

      this.db.query(
        `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`,
        values,
        (err, result) => {
          if (err) reject(new DatabaseError(err.message));
          else resolve(result.affectedRows > 0);
        }
      );
    });
  }

  /**
   * Soft delete (mark as deleted)
   */
  async softDelete(id) {
    return this.update(id, { deleted_at: new Date() });
  }

  /**
   * Hard delete
   */
  async delete(id) {
    return new Promise((resolve, reject) => {
      this.db.query(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id],
        (err, result) => {
          if (err) reject(new DatabaseError(err.message));
          else resolve(result.affectedRows > 0);
        }
      );
    });
  }

  /**
   * Count records
   */
  async count(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const values = [];

      const whereConditions = [];
      for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined) {
          whereConditions.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      this.db.query(query, values, (err, results) => {
        if (err) reject(new DatabaseError(err.message));
        else resolve(results?.[0]?.count || 0);
      });
    });
  }

  /**
   * Paginate results
   */
  async paginate(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.findAll(filters, { limit, offset, orderBy: 'id DESC' }),
      this.count(filters)
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
}

module.exports = BaseRepository;
```

## Step 1.5: Test Case Repository

**File:** `backend/src/repositories/testcase.repository.js`

```javascript
const BaseRepository = require('./base.repository');

class TestCaseRepository extends BaseRepository {
  constructor(db) {
    super('testcases', db);
  }

  /**
   * Find test cases by project
   */
  async findByProject(projectId, filters = {}, page = 1, limit = 20) {
    return this.paginate(
      { project_id: projectId, deleted_at: null, ...filters },
      page,
      limit
    );
  }

  /**
   * Search test cases
   */
  async search(query, projectId = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT * FROM testcases 
        WHERE (title LIKE ? OR description LIKE ?)
        AND deleted_at IS NULL
      `;
      const values = [`%${query}%`, `%${query}%`];

      if (projectId) {
        sql += ` AND project_id = ?`;
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
   * Bulk update
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

  /**
   * Get test case with steps
   */
  async findWithSteps(id) {
    return new Promise((resolve, reject) => {
      this.db.query(
        `
        SELECT tc.*, 
               ts.id as step_id, ts.step_number, ts.action, 
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
          } else if (!results || results.length === 0) {
            resolve(null);
          } else {
            const testcase = results[0];
            const steps = results
              .filter(r => r.step_id !== null)
              .map(r => ({
                step_id: r.step_id,
                step_number: r.step_number,
                action: r.action,
                test_data: r.test_data,
                expected_result: r.expected_result
              }));
            
            resolve({
              ...testcase,
              steps,
              step_count: steps.length
            });
          }
        }
      );
    });
  }
}

module.exports = TestCaseRepository;
```

## Step 1.6: Test Case Service

**File:** `backend/src/services/testcase.service.js`

```javascript
const TestCaseRepository = require('../repositories/testcase.repository');
const { ValidationError, NotFoundError } = require('../utils/errors');

class TestCaseService {
  constructor(db) {
    this.repository = new TestCaseRepository(db);
  }

  /**
   * Create test case
   */
  async createTestCase(userId, data) {
    // Validate
    if (!data.title || data.title.trim().length < 3) {
      throw new ValidationError('Title must be at least 3 characters');
    }

    if (!data.projectId) {
      throw new ValidationError('Project ID is required');
    }

    // Create
    const testcaseId = this._generateId();
    const testcaseData = {
      id: testcaseId,
      project_id: data.projectId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'medium',
      status: 'draft',
      created_by: userId,
      created_at: new Date()
    };

    return this.repository.create(testcaseData);
  }

  /**
   * Get test case with all details
   */
  async getTestCase(id) {
    const testcase = await this.repository.findWithSteps(id);
    if (!testcase) {
      throw new NotFoundError(`Test case ${id} not found`);
    }
    return testcase;
  }

  /**
   * List test cases by project
   */
  async listByProject(projectId, filters = {}, page = 1, limit = 20) {
    return this.repository.findByProject(projectId, filters, page, limit);
  }

  /**
   * Update test case
   */
  async updateTestCase(id, userId, data) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Test case ${id} not found`);
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
   * Clone test case
   */
  async cloneTestCase(id, userId) {
    const original = await this.repository.findById(id);
    if (!original) {
      throw new NotFoundError(`Test case ${id} not found`);
    }

    const cloneData = {
      ...original,
      id: this._generateId(),
      status: 'draft',
      created_by: userId,
      created_at: new Date(),
      version: 1
    };

    return this.repository.create(cloneData);
  }

  /**
   * Delete test case
   */
  async deleteTestCase(id, userId) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Test case ${id} not found`);
    }

    await this.repository.softDelete(id);
    return { success: true, id };
  }

  /**
   * Search test cases
   */
  async search(query, projectId = null) {
    if (!query || query.trim().length < 2) {
      throw new ValidationError('Search query too short');
    }
    return this.repository.search(query, projectId);
  }

  /**
   * Bulk update
   */
  async bulkUpdate(ids, data, userId) {
    if (!ids || ids.length === 0) {
      throw new ValidationError('At least one ID required');
    }

    const updateData = {
      ...data,
      updated_by: userId,
      updated_at: new Date()
    };

    const count = await this.repository.bulkUpdate(ids, updateData);
    return { success: true, count };
  }

  _generateId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `TC-${year}-${random}`;
  }
}

module.exports = TestCaseService;
```

## Step 1.7: Test Case Controller

**File:** `backend/src/controllers/testcase.controller.js`

```javascript
const TestCaseService = require('../services/testcase.service');
const { sendSuccess, sendError } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');

class TestCaseController {
  constructor(db) {
    this.service = new TestCaseService(db);
  }

  /**
   * Create test case
   * POST /api/testcase
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
   * Get test case details
   * GET /api/testcase/:id
   */
  async getOne(req, res, next) {
    try {
      const testcase = await this.service.getTestCase(req.params.id);
      sendSuccess(res, testcase);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List test cases
   * GET /api/testcase?projectId=X&page=1&limit=20
   */
  async list(req, res, next) {
    try {
      const { projectId, page = 1, limit = 20 } = req.query;
      const result = await this.service.listByProject(
        projectId,
        {},
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
   * Clone test case
   * POST /api/testcase/:id/clone
   */
  async clone(req, res, next) {
    try {
      const userId = req.user.id;
      const testcase = await this.service.cloneTestCase(req.params.id, userId);
      sendSuccess(res, testcase, 'Test case cloned', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete test case
   * DELETE /api/testcase/:id
   */
  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await this.service.deleteTestCase(req.params.id, userId);
      sendSuccess(res, result, 'Test case deleted');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search test cases
   * GET /api/testcase/search?q=X
   */
  async search(req, res, next) {
    try {
      const { q, projectId } = req.query;
      const results = await this.service.search(q, projectId);
      sendSuccess(res, results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update
   * PUT /api/testcase/bulk-update
   */
  async bulkUpdate(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await this.service.bulkUpdate(
        req.body.ids,
        req.body.updates,
        userId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TestCaseController;
```

## Step 1.8: New Routes File

**File:** `backend/src/routes/testcase.routes.js`

```javascript
const express = require('express');
const db = require('../config/db');
const TestCaseController = require('../controllers/testcase.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { asyncHandler } = require('../utils/response');

const router = express.Router();
const controller = new TestCaseController(db);

/**
 * Test Case Routes
 */

// POST /api/testcase - Create
router.post(
  '/testcase',
  authMiddleware,
  requireRole('tester', 'admin'),
  asyncHandler((req, res, next) => controller.create(req, res, next))
);

// GET /api/testcase - List
router.get(
  '/testcase',
  authMiddleware,
  asyncHandler((req, res, next) => controller.list(req, res, next))
);

// GET /api/testcase/search - Search
router.get(
  '/testcase/search',
  authMiddleware,
  asyncHandler((req, res, next) => controller.search(req, res, next))
);

// GET /api/testcase/:id - Get one
router.get(
  '/testcase/:id',
  authMiddleware,
  asyncHandler((req, res, next) => controller.getOne(req, res, next))
);

// PUT /api/testcase/:id - Update
router.put(
  '/testcase/:id',
  authMiddleware,
  requireRole('tester', 'admin'),
  asyncHandler((req, res, next) => controller.update(req, res, next))
);

// POST /api/testcase/:id/clone - Clone
router.post(
  '/testcase/:id/clone',
  authMiddleware,
  requireRole('tester', 'admin'),
  asyncHandler((req, res, next) => controller.clone(req, res, next))
);

// DELETE /api/testcase/:id - Delete
router.delete(
  '/testcase/:id',
  authMiddleware,
  requireRole('tester', 'admin'),
  asyncHandler((req, res, next) => controller.delete(req, res, next))
);

// PUT /api/testcase/bulk-update - Bulk update
router.put(
  '/testcase/bulk-update',
  authMiddleware,
  requireRole('tester', 'admin'),
  asyncHandler((req, res, next) => controller.bulkUpdate(req, res, next))
);

module.exports = router;
```

## Step 1.9: Error Handler Middleware

**File:** `backend/middleware/errorHandler.js` (Update)

```javascript
const { sendError } = require('../src/utils/response');
const { AppError } = require('../src/utils/errors');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  if (err instanceof AppError) {
    return sendError(res, err);
  }

  // Default error
  const defaultError = new AppError(
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    'INTERNAL_SERVER_ERROR',
    500
  );

  sendError(res, defaultError);
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = { errorHandler, notFoundHandler };
```

## Step 1.10: Update Server.js

Update how routes are loaded:

```javascript
// OLD
const testcaseRoutes = require('./routes/testcaseRoutes');
app.use('/api', testcaseRoutes);

// NEW
const testcaseRoutes = require('./src/routes/testcase.routes');
app.use('/api', testcaseRoutes);
```

---

# PHASE 2: TYPESCRIPT MIGRATION (Weeks 4-5)
**Goal:** Add type safety to all code  
**Effort:** 30-40 hours  
**Files to Create:** ~20 files

## Step 2.1: Install Dependencies

```bash
cd backend
npm install --save-dev typescript ts-node @types/node @types/express
npm install --save-dev @types/jest jest ts-jest
npx tsc --init
```

## Step 2.2: Create tsconfig.json

**File:** `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCaseInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"]
}
```

## Step 2.3: Create Type Definitions

**File:** `backend/src/types/index.ts`

```typescript
// User types
export interface User {
  id: number;
  email: string;
  password: string;
  role: 'tester' | 'developer' | 'admin';
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

// Test Case types
export interface TestCase {
  id: string;
  project_id: number;
  title: string;
  description?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'draft' | 'ready' | 'approved' | 'deprecated';
  test_steps?: TestStep[];
  created_by: number;
  created_at: Date;
  updated_by?: number;
  updated_at?: Date;
  version: number;
}

export interface TestStep {
  id: number;
  testcase_id: string;
  step_number: number;
  action: string;
  test_data?: string;
  expected_result: string;
}

// Bug types
export interface Bug {
  id: number;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'open' | 'progress' | 'fixed' | 'verified' | 'closed';
  assigned_to?: number;
  project_id: number;
  created_by: number;
  created_at: Date;
}

// Execution types
export interface Execution {
  id: number;
  testcase_id: string;
  status: 'pass' | 'fail' | 'pending' | 'blocked' | 'skipped';
  tester_id: number;
  project_id?: number;
  duration_seconds?: number;
  notes?: string;
  created_at: Date;
}

// Project types
export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// Service request/response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## Step 2.4: Convert Services to TypeScript

**File:** `backend/src/services/testcase.service.ts`

```typescript
import TestCaseRepository from '../repositories/testcase.repository';
import { ValidationError, NotFoundError } from '../utils/errors';
import { TestCase, PaginationParams, PaginationResult } from '../types';
import Database from 'mysql2/promise';

interface CreateTestCaseInput {
  title: string;
  description?: string;
  projectId: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

class TestCaseService {
  private repository: TestCaseRepository;

  constructor(db: Database.Pool) {
    this.repository = new TestCaseRepository(db);
  }

  async createTestCase(userId: number, data: CreateTestCaseInput): Promise<TestCase> {
    if (!data.title || data.title.trim().length < 3) {
      throw new ValidationError('Title must be at least 3 characters');
    }

    if (!data.projectId) {
      throw new ValidationError('Project ID is required');
    }

    const testcaseId = this.generateId();
    const testcaseData: TestCase = {
      id: testcaseId,
      project_id: data.projectId,
      title: data.title,
      description: data.description || undefined,
      priority: data.priority || 'medium',
      status: 'draft',
      created_by: userId,
      created_at: new Date(),
      version: 1
    };

    return this.repository.create(testcaseData);
  }

  async getTestCase(id: string): Promise<TestCase> {
    const testcase = await this.repository.findWithSteps(id);
    if (!testcase) {
      throw new NotFoundError(`Test case ${id} not found`);
    }
    return testcase;
  }

  async listByProject(
    projectId: number,
    filters: Record<string, any> = {},
    params: PaginationParams = {}
  ): Promise<PaginationResult<TestCase>> {
    return this.repository.findByProject(projectId, filters, params);
  }

  async updateTestCase(
    id: string,
    userId: number,
    data: Partial<TestCase>
  ): Promise<TestCase> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Test case ${id} not found`);
    }

    const updateData: Partial<TestCase> = {
      ...data,
      updated_by: userId,
      updated_at: new Date(),
      version: (existing.version || 1) + 1
    };

    await this.repository.update(id, updateData);
    return { ...existing, ...updateData } as TestCase;
  }

  private generateId(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `TC-${year}-${random}`;
  }
}

export default TestCaseService;
```

---

# PHASE 3: MONOREPO RESTRUCTURING (Week 6)
**Goal:** Convert to proper monorepo with pnpm workspaces  
**Effort:** 20-30 hours

## Step 3.1: Install pnpm and Turborepo

```bash
npm install -g pnpm
npm install -D turbo
```

## Step 3.2: Create Root pnpm-workspace.yaml

**File:** `pnpm-workspace.yaml`

```yaml
packages:
  - 'backend'
  - 'frontend'
  - 'shared'
```

## Step 3.3: Create Shared Package

**File:** `shared/package.json`

```json
{
  "name": "@testtrack-pro/shared",
  "version": "1.0.0",
  "description": "Shared types and utilities",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

**File:** `shared/src/index.ts`

```typescript
// Export all types
export * from './types';
export * from './constants';
export * from './errors';
export * from './validators';

// Types
export interface AppConfig {
  nodeEnv: string;
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
}

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
}

// Constants
export const TEST_STATUSES = ['draft', 'ready', 'approved', 'deprecated'] as const;
export const BUG_PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
export const USER_ROLES = ['tester', 'developer', 'admin'] as const;
```

## Step 3.4: Update Root package.json

**File:** `package.json`

```json
{
  "name": "testtrack-pro",
  "version": "1.0.0",
  "description": "TestTrack Pro - Software Testing Platform",
  "private": true,
  "workspaces": {
    "packages": ["backend", "frontend", "shared"]
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "turbo": "^1.8.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

## Step 3.5: Update Backend package.json

```json
{
  "name": "@testtrack-pro/backend",
  "version": "1.0.0",
  "dependencies": {
    "@testtrack-pro/shared": "workspace:*",
    "express": "^4.18.2",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "type-check": "tsc --noEmit"
  }
}
```

## Step 3.6: Create turbo.json

**File:** `turbo.json`

```json
{
  "$schema": "https://turborepo.org/schema.json",
  "globalDependencies": [".env", ".env.*.local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["build"]
    }
  }
}
```

---

# PHASE 4: TESTING INFRASTRUCTURE (Weeks 7-12)
**Goal:** 80%+ test coverage with Jest, Supertest, and test fixtures  
**Effort:** 60-80 hours

## Step 4.1: Install Test Dependencies

```bash
cd backend
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
npm install --save-dev @testing-library/jest-dom
```

## Step 4.2: Jest Configuration

**File:** `backend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/types/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};
```

## Step 4.3: Test Setup File

**File:** `backend/src/tests/setup.ts`

```typescript
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test mode
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
```

## Step 4.4: Test Fixtures

**File:** `backend/src/tests/fixtures/testcase.fixtures.ts`

```typescript
import { TestCase, TestStep } from '../../types';

export const testcaseFixtures = {
  validCreateInput: {
    title: 'Login Test',
    description: 'Test user login functionality',
    projectId: 1,
    priority: 'high'
  },

  validTestCase: {
    id: 'TC-2026-00001',
    project_id: 1,
    title: 'Login Test',
    description: 'Test user login functionality',
    priority: 'high' as const,
    status: 'draft' as const,
    created_by: 1,
    created_at: new Date(),
    version: 1
  } as TestCase,

  testSteps: [
    {
      id: 1,
      testcase_id: 'TC-2026-00001',
      step_number: 1,
      action: 'Navigate to login page',
      expected_result: 'Login page loads successfully'
    },
    {
      id: 2,
      testcase_id: 'TC-2026-00001',
      step_number: 2,
      action: 'Enter valid credentials',
      test_data: 'email: test@example.com, password: Test@123',
      expected_result: 'User is authenticated'
    }
  ] as TestStep[]
};
```

## Step 4.5: Unit Test Example

**File:** `backend/src/services/__tests__/testcase.service.test.ts`

```typescript
import TestCaseService from '../testcase.service';
import TestCaseRepository from '../../repositories/testcase.repository';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { testcaseFixtures } from '../../tests/fixtures/testcase.fixtures';

jest.mock('../../repositories/testcase.repository');

describe('TestCaseService', () => {
  let service: TestCaseService;
  let mockRepository: jest.Mocked<TestCaseRepository>;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {};
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findWithSteps: jest.fn(),
      findByProject: jest.fn(),
      update: jest.fn(),
      search: jest.fn(),
      bulkUpdate: jest.fn()
    } as any;

    (TestCaseRepository as jest.MockedClass<typeof TestCaseRepository>)
      .mockImplementation(() => mockRepository);

    service = new TestCaseService(mockDb);
  });

  describe('createTestCase', () => {
    it('should create a test case with valid input', async () => {
      const userId = 1;
      const input = testcaseFixtures.validCreateInput;

      mockRepository.create.mockResolvedValue(testcaseFixtures.validTestCase);

      const result = await service.createTestCase(userId, input);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(input.title);
      expect(result.status).toBe('draft');
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error if title is too short', async () => {
      const input = { ...testcaseFixtures.validCreateInput, title: 'ab' };

      await expect(service.createTestCase(1, input))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error if projectId is missing', async () => {
      const input = { 
        ...testcaseFixtures.validCreateInput, 
        projectId: undefined 
      };

      await expect(service.createTestCase(1, input as any))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getTestCase', () => {
    it('should return test case with details', async () => {
      const id = 'TC-2026-00001';
      const testcaseWithSteps = {
        ...testcaseFixtures.validTestCase,
        steps: testcaseFixtures.testSteps
      };

      mockRepository.findWithSteps.mockResolvedValue(testcaseWithSteps as any);

      const result = await service.getTestCase(id);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(mockRepository.findWithSteps).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundError if test case not found', async () => {
      mockRepository.findWithSteps.mockResolvedValue(null);

      await expect(service.getTestCase('INVALID'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTestCase', () => {
    it('should update test case successfully', async () => {
      const id = 'TC-2026-00001';
      const userId = 1;
      const updates = { title: 'Updated Title' };

      mockRepository.findById.mockResolvedValue(testcaseFixtures.validTestCase);
      mockRepository.update.mockResolvedValue(true);

      const result = await service.updateTestCase(id, userId, updates);

      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Title');
      expect(result.version).toBe(2);
    });

    it('should throw error if test case not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateTestCase('INVALID', 1, {}))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('cloneTestCase', () => {
    it('should clone test case successfully', async () => {
      const originalId = 'TC-2026-00001';
      const userId = 1;

      mockRepository.findById.mockResolvedValue(testcaseFixtures.validTestCase);
      mockRepository.create.mockResolvedValue({
        ...testcaseFixtures.validTestCase,
        id: 'TC-2026-00002'
      });

      const result = await service.cloneTestCase(originalId, userId);

      expect(result).toBeDefined();
      expect(result.id).not.toBe(originalId);
      expect(result.status).toBe('draft');
      expect(mockRepository.create).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search test cases', async () => {
      const query = 'login';
      mockRepository.search.mockResolvedValue([testcaseFixtures.validTestCase]);

      const result = await service.search(query);

      expect(result).toHaveLength(1);
      expect(mockRepository.search).toHaveBeenCalledWith(query, null);
    });

    it('should throw error if query is too short', async () => {
      await expect(service.search('a'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('bulkUpdate', () => {
    it('should bulk update test cases', async () => {
      const ids = [1, 2, 3];
      const updates = { priority: 'high' };
      const userId = 1;

      mockRepository.bulkUpdate.mockResolvedValue(3);

      const result = await service.bulkUpdate(ids, updates, userId);

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
      expect(mockRepository.bulkUpdate).toHaveBeenCalled();
    });

    it('should throw error if no IDs provided', async () => {
      await expect(service.bulkUpdate([], {}, 1))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

## Step 4.6: Integration Test Example

**File:** `backend/src/tests/integration/testcase.integration.test.ts`

```typescript
import request from 'supertest';
import express, { Express } from 'express';
import testcaseRoutes from '../../routes/testcase.routes';
import { authMiddleware } from '../../middleware/authMiddleware';

describe('Test Case Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    app.use((req, res, next) => {
      (req as any).user = { id: 1, role: 'tester' };
      next();
    });

    app.use('/api', testcaseRoutes);
  });

  describe('POST /api/testcase', () => {
    it('should create a test case', async () => {
      const payload = {
        title: 'Integration Test',
        description: 'Testing API',
        projectId: 1,
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/testcase')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/testcase')
        .send({ title: 'ab' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/testcase', () => {
    it('should list test cases', async () => {
      const response = await request(app)
        .get('/api/testcase?projectId=1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
```

---

# PHASE 5: QUICK WINS & POLISH (Weeks 13-16)
**Goal:** Immediate improvements with high impact  
**Effort:** 20-30 hours

## Step 5.1: Add JSDoc Comments

Add to all service methods:

```javascript
/**
 * Creates a new test case
 * @param {number} userId - ID of the user creating the test case
 * @param {Object} data - Test case data
 * @param {string} data.title - Test case title (min 3 chars)
 * @param {string} [data.description] - Test case description
 * @param {number} data.projectId - Project ID
 * @param {string} [data.priority='medium'] - Priority level
 * @returns {Promise<TestCase>} Created test case
 * @throws {ValidationError} If title is invalid
 * @throws {ValidationError} If projectId is missing
 */
async createTestCase(userId, data) {
  // ...
}
```

## Step 5.2: Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_testcases_project ON testcases(project_id);
CREATE INDEX idx_testcases_status ON testcases(status);
CREATE INDEX idx_testcases_deleted ON testcases(deleted_at);
CREATE INDEX idx_testcases_created ON testcases(created_at DESC);

CREATE INDEX idx_bugs_project ON bugs(project_id);
CREATE INDEX idx_bugs_status ON bugs(status);
CREATE INDEX idx_bugs_assigned ON bugs(assigned_to);

CREATE INDEX idx_executions_testcase ON executions(testcase_id);
CREATE INDEX idx_executions_tester ON executions(tester_id);
CREATE INDEX idx_executions_created ON executions(created_at DESC);

-- Full-text search indexes
CREATE FULLTEXT INDEX idx_testcase_search ON testcases(title, description);
CREATE FULLTEXT INDEX idx_bug_search ON bugs(title, description);
```

## Step 5.3: Constants File

**File:** `backend/src/config/constants.ts`

```typescript
export const TEST_CASE_STATUSES = ['draft', 'ready', 'approved', 'deprecated'] as const;
export const BUG_STATUSES = ['open', 'progress', 'fixed', 'verified', 'closed', 'reopened', 'duplicate'] as const;
export const BUG_PRIORITIES = ['P1-Urgent', 'P2-High', 'P3-Medium', 'P4-Low'] as const;
export const BUG_SEVERITY = ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'] as const;
export const USER_ROLES = ['tester', 'developer', 'admin'] as const;
export const TEST_TYPES = ['Functional', 'Regression', 'Smoke', 'Integration', 'UAT', 'Performance', 'Security', 'Usability'] as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1
};

export const JWT = {
  ACCESS_TOKEN_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  ALGORITHM: 'HS256'
};

export const RATE_LIMITS = {
  AUTH_ATTEMPTS: 5,
  AUTH_WINDOW: 15 * 60 * 1000, // 15 minutes
  API_REQUESTS: 100,
  API_WINDOW: 60 * 1000 // 1 minute
};

export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  VIDEO_MAX_SIZE: 100 * 1024 * 1024, // 100 MB
  LOG_MAX_SIZE: 50 * 1024 * 1024 // 50 MB
};

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 200,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};
```

## Step 5.4: Environment Template

**File:** `.env.example`

```bash
# Environment
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=testtrack_pro
DB_PORT=3306

# JWT
JWT_SECRET=your-secret-key-here
REFRESH_JWT_SECRET=your-refresh-secret-key-here

# Emailservice
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# CORS
CORS_ORIGIN=http://localhost:3000

# File Storage (Optional - for future use)
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

---

## IMPLEMENTATION TIMELINE

| Week | Phase | Tasks | Deliverables |
|------|-------|-------|--------------|
| 1-3 | **Architecture** | Base repo, Services, Controllers | Refactored routes & services |
| 4-5 | **TypeScript** | tsconfig, Types, Convert files | Full TS migration |
| 6 | **Monorepo** | pnpm workspaces, Turborepo | Monorepo setup |
| 7-12 | **Testing** | Jest, test fixtures, 200+ tests | 80%+ coverage |
| 13-16 | **Polish** | JSDoc, Indexes, Constants | Production-ready |

---

## SUCCESS CHECKLIST

### Architecture Phase ✅
- [ ] All services created and separated from routes
- [ ] All repositories implemented
- [ ] Controllers handling HTTP concerns
- [ ] Error handling standardized
- [ ] Response formatting consistent

### TypeScript Phase ✅
- [ ] tsconfig.json configured
- [ ] All types defined
- [ ] Services converted to TypeScript
- [ ] type-check passing
- [ ] No `any` types in critical code

### Monorepo Phase ✅
- [ ] pnpm workspaces configured
- [ ] Shared package created
- [ ] Turborepo configured
- [ ] All scripts working
- [ ] Dependencies properly linked

### Testing Phase ✅
- [ ] Jest configured
- [ ] Test fixtures created
- [ ] 80%+ code coverage achieved
- [ ] Integration tests passing
- [ ] All critical paths tested

### Polish Phase ✅
- [ ] JSDoc comments complete
- [ ] Database indexes created
- [ ] Constants centralized
- [ ] .env.example comprehensive
- [ ] Ready for production

---

**Start with Phase 1! The foundation is critical. Each phase depends on the previous one.** 🚀

Ready to begin? I can help you implement Phase 1 step-by-step!
