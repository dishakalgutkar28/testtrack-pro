# Phase 1 Implementation Guide

## ✅ Created Files Summary

This guide shows you how to integrate the newly created architecture files into your application.

### Files Created

```
backend/src/
├── utils/
│   ├── errors.js           (8 error classes)
│   └── response.js         (response formatting utilities)
├── repositories/
│   ├── BaseRepository.js   (base CRUD operations)
│   └── TestCaseRepository.js  (test case specific queries)
├── services/
│   └── TestCaseService.js  (business logic)
├── controllers/
│   └── TestCaseController.js  (HTTP handling)
├── routes/
│   └── testcase.routes.js  (route definitions)
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/
```

**Total: 6 production files + folder structure ready for testing**

---

## 🚀 Integration Steps

### Step 1: Update server.js

Replace the old test case routes with the new ones:

```javascript
// OLD (remove this)
const testcaseRoutes = require('./routes/testcaseRoutes');
app.use('/api', testcaseRoutes);

// NEW (add this)
const testcaseRoutes = require('./src/routes/testcase.routes');
app.use('/api', testcaseRoutes);
```

### Step 2: Verify the error handler is updated

The error handler middleware has been updated to support both old and new error classes. No changes needed - it's backward compatible!

### Step 3: Test the new architecture

Start your server:

```bash
npm start
```

Try creating a test case:

```bash
curl -X POST http://localhost:3000/api/testcase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Login Test",
    "description": "Test user login",
    "projectId": 1,
    "priority": "high"
  }'
```

---

## 📊 Architecture Improvements

### Before (OLD)
```
testcaseRoutes.js (500+ lines)
├── All business logic mixed in
├── Direct database queries
├── Hard to test
└── Tightly coupled
```

### After (NEW)
```
testcase.routes.js (simple routing)
    ↓
TestCaseController (HTTP handling)
    ↓
TestCaseService (business logic)
    ↓
TestCaseRepository (database access)
    ↓
BaseRepository (CRUD base class)
    ↓
Database
```

**Result:** Each layer has single responsibility, fully testable!

---

## 🔍 What Each File Does

### utils/errors.js
Custom error classes with proper HTTP status codes:
- `ValidationError` (400)
- `NotFoundError` (404)
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `DuplicateError` (409)
- `DatabaseError` (500)
- `ConflictError` (409)

**Usage:**
```javascript
throw new ValidationError('Title must be at least 3 characters');
throw new NotFoundError(`Test case ${id} not found`);
```

### utils/response.js
Standardized response formatting:
- `sendSuccess()` - sends success response
- `sendError()` - sends error response with proper format
- `asyncHandler()` - wraps async routes to catch errors

**Usage:**
```javascript
sendSuccess(res, data, 'Created', 201);
sendError(res, error);
```

### repositories/BaseRepository.js
Base class with 12 common methods:
- `findAll()` - with filters and pagination
- `findById()` - by ID
- `findOne()` - by criteria
- `create()` - new record
- `update()` - by ID
- `delete()` / `softDelete()` - remove record
- `count()` - count records
- `paginate()` - auto-paginated results
- `query()` - raw SQL

**All database operations use Promises!**

### repositories/TestCaseRepository.js
Extends BaseRepository with test-case-specific queries:
- `findByProject()` - list by project
- `search()` - full-text search
- `bulkUpdate()` - update multiple
- `findWithSteps()` - includes associated steps
- `findWithExecutionStats()` - with execution metrics
- `cloneWithSteps()` - clone with all steps
- `findByStatus()` - filter by status
- `findRecent()` - recent changes

### services/TestCaseService.js
Business logic layer (20 methods):
- `createTestCase()` - validates + creates
- `getTestCase()` - retrieves with steps
- `listByProject()` - paginated list
- `updateTestCase()` - with version increment
- `cloneTestCase()` - duplicates with steps
- `deleteTestCase()` - soft delete
- `search()` - validates query + searches
- `bulkUpdate()` - mass updates
- `getWithStats()` - performance metrics
- `getByStatus()` - filter by status
- `getRecent()` - recently modified

**All with proper validation and error handling!**

### controllers/TestCaseController.js
HTTP request/response handling (9 methods):
- `create()` - POST /api/testcase
- `list()` - GET /api/testcase
- `getOne()` - GET /api/testcase/:id
- `update()` - PUT /api/testcase/:id
- `clone()` - POST /api/testcase/:id/clone
- `delete()` - DELETE /api/testcase/:id
- `search()` - GET /api/testcase/search
- `bulkUpdate()` - PUT /api/testcase/bulk-update
- `getStats()` - GET /api/testcase/stats/:projectId
- `getByStatus()` - GET /api/testcase/status/:status
- `getRecent()` - GET /api/testcase/recent/:projectId

