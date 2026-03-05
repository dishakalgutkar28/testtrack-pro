# 🔒 Assignment-Based Access Control Implementation

## Overview

Your TestTrack Pro system now has **role-based assignment filtering**. When users login:

- **Testers** 👤 see only testcases and bugs assigned to them
- **Developers** 👤 see only testcases and bugs assigned to them  
- **Admins** 👨‍💼 see everything and can assign work

This ensures data security and prevents users from seeing work they're not responsible for.

---

## 📋 What Was Changed

### New Files
1. **`/backend/middleware/assignmentMiddleware.js`**
   - Core filtering logic
   - Access control helpers
   - Resource modification checks

### Modified Files
1. **`/backend/routes/testcaseRoutes.js`** - Filters testcases by assignment
2. **`/backend/routes/bugRoutes.js`** - Filters bugs by assignment
3. **`/backend/routes/executionRoutes.js`** - Filters executions & runs by testcase assignment
4. **`/backend/routes/dashboardRoutes.js`** - Shows statistics for assigned items only
5. **`/backend/routes/projectsRoutes.js`** - Filters project testcases by assignment

### Documentation
1. **`ASSIGNMENT_FILTERING_GUIDE.md`** - Detailed technical documentation
2. **`IMPLEMENTATION_SUMMARY.md`** - Quick reference guide
3. **`test-assignment-filtering.js`** - Test script and manual testing guide

---

## 🚀 Quick Start

### How It Works (Simple Version)

```
User logs in with role: 'tester'
      ↓
JWT token created with { id: 5, role: 'tester' }
      ↓
User calls: GET /api/testcase
      ↓
Backend checks: role = 'tester' ?
      ↓
YES → Add filter: WHERE assigned_to = 5
      ↓
Return only testcases assigned to user 5
```

### Database Structure

Your database already has the `assigned_to` field:
- **testcases** table: `assigned_to INT` column
- **bugs** table: `assigned_to INT` column

The filtering uses this field to control visibility.

---

## 📍 Endpoint Changes

### Testcases

**GET /api/testcase**
```
ADMIN   → All testcases
TESTER  → Only WHERE assigned_to = user_id
DEV     → Only WHERE assigned_to = user_id
```

### Bugs

**GET /api/bugs**
```
ADMIN   → All bugs
TESTER  → Only WHERE assigned_to = user_id  
DEV     → Only WHERE assigned_to = user_id
```

### Executions

**GET /api/execution** & **GET /api/executions**
```
ADMIN   → All executions
TESTER  → Only for assigned testcases
DEV     → Only for assigned testcases
```

**GET /api/execution-run/:runId**
```
ADMIN   → Can access any run
TESTER  → Can access runs for assigned testcases only
DEV     → Can access runs for assigned testcases only
→ Returns 403 if testcase not assigned
```

### Dashboard

**GET /api/dashboard-data**
```
ADMIN   → Shows counts for ALL items
TESTER  → Shows counts for assigned items only
DEV     → Shows counts for assigned items only
```

---

## 🧪 Testing the Implementation

### Quick Test (Using curl)

1. **Get an admin token:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@test.com", "password": "password"}'
   ```

2. **As Admin (see all testcases):**
   ```bash
   curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
     http://localhost:5000/api/testcase
   # Returns: All testcases
   ```

3. **As Tester (see only assigned):**
   ```bash
   curl -H "Authorization: Bearer <TESTER_TOKEN>" \
     http://localhost:5000/api/testcase
   # Returns: Only testcases where assigned_to = tester_user_id
   ```

4. **Admin assigns testcase to tester:**
   ```bash
   curl -X PUT http://localhost:5000/api/testcase/5 \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"assigned_to": 15}'
   # Result: Testcase 5 is now assigned to user 15
   ```

5. **Tester now sees it:**
   ```bash
   curl -H "Authorization: Bearer <TESTER_TOKEN>" \
     http://localhost:5000/api/testcase
   # Returns: Testcase 5 (and any others assigned to them)
   ```

### Automated Test Script

```bash
cd backend
node test-assignment-filtering.js
```

This prints a manual testing guide with all curl commands.

---

## 🔍 How to Verify It's Working

### In Database

```sql
-- Check testcase assignments
SELECT id, title, assigned_to FROM testcases LIMIT 5;

