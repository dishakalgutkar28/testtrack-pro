# Assignment-Based Filtering - Implementation Summary

## What Was Implemented

This implementation adds **role-based assignment filtering** to your TestTrack Pro system. Now when testers and developers login:

✅ **They only see testcases assigned to them**
✅ **They only see bugs assigned to them**  
✅ **They only see execution runs for their assigned testcases**
✅ **Dashboard statistics reflect only their assigned items**
✅ **Admins still see everything**

## Files Modified

### Backend Middleware
- **[✓] `/backend/middleware/assignmentMiddleware.js`** - New file
  - Helper functions for assignment-based filtering
  - Access control validation
  - Resource modification checks

### Backend Routes Updated
- **[✓] `/backend/routes/testcaseRoutes.js`**
  - GET /testcase - Now filters by assignment
  
- **[✓] `/backend/routes/bugRoutes.js`**
  - GET /bugs - Now filters by assignment
  
- **[✓] `/backend/routes/executionRoutes.js`**
  - GET /execution - Filters by testcase assignment
  - GET /executions - Filters by testcase assignment
  - GET /execution-run/:runId - Access check before returning run
  - GET /execution-runs/testcase/:testcaseId - Access check before returning runs
  
- **[✓] `/backend/routes/dashboardRoutes.js`**
  - GET /dashboard-data - Shows stats for assigned items only
  
- **[✓] `/backend/routes/projectsRoutes.js`**
  - GET /projects/with-stats - Shows stats for assigned items only
  - GET /projects/:id/testcases - Returns only assigned testcases in project

### Documentation
- **[✓] `/ASSIGNMENT_FILTERING_GUIDE.md`** - Comprehensive implementation guide

## How It Works

### Database Layer
The filtering uses the `assigned_to` column in:
- `testcases` table
- `bugs` table

When user logs in, the JWT token contains their `id` and `role`.

### API Layer
Every GET request now:
1. Checks user role from JWT token
2. If **tester** or **developer**: Adds WHERE clause filtering by `assigned_to = user_id`
3. If **admin**: Returns all items (no filter)
4. Returns filtered results

### Example Query
**Before:**
```sql
SELECT * FROM testcases ORDER BY id DESC
```

