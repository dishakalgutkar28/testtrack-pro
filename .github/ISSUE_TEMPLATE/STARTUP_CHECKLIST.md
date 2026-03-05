# ⚡ Quick Startup Checklist - 4 Features

## Before Starting Servers

### 1. Install Dependencies
```bash
cd /backend
npm install
```
✅ This will install `multer` and any other missing packages

### 2. Verify Database Connection
```bash
# In backend directory
node -e "const db = require('./config/db'); db.connection"
```
✅ Should connect without errors

### 3. Check File Permissions
```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```
✅ Ensures upload directory is writable

### 4. Verify Database Schema
```bash
mysql -u root -p testtrack -e "
SHOW TABLES LIKE '%attachment%';
DESCRIBE testcases;
"
```
✅ Should show:
- testcase_attachments table
- bug_attachments table
- testcases columns: is_deleted, deleted_at, deleted_by
- bugs columns: created_by, reported_by

---

## Starting Servers

### Terminal 1: Backend
```bash
cd backend
npm start
```
✅ Check for:
- "Server running on port 5000"
- No errors about attachment routes
- No errors about multer

### Terminal 2: Frontend
```bash
cd frontend
npm start
```
✅ Check for:
- "Compiled successfully"
- Frontend opens on http://localhost:3000

---

## Quick Functionality Check

### 1. Login
- Go to http://localhost:3000
- Login as Tester (email: tester@example.com, password: tester123)

### 2. Test Feature 1: Create & Edit Testcase
- Click "Test Cases" in sidebar
- Click "Create Test Case"
- Fill in title, description, expected result
- Click "Create"
- ✅ Testcase appears in list
- Click on it → Edit button appears
- Change description and click "Update"
- ✅ Changes saved

### 3. Test Feature 2: Soft Delete
- On same testcase, click "Delete"
- Confirm deletion
- ✅ Testcase disappears from list
- Check database:
  ```bash
  mysql -u root -p testtrack -e "SELECT id, title, is_deleted FROM testcases WHERE is_deleted = TRUE LIMIT 1;"
  ```
- ✅ Record exists with is_deleted = TRUE

### 4. Test Feature 3: Report & Assign Bug
- Click "Bugs" in sidebar
- Click "Report New Bug"
- Fill in title: "Test Bug"
- Click "Create Bug"
- ✅ Bug created
- Click on bug → "Assign To" dropdown appears
- Select a developer from dropdown
- Click "Assign"
- ✅ Bug assigned successfully

### 5. Test Feature 4: Upload Attachment
- Click on any testcase/bug detail
- Scroll down to "Attachments" section
- Click "Choose File" or drag-drop a PDF
- ✅ File uploads
- File appears in list with download & delete buttons

---

## Verify All 4 Features Are Working

### Feature 1: Ownership Enforcement
```
✅ Tester can edit own testcase
✅ Tester cannot edit other tester's testcase
✅ Admin can edit any testcase
```

### Feature 2: Soft Delete
```
✅ Deleted testcase not shown in list
✅ Record exists in database with is_deleted = TRUE
✅ Audit log entry created
```

### Feature 3: Tester Assignment
```
✅ Tester can create bugs
✅ Tester can assign to developer
✅ Developer notified of assignment
```

### Feature 4: Attachments
```
✅ Can upload file
✅ File appears in list
✅ Can download file
✅ Can delete own file
```

---

## Common Issues & Fixes

### ❌ Upload fails with "Cannot POST /api/attachments"
**Fix**: Check server.js has `app.use("/api", attachmentRoutes);`

### ❌ "multer is not installed"
**Fix**: Run `npm install` in backend directory

### ❌ Upload directory permission denied
**Fix**: `mkdir -p backend/uploads && chmod 755 backend/uploads`

### ❌ Soft delete doesn't hide testcase from list
**Fix**: Verify GET /testcase query has `WHERE is_deleted = FALSE`

### ❌ Tester cannot assign bug
**Fix**: Check bugRoutes.js PUT /bugs/:id allows testers and enforces ownership

### ❌ Attachment component not showing
**Fix**: 
- Check Attachments.js imported in Bug.js/Testcase.js
- Check props are `entityType="bug"` and `entityId={id}`
- Check API path matches: `/api/attachments/{type}/{id}`

---

## Database Setup (if starting fresh)

Run this SQL in your MySQL client to prepare the database:

```sql
-- Soft delete columns for testcases
ALTER TABLE testcases 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INT NULL;

-- Ownership columns for bugs
ALTER TABLE bugs 
ADD COLUMN IF NOT EXISTS created_by INT NULL,
ADD COLUMN IF NOT EXISTS reported_by INT NULL;

-- Attachment tables
CREATE TABLE IF NOT EXISTS testcase_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  testcase_id INT NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by INT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_testcase_id (testcase_id),
  FOREIGN KEY (testcase_id) REFERENCES testcases(id)
);

CREATE TABLE IF NOT EXISTS bug_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bug_id INT NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by INT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bug_id (bug_id),
  FOREIGN KEY (bug_id) REFERENCES bugs(id)
);
```

---

## Verify All Code Files Exist

```bash
# Backend
ls -la backend/routes/attachmentRoutes.js
ls -la backend/middleware/rateLimiter.js (should have uploadLimiter)

# Frontend
ls -la frontend/src/components/Attachments.js
ls -la frontend/src/components/Attachments.css

# Verify imports
grep -n "attachmentRoutes" backend/server.js
grep -n "Attachments" frontend/src/pages/Bug.js
grep -n "Attachments" frontend/src/pages/Testcase.js
```

---

## After Verification

✅ All systems running
✅ All 4 features working
✅ Database synchronized
✅ Frontend showing UI components

**Ready for testing!** 🚀

See [TESTING_4_FEATURES.md](TESTING_4_FEATURES.md) for detailed test cases.