### routes/testcase.routes.js
Clean route definitions with:
- Authentication checks via middleware
- Role-based access control
- Async error handling via wrapper
- JSDoc comments for each endpoint

---

## 🧪 Testing Benefits

### Before
```javascript
// Hard to test - too many dependencies
router.post('/testcase', (req, res) => {
  // 50 lines of SQL, business logic, response handling mixed
  db.query(...);
});
```

### After
```javascript
// Easy to test - mock the repository
const mockRepository = { create: jest.fn() };
const service = new TestCaseService(mockRepository);
const result = await service.createTestCase(userId, data);
expect(result).toBeDefined();
```

---

## 📝 Database Query Examples

### Find all with pagination
```javascript
const result = await repository.findByProject(projectId, {}, 1, 20);
// Returns: {data: [...], pagination: {total, page, limit, pages, hasNext, hasPrev}}
```

### Search
```javascript
const results = await repository.search('login', projectId);
// Returns: array of matching test cases
```

### Bulk update
```javascript
const count = await repository.bulkUpdate([id1, id2, id3], {priority: 'high'});
// Returns: number of affected rows
```

### Clone with steps
```javascript
await repository.cloneWithSteps('TC-2026-00001', 'TC-2026-00002');
// Creates copy in testcases + all steps in test_steps
```

---

## 🔧 Common Operations

### Creating a test case
```javascript
const testcase = await service.createTestCase(userId, {
  title: 'My Test',
  description: 'Description',
  projectId: 1,
  priority: 'high'  // optional
});
```

### Getting test case with steps
```javascript
const full = await service.getTestCase('TC-2026-00001');
// Returns: {id, title, description, steps: [...], step_count}
```

### Listing with filters
```javascript
const result = await service.listByProject(
  projectId,
  {status: 'ready', priority: 'high'},
  page,
  limit
);
```

### Updating
```javascript
const updated = await service.updateTestCase(
  'TC-2026-00001',
  userId,
  {status: 'approved', priority: 'critical'}
);
```

### Cloning
```javascript
const clone = await service.cloneTestCase('TC-2026-00001', userId);
// Returns: new test case (status: draft, new ID)
```

### Deleting
```javascript
await service.deleteTestCase('TC-2026-00001');
// Soft delete - still in DB, marked as deleted
```

### Searching
```javascript
const results = await service.search('login', projectId);
```

### Bulk update
```javascript
const result = await service.bulkUpdate(
  ['TC-1', 'TC-2', 'TC-3'],
  {priority: 'high'},
  userId
);
// Returns: {success, count, message}
```

---

## ⚠️ Error Handling

All errors are automatically caught by the error handler middleware:

```javascript
// Controller
try {
  const result = await service.createTestCase(userId, data);
  sendSuccess(res, result, 'Created', 201);
} catch (error) {
  next(error);  // Passes to error handler
}

// Error handler automatically:
// - Logs the error
// - Formats response
// - Sends appropriate status code
// - Includes stack trace (dev only)
```

---

## 📈 Next Steps

### Option A: Refactor Other Routes (Repeat Pattern)
1. Copy TestCaseRepository pattern for Bugs, Executions, etc.
2. Create corresponding services
3. Create corresponding controllers
4. Update routes

**Estimated time:** 50-80 hours for all modules

### Option B: Add Tests (Phase 4)
1. Install Jest
2. Write unit tests for services
3. Write integration tests for routes
4. Aim for 80%+ coverage

**Estimated time:** 60-80 hours

### Option C: TypeScript Migration (Phase 2)
1. Set up TypeScript
2. Create type definitions
3. Convert files incrementally
4. Add strict type checking

**Estimated time:** 30-40 hours

---

## ✅ Implementation Checklist

- [x] Folder structure created
- [x] Error classes implemented
- [x] Response formatter created
- [x] Base repository created
- [x] Test case repository created
- [x] Test case service created
- [x] Test case controller created
- [x] Routes created
- [ ] Update server.js to use new routes
- [ ] Test with curl/Postman
- [ ] Commit changes
- [ ] Document in README
- [ ] Repeat for other modules (bugs, executions, etc.)

---

## 🎯 Success Criteria

- [x] Code is organized by concern
- [x] Easy to write unit tests
- [x] Error handling is standardized
- [x] Response format is consistent
- [x] Database operations are abstracted
- [x] Business logic is separated from HTTP
- [x] All methods have JSDoc comments
- [x] Ready for TypeScript migration

**🚀 Phase 1 is COMPLETE! You can now proceed to Phase 2 or refactor other routes.**
