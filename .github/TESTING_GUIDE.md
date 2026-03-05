# 🧪 TestTrack Pro - Testing Guide for New Features

## Prerequisites
✅ Dependencies installed (pdfkit, exceljs)  
⚠️ Database migrations needed (see below)

---

## 🗄️ Step 1: Run Database Migrations

### Option A: Using MySQL Workbench (Recommended)
1. Open **MySQL Workbench**
2. Connect to your `testtrack` database
3. Open and execute these files in order:
   - `backend/migrations/002_test_suite_management.sql`
   - `backend/migrations/003_notifications_system.sql`

### Option B: Using Command Line (if MySQL is in PATH)
```bash
mysql -u root -p testtrack < backend/migrations/002_test_suite_management.sql
mysql -u root -p testtrack < backend/migrations/003_notifications_system.sql
```

### Option C: Copy-Paste SQL
Open your MySQL client and run the SQL from these files manually.

---

## 🚀 Step 2: Start the Application

### Start Backend (Terminal 1)
```powershell
cd backend
npm start
```
**Expected output:**
```
✅ Database connected successfully
✅ Server is running on http://localhost:5000
```

### Start Frontend (Terminal 2)
```powershell
cd frontend
npm start
```
**Expected output:**
```
Compiled successfully!
Local: http://localhost:3000
```

---

## 📋 Feature 1: Test Suite Management

### What to Test:
1. **Navigate to Test Suites**
   - Login to app: http://localhost:3000
   - Look for "Test Suites" link in navbar OR
   - Manually go to: http://localhost:3000/test-suites

2. **Create a Test Suite**
   - Click "Create Test Suite" button
   - Fill in:
     - Name: "Smoke Test Suite"
     - Description: "Critical functionality tests"
     - Select a project
   - Click "Create"
   - ✅ Should see new suite in the list

3. **Add Test Cases to Suite**
   - Click "Manage Test Cases" on any suite card
   - Click "Add Test Cases" button
   - Select 3-5 test cases
   - Click "Add Selected"
   - ✅ Should see test cases listed with order numbers

4. **Reorder Test Cases**
   - Use ↑ ↓ arrows to reorder tests
   - ✅ Order should change and persist

5. **Clone a Suite**
   - Click 📋 (clone) icon on suite card
   - ✅ Should see "COPY - Smoke Test Suite" created

### API Endpoints to Test:
```powershell
# Get all test suites
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/test-suites

# Get specific suite details
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/test-suites/1
```

---

## 🔔 Feature 2: In-App Notifications

### What to Test:
1. **Check Notification Bell**
   - After login, look at top-right navbar
   - ✅ Should see 🔔 bell icon with badge (if unread notifications exist)

2. **View Notifications**
   - Click the bell icon
   - ✅ Dropdown should show recent notifications
   - Try "Mark all as read" button

3. **Full Notifications Page**
   - Click "View All Notifications" in dropdown OR
   - Navigate to: http://localhost:3000/notifications
   - ✅ Should see paginated list with filters

4. **Create Test Notification** (via API)
   ```powershell
   # Get your auth token first (from browser devtools > Application > localStorage > token)
   
   curl -X POST http://localhost:5000/api/notifications ^
     -H "Content-Type: application/json" ^
     -H "Authorization: Bearer YOUR_TOKEN" ^
     -d "{\"user_id\": 1, \"type\": \"system\", \"title\": \"Test Alert\", \"message\": \"This is a test notification\"}"
   ```
   - ✅ Notification should appear in bell dropdown
   - ✅ Bell badge count should increase

5. **Real-time Updates**
   - Leave app open for 30 seconds
   - ✅ Bell should auto-refresh (polls every 30s)

### Notification Types Available:
- `bug_assigned` 🐛
- `bug_status_changed` 🔄
- `testcase_assigned` 📝
- `comment_added` 💬
- `execution_completed` ✅
- `mention` @
- `system` 📢

---

## 📊 Feature 3: Report Export (PDF/Excel/CSV)

### What to Test:

#### A. Export Bugs as PDF
```powershell
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/reports/export/bugs/pdf?project_id=1" `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN"} `
  -OutFile "bugs-report.pdf"
```
**✅ Expected:** Professional PDF with:
- Header with TestTrack Pro logo
- Bug details table
- Filters applied section
- Page numbers

#### B. Export Bugs as Excel
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/reports/export/bugs/excel?status=open" `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN"} `
  -OutFile "bugs-report.xlsx"
```
**✅ Expected:** Excel file with:
- Styled header row (blue background)
- Alternating row colors
- Auto-fit columns
- All bug fields

#### C. Export Test Cases as CSV
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/reports/export/testcases/csv" `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN"} `
  -OutFile "testcases.csv"
