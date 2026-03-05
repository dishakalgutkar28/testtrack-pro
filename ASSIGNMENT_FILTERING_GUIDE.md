# Role-Based Assignment Filtering Implementation

## Overview
This implementation ensures that **Testers** and **Developers** only see and interact with items (test cases, bugs, execution runs) that have been explicitly assigned to them. **Admins** have access to all items.

## Architecture

### Backend Components

#### 1. Assignment Middleware (`/backend/middleware/assignmentMiddleware.js`)
Core middleware that handles assignment-based filtering logic:

- **getAssignmentFilter(user, table)** - Returns WHERE clause and parameters for filtering:
  - **Admins**: No filter (see everything)
  - **Testers/Developers**: Filtered to `assigned_to = user.id`

- **canAccessResource(user, assignedToUserId)** - Checks if user can view a resource
- **canModifyResource(user, createdByUserId, assignedToUserId)** - Checks if user can edit a resource

### 2. Updated Routes

#### Testcases (`/backend/routes/testcaseRoutes.js`)
- **GET /testcase** - Returns only assigned testcases for testers/developers
- **GET /testcase/:id** - Implicit filtering (used in detail views)
- Filtering logic:
  ```
  - Admins: See all testcases
  - Testers/Developers: See only WHERE testcases.assigned_to = user_id
  ```

#### Bugs (`/backend/routes/bugRoutes.js`)
- **GET /bugs** - Returns only assigned bugs for testers/developers
- Filtering logic:
  ```
  - Admins: See all bugs
  - Testers/Developers: See only WHERE bugs.assigned_to = user_id
  ```

#### Executions (`/backend/routes/executionRoutes.js`)
- **GET /execution** & **GET /executions** - Returns only executions for assigned testcases
- **GET /execution-run/:runId** - Access check based on testcase assignment
- **GET /execution-runs/testcase/:testcaseId** - Access check on testcase before returning runs
- Filtering logic:
  ```
  - Admins: See all executions and runs
  - Testers/Developers: See only executions where the related testcase is assigned to them
  ```

## Database Schema

### Key Fields

**testcases** table:
```sql
- id (INT) - Primary key
- assigned_to (INT, nullable) - User ID this testcase is assigned to
- created_by (INT) - User who created it
- is_deleted (BOOLEAN)
```

**bugs** table:
```sql
- id (INT) - Primary key
- assigned_to (INT, nullable) - User ID this bug is assigned to
- reported_by (INT) - User who reported it
- created_by (INT) - User who created it
```

**execution_runs** table:
```sql
- id (INT) - Primary key
- testcase_id (INT) - FK to testcases
- tester_id (INT) - User who ran the execution
```

## Frontend Implementation Guide

### 1. Authentication & Authorization Check
```javascript
// When user logs in, store role in token/context
const userRole = decodedToken.role; // 'tester', 'developer', 'admin'
const userId = decodedToken.id;
```

### 2. API Calls - No Changes Needed
The filtering happens automatically on the backend:
```javascript
// Frontend can call these endpoints normally
// Backend automatically filters results based on user role

// Fetch testcases
const response = await fetch('/api/testcase', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Returns: Only assigned testcases for testers/developers

// Fetch bugs
const response = await fetch('/api/bugs', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Returns: Only assigned bugs for testers/developers

// Fetch execution runs
const response = await fetch('/api/execution-run/123', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Returns: 403 if testcase not assigned to user; success if assigned or user is admin
```

### 3. UI/UX Considerations
```javascript
// Conditionally show assignment features for admins
const canAssignItems = userRole === 'admin';

// Display assigned-to user info
if (testcase.assigned_to === userId) {
  showBadge('Assigned to You');
} else if (testcase.assigned_to) {
  showBadge(`Assigned to User ${testcase.assigned_to}`);
}

// Filter already happens server-side, but you can also filter client-side
// for a better UX (showing only "my items" in dropdowns, etc)
```

## Assignment Workflow

### Admin Assigns Testcase to Tester/Developer
1. Admin calls: `PUT /testcase/:id` with `{ assigned_to: tester_user_id }`
2. Testcase is now visible to that tester/developer
3. Tester/Developer can now:
   - View the testcase
   - Execute it (create execution runs)
   - View related bugs

### Tester/Developer Executes Their Assigned Testcase
1. Tester calls: `GET /testcase` → sees only assigned testcases
2. Tester calls: `POST /execution-run/start` with testcase_id
3. Tester can then: `GET /execution-run/:runId` → sees only their execution runs