-- Check which user is assigned testcase ID 1
SELECT assigned_to FROM testcases WHERE id = 1;
```

### In Browser Dev Tools (Frontend)

```javascript
// After fetch, check response
const response = await fetch('/api/testcase');
const data = await response.json();
console.log(data);  // Should only show assigned items for non-admins
```

### In Server Logs

```
✅ User 15 (tester) fetched 3 testcases
✅ User 1 (admin) fetched 12 testcases
```

---

## ⚙️ Configuration

### Default Setup (Already Configured)
- Uses `assigned_to` column
- Filters for 'tester' and 'developer' roles
- Admins bypass filter
- 403 error when access denied

### To Customize

**Change which roles are filtered:**
Edit `/backend/middleware/assignmentMiddleware.js`
```javascript
if (user.role === 'tester' || user.role === 'developer') {
  // Add your roles here
}
```

**Change filter field name:**
Edit `/backend/middleware/assignmentMiddleware.js`
```javascript
whereClause: `${table}.assigned_to = ?`  // Change 'assigned_to' if needed
```

---

## 🛡️ Security Features

✅ **Server-Side Filtering** - No client-side filtering (secure)
✅ **Role-Based** - Different rules for different roles  
✅ **Audit Logging** - Console logs who accessed what
✅ **Error Handling** - Clear error messages for denials
✅ **No Data Leaks** - Unassigned items completely hidden

---

## 📊 Access Control Matrix

| Action | Unassigned Worker | Assigned Worker | Admin |
|--------|---|---|---|
| View assigned items | ❌ | ✅ | ✅ |
| View unassigned items | ❌ | ❌ | ✅ |
| Edit own items | ✅ | ✅ | ✅ |
| Assign work to others | ❌ | ❌ | ✅ |
| View all stats | ❌ | Only assigned | ✅ All |

---

## ❓ Frequently Asked Questions

### Q: Does the frontend need to change?
**A:** No! The API calls remain the same. Backend automatically filters results.

### Q: What if a testcase has no assigned_to?
**A:** Only admins see it. Testers/developers see nothing.

### Q: Can users reassign work?
**A:** No, only admins can assign (PUT /testcase/:id with assigned_to).

### Q: What about created_by field?
**A:** It tracks who created the item, but assignment is separate.

### Q: Can I see an item I created but didn't assign to myself?
**A:** No, only the assigned user (or admin) can view it.

### Q: What if I unassign a user?  
**A:** They lose access immediately. Next time they fetch, it won't appear.

### Q: Does admins still need to be assigned?
**A:** No, admins bypass the filter entirely.

---

## 🚨 Troubleshooting

### Issue: "I don't see any testcases"
**Check:**
1. Are any testcases assigned to you?
   ```sql
   SELECT * FROM testcases WHERE assigned_to = <your_user_id>;
   ```
2. Ask admin to assign testcases to you
3. Check your user ID is correct in the JWT token

### Issue: "403 Forbidden error"
**This is correct behavior!** You're accessing something not assigned to you.
**Fix:** Have an admin assign it to you.

### Issue: "I'm admin but still see filtered results"  
**Check:**
1. Verify token has `role: 'admin'`
   ```javascript
   const decoded = jwt.decode(token);
   console.log(decoded.role);  // Should be 'admin'
   ```
2. Try logging in again as admin
3. Check database that user has role = 'admin'

### Issue: "Testcase shows in assignment but I can't see it"
**Check:**
1. Refresh the page
2. Check token hasn't expired
3. Verify assigned_to matches your user ID in database

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `ASSIGNMENT_FILTERING_GUIDE.md` | Detailed technical reference |
| `IMPLEMENTATION_SUMMARY.md` | Quick implementation overview |
| `test-assignment-filtering.js` | Testing guide and examples |
| This file | General overview |

---

## 🔄 Assignment Workflow

### Daily Workflow

1. **Admin opens dashboard**
   - Sees all projects, all testcases, all bugs
   - Assigns work: "User 15 (Tester) → Testcase 5"

2. **Tester logs in**
   - Sees: "Testcase 5 (Assigned to me)"
   - Executes testcase
   - Creates execution run
   - Reports any bugs found

3. **Developer logs in**
   - Sees: "Bug #127 (Assigned to me)"
   - Updates bug status
   - Links to commits

---

## 🎯 Expected Behavior

### ✅ Correct Behavior
```
// Admin API call
GET /api/testcase → Returns 12 testcases (all)

// Tester API call (assigned 2 testcases)
GET /api/testcase → Returns 2 testcases

// Tester tries to view unassigned execution
GET /api/execution-run/999 → 403 Forbidden
Error: "Access denied. You can only view execution runs for your assigned testcases."
```

### ❌ Security Breach Prevention
```
// Before: Tester could see all testcases
GET /api/testcase → ALL testcases returned ❌

// After: Tester only sees assigned
GET /api/testcase → Only assigned returned ✅
```

---

## 📈 Monitoring

### Logs to Watch For

```javascript
// Successful fetch
✅ User 15 (tester) fetched 5 testcases

// Access denial
❌ User 15 (tester) denied access to unassigned item

// Admin access
✅ Admin 1 fetched all data
```

### Database Queries to Monitor

```sql
-- Check current assignments
SELECT 
  u.email,
  COUNT(t.id) as assigned_testcases
FROM users u
LEFT JOIN testcases t ON u.id = t.assigned_to
GROUP BY u.id;
```

---

## 🆘 Getting Help

### Check Implementation
1. Review `ASSIGNMENT_FILTERING_GUIDE.md` for architecture details
2. Review `IMPLEMENTATION_SUMMARY.md` for quick reference
3. Run `test-assignment-filtering.js` for testing guide

### Common Issues
- **See FAQ section above**
- **Check database** with SQL queries
- **Check JWT token** has correct role
- **Check browser console** for error messages

### Verify Changes
```bash
# Check if middleware file exists
ls -la backend/middleware/assignmentMiddleware.js

# Check if routes were updated
grep -n "getAssignmentFilter" backend/routes/*.js
```

---

## ✨ Next Steps

1. **Test the implementation** using test-assignment-filtering.js
2. **Assign some testcases** to testers/developers
3. **Verify filtering works** with different user roles
4. **Update frontend** if needed for better UX
5. **Deploy to production** after testing

---

## 📝 Summary

You've successfully implemented **assignment-based access control** for TestTrack Pro!

- ✅ Testers see only assigned testcases
- ✅ Developers see only assigned bugs
- ✅ Admins see everything
- ✅ Server-side filtering (secure)
- ✅ Zero frontend changes needed
- ✅ Complete audit trail

Your system is now more secure and organized! 🎉