```
**✅ Expected:** CSV file that opens in Excel/Google Sheets

#### D. Export Execution Summary
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/reports/export/execution-summary/pdf?date_from=2026-02-01" `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN"} `
  -OutFile "execution-summary.pdf"
```
**✅ Expected:** PDF with execution stats and color-coded results

### Available Export Endpoints:
- `/api/reports/export/bugs/pdf`
- `/api/reports/export/bugs/excel`
- `/api/reports/export/testcases/csv`
- `/api/reports/export/execution-summary/pdf`

### Query Parameters (optional):
- `project_id=1` - Filter by project
- `status=open` - Filter by status
- `severity=high` - Filter by severity
- `date_from=2026-02-01` - Filter by date range
- `date_to=2026-02-28`

---

## 🛡️ Feature 4: CSRF Protection

### What to Test:

1. **Get CSRF Token**
   ```powershell
   curl http://localhost:5000/api/csrf-token
   ```
   **✅ Expected response:**
   ```json
   {
     "success": true,
     "csrf_token": "abc123def456...",
     "session_id": "xyz789..."
   }
   ```

2. **Try Request Without Token** (Should fail)
   ```powershell
   curl -X POST http://localhost:5000/api/testcases ^
     -H "Content-Type: application/json" ^
     -H "Authorization: Bearer YOUR_TOKEN" ^
     -d "{\"title\":\"Test Case\"}"
   ```
   **✅ Expected:** `403 Forbidden` with error message

3. **Try Request With Token** (Should succeed)
   ```powershell
   curl -X POST http://localhost:5000/api/testcases ^
     -H "Content-Type: application/json" ^
     -H "Authorization: Bearer YOUR_TOKEN" ^
     -H "X-CSRF-Token: abc123def456..." ^
     -d "{\"title\":\"Test Case\",\"description\":\"Test\"}"
   ```
   **✅ Expected:** `201 Created` with test case

### Note: 
CSRF tokens are **automatically handled** by the frontend. Manual testing is mainly for understanding the security mechanism.

---

## 📧 Feature 5: Production Email Service

### What to Test:

1. **Configure Email Provider** (in `backend/.env`)
   
   **For Gmail:**
   ```env
   NODE_ENV=production
   EMAIL_PROVIDER=gmail
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-password
   EMAIL_FROM=TestTrack Pro <noreply@testtrack.com>
   ```
   
   **Note:** Get Gmail App Password from:
   https://myaccount.google.com/apppasswords

2. **Test Password Reset Email**
   - Go to: http://localhost:3000/forgot-password
   - Enter your email address
   - Click "Send Reset Link"
   - ✅ Check your inbox for professional HTML email
   - ✅ Click the reset link - should work

3. **Test Registration Email**
   - Register a new account with your email
   - ✅ Check inbox for verification email
   - ✅ Email should have:
     - Professional HTML design
     - Blue "Verify Email" button
     - Expiration notice (24 hours)

4. **Test Development Mode** (Console logging)
   ```env
   NODE_ENV=development
   ```
   - Restart backend
   - Try password reset
   - ✅ Email should log to console instead of sending

### Supported Email Providers:
- ✅ Gmail (recommended for small-scale)
- ✅ SendGrid (scalable)
- ✅ AWS SES (enterprise)
- ✅ Generic SMTP (any provider)

---

## 🧹 Troubleshooting

### Backend won't start?
```powershell
# Check if port 5000 is in use
Get-NetTCPConnection -LocalPort 5000

# Kill process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Database connection error?
- Verify MySQL is running
- Check credentials in `backend/.env`
- Ensure database `testtrack` exists

### Frontend can't connect to backend?
- Check CORS settings in `backend/.env`:
  ```env
  CORS_ORIGIN=http://localhost:3000
  ```

### Migrations not working?
- Check table existence:
  ```sql
  SHOW TABLES LIKE 'test_suites';
  SHOW TABLES LIKE 'notifications';
  ```

---

## 📊 Success Checklist

After testing, verify:
- [ ] Test Suites page loads and displays suites
- [ ] Can create, edit, delete test suites
- [ ] Can add/remove test cases from suites
- [ ] Notification bell shows unread count
- [ ] Can view and dismiss notifications
- [ ] PDF export downloads successfully
- [ ] Excel export opens in Microsoft Excel
- [ ] CSV export opens in Excel/Sheets
- [ ] CSRF token endpoint returns valid token
- [ ] Password reset email arrives in inbox

---

## 🎉 What's Next?

Once all features are verified:
1. **Add Export Buttons** to frontend Reports page
2. **Integrate Notification Helper** in bug assignment/comment flows
3. **Write Unit Tests** for new features (70% coverage goal)
4. **Deploy to Production** using CI/CD pipelines in `.github/workflows/`

---

## 📞 Need Help?

- Check backend logs in console for errors
- Check browser DevTools Console for frontend errors
- Verify all migrations ran successfully
- Ensure all npm packages installed correctly