### Bug Assignment
1. Tester reports bug and assigns to developer
2. Developer calls: `GET /bugs` → sees only assigned bugs
3. Developer updates bug status: `PUT /bugs/:id`

## Access Control Matrix

| Action | Unassigned Tester | Assigned Tester | Developer | Admin |
|--------|------------------|-----------------|-----------|-------|
| View testcase | ❌ | ✅ | ✅ (if assigned) | ✅ |
| View bug | ❌ | ✅ (if assigned) | ✅ (if assigned) | ✅ |
| Create execution | ❌ | ✅ (assigned only) | ✅ (assigned only) | ✅ |
| View execution run | ❌ | ✅ (owned testcase) | ✅ (owned testcase) | ✅ |
| Assign to user | ❌ | ❌ | ❌ | ✅ |
| Update status | ✅ (own items) | ✅ (assigned) | ✅ (assigned) | ✅ |

## Error Messages

When a tester/developer tries to access unassigned items:
```json
{
  "error": "Access denied. You can only view [item type] for your assigned items."
}
```

## Logging & Audit

All access attempts are logged:
```javascript
console.log(`✅ User ${userId} (${userRole}) fetched ${results.length} testcases`);
```

This helps admins track:
- Who accessed what
- When items were viewed
- Assignment effectiveness

## Implementation Checklist

- [x] Create assignmentMiddleware.js with helper functions
- [x] Update testcaseRoutes.js - GET /testcase endpoint
- [x] Update bugRoutes.js - GET /bugs endpoint
- [x] Update executionRoutes.js - All GET endpoints
- [ ] Update dashboardRoutes.js (if needed) - GET /dashboard endpoints
- [ ] Update testSuiteRoutes.js (if needed) - GET /test-suites endpoints
- [ ] Update any other GET endpoints that return user-sensitive data
- [ ] Frontend: Add conditional rendering based on assignment
- [ ] Frontend: Handle 403 errors gracefully
- [ ] Testing: Test as different roles (admin, tester, developer)
- [ ] Testing: Verify filtering works across all endpoints

## Future Enhancements

1. **Group/Team Assignments**: Assign testcases to groups instead of individual users
2. **Read-Only Permission**: Testers can view but not modify
3. **Temporary Assignments**: Time-based assignments with auto-revocation
4. **Bulk Assignment**: Admin assigns multiple testcases at once
5. **Assignment Notifications**: Notify users when assigned
6. **Assignment History**: Track who assigned what and when

## Testing

### Test as Admin
```javascript
// Should see all items
GET /api/testcase → returns all testcases
GET /api/bugs → returns all bugs
```

### Test as Tester (assigned to testcase ID 5)
```javascript
// Should only see assigned items
GET /api/testcase → returns testcases where assigned_to = user_id
GET /api/bugs → returns bugs where assigned_to = user_id
GET /api/execution-run/123 → 403 if testcase_id 5 not assigned to user
```

### Test as Developer (no assignments)
```javascript
// Should see empty results
GET /api/testcase → returns [] (no testcases assigned)
GET /api/bugs → returns [] (no bugs assigned)
```

## Troubleshooting

**Q: User sees 403 error when accessing an execution run**
A: Check if the related testcase is assigned to that user. If not, admin needs to assign it first.

**Q: Admins can't see certain items**
A: Admins should always see everything. If not, check if there's a deleted flag or other filter.

**Q: Frontend fetches data but items are empty**
A: Verify items are assigned to the logged-in user in the database.

## Quick Reference

### To add filtering to a new endpoint:
1. Import the middleware:
   ```javascript
   const { getAssignmentFilter } = require("../middleware/assignmentMiddleware");
   ```

2. Add filtering in your GET route:
   ```javascript
   const assignmentFilter = getAssignmentFilter(req.user, 'table_name');
   
   // Build your WHERE clause
   const conditions = [];
   const params = [];
   
   if (assignmentFilter.whereClause) {
     conditions.push(assignmentFilter.whereClause);
     params.push(...assignmentFilter.params);
   }
   
   const sql = `SELECT * FROM table_name WHERE ${conditions.join(" AND ")}`;
   db.query(sql, params, (err, results) => {
     // handle results
   });
   ```

3. For detail endpoints, add access check:
   ```javascript
   const { canAccessResource } = require("../middleware/assignmentMiddleware");
   
   if (!canAccessResource(req.user, resource.assigned_to)) {
     return res.status(403).json({ error: "Access denied" });
   }
   ```