**After (for tester/developer):**
```sql
SELECT * FROM testcases 
WHERE testcases.assigned_to = ? 
ORDER BY id DESC
```
(where `?` = user's ID)

## Usage Examples

### Admin Assigns Testcase
```javascript
// Admin calls this to assign testcase to tester
PUT /api/testcase/5
Body: { assigned_to: 15 }  // Assign to user ID 15
```

### Tester Views Their Testcases
```javascript
// Tester calls this to see only assigned testcases
GET /api/testcase
// Response: Only testcases where assigned_to = tester's user ID
{
  "id": 5,
  "title": "Login Form Test",
  "assigned_to": 15,  // This tester's ID
  ...
}
```

### Developer Views Their Bugs
```javascript
// Developer calls this to see only assigned bugs
GET /api/bugs
// Response: Only bugs where assigned_to = developer's user ID
{
  "id": 127,
  "title": "Login button not working",
  "assigned_to": 15,  // This developer's ID
  ...
}
```

### Tester Tries to Access Unassigned Item
```javascript
// Tester tries to view a testcase not assigned to them
GET /api/execution-run/999

// Response: 403 Forbidden
{
  "error": "Access denied. You can only view execution runs for your assigned testcases."
}
```

## Testing Guide

### Test Setup
1. Create 3 test users:
   - Admin user (role: admin)
   - Tester user (role: tester)
   - Developer user (role: developer)

2. Assign some testcases:
   - Testcase 1 → Tester user
   - Testcase 2 → Tester user
   - Testcase 3 → Developer user
   - Testcase 4 → Unassigned

### Test Admin Access
```bash
# Admin token
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:5000/api/testcase
  
# Should return: ALL testcases (1, 2, 3, 4)
```

### Test Tester Access
```bash
# Tester token
curl -H "Authorization: Bearer <tester_token>" \
  http://localhost:5000/api/testcase
  
# Should return: ONLY testcases 1 and 2
```

### Test Developer Access
```bash
# Developer token
curl -H "Authorization: Bearer <dev_token>" \
  http://localhost:5000/api/testcase
  
# Should return: ONLY testcase 3
```

### Test Execution Run Access Control
```bash
# Tester tries to view execution run for unassigned testcase
curl -H "Authorization: Bearer <tester_token>" \
  http://localhost:5000/api/execution-run/999
  
# Should return: 403 Forbidden
```

## Key Features

### 1. **Automatic Filtering**
No frontend changes needed - filtering happens on server side.

### 2. **Access Control**
- Testers/Developers blocked from viewing unassigned items
- Clear error messages when access denied
- Safe design prevents data leakage

### 3. **Admin Override**
- Admins see all items regardless of assignment
- Can assign/reassign items to users
- Can view all execution history

### 4. **Audit Trail**
- Console logs show who accessed what
- Helps track assignment effectiveness

### 5. **Dashboard Accuracy**
- Statistics show only user's assigned items
- No confusion about total workload

## Configuration

### To Change Assignment Field Name
If you use a different field name (not `assigned_to`):

1. Update assignment check in middleware:
```javascript
// In assignmentMiddleware.js
exports.getAssignmentFilter = (user, table = 'testcases') => {
  if (user.role === 'tester' || user.role === 'developer') {
    return {
      whereClause: `${table}.YOUR_FIELD_NAME = ?`,  // Change this
      params: [user.id]
    };
  }
  return { whereClause: '', params: [] };
};
```

2. Update database migration:
```sql
ALTER TABLE testcases 
ADD COLUMN assigned_to INT NULL,
ADD INDEX idx_assigned_to (assigned_to);
```

## Troubleshooting

### Issue: Tester sees empty list
**Solution:** Check if testcases are assigned to them in database
```sql
SELECT id, title, assigned_to FROM testcases 
WHERE assigned_to = <tester_user_id>;
```

### Issue: Admin sees filtered results
**Solution:** Check user role in JWT token
```javascript
// Verify token contains role: 'admin'
const decoded = jwt.verify(token, secret);
console.log(decoded.role);  // Should be 'admin'
```

### Issue: CORS error on endpoints
**Solution:** Ensure authMiddleware is properly importing assignment middleware

### Issue: Execution runs show 403 for valid testcase
**Solution:** Check if testcase record exists and isn't deleted
```sql
SELECT * FROM testcases WHERE id = <testcase_id>;
```

## Performance Notes

- Filtering happens at database query level (efficient)
- No additional database round-trips needed
- Uses indexes on `assigned_to` column (already created)
- Minimal overhead compared to returning all data

## Frontend Integration

### No Breaking Changes
Your frontend API calls remain the same:
```javascript
// These calls still work exactly the same
const response = await fetch('/api/testcase');
const response = await fetch('/api/bugs');
const response = await fetch('/api/execution-run/123');
```

The only difference is the response now contains filtered data.

## Future Enhancements

Possible improvements:
1. **Batch Assignment** - Assign multiple testcases at once
2. **Team Assignment** - Assign to teams instead of individuals
3. **Temporary Assignments** - Auto-remove after date
4. **Assignment History** - Track assignment changes
5. **Notifications** - Notify users when assigned

## Support Matrix

| Feature | Testcases | Bugs | Execution Runs | Dashboard |
|---------|-----------|------|---|----------|
| Assignment Check | ✅ | ✅ | ✅ | ✅ |
| Admin Override | ✅ | ✅ | ✅ | ✅ |
| Error Handling | ✅ | ✅ | ✅ | ✅ |
| Audit Logging | ✅ | ✅ | ✅ | ✅ |

## Questions?

Refer to `ASSIGNMENT_FILTERING_GUIDE.md` for detailed documentation including:
- Architecture details
- Database schema explanation
- Access control matrix
- Implementation checklist
- Quick reference for adding to new endpoints
