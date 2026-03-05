# 🚀 Quick Start - Test New Features (5 minutes)

## Step 1: Run Database Migrations (1 minute)

**Option A: Using MySQL Workbench (Easiest)**
1. Open MySQL Workbench
2. Connect to `testtrack` database
3. Open file: `backend/migrations/RUN_ALL_MIGRATIONS.sql`
4. Click ⚡ Execute button
5. ✅ Should see "Migration completed successfully!"

**Option B: Using phpMyAdmin**  
1. Login to phpMyAdmin
2. Select `testtrack` database
3. Click "SQL" tab
4. Copy/paste content from `backend/migrations/RUN_ALL_MIGRATIONS.sql`
5. Click "Go"

---

## Step 2: Start Backend (30 seconds)

```powershell
cd backend
npm start
```

✅ **Wait for:** `Server is running on http://localhost:5000`

---

## Step 3: Start Frontend (30 seconds)

Open **NEW terminal window**:
```powershell
cd frontend  
npm start
```

✅ **Wait for:** Browser opens at `http://localhost:3000`

---

## Step 4: Test Features (3 minutes)

### 🔔 Test Notifications (30 seconds)
1. Login to app
2. Look at top-right corner → See 🔔 bell icon
3. Click bell → See notification dropdown
4. ✅ **SUCCESS!** You now have real-time notifications

### 📋 Test Test Suites (1 minute)
1. In navbar, find "Test Suites" link OR
2. Navigate to: `http://localhost:3000/test-suites`
3. Click "Create Test Suite" button
4. Fill in name: "My First Suite", click Create
5. Click "Manage Test Cases" on the suite card
6. Click "Add Test Cases", select a few, click Add
7. ✅ **SUCCESS!** Test suite created and populated

### 📊 Test Report Export (1 minute)

**Option 1: Using Browser (Easiest)**
Open browser console (F12) and run:
```javascript
// Get your token from localStorage
const token = localStorage.getItem('token');

// Download Bug Report PDF
fetch('http://localhost:5000/api/reports/export/bugs/pdf', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bugs-report.pdf';
  a.click();
});
```

**Option 2: Using PowerShell**
```powershell
# Replace YOUR_TOKEN with actual token from browser localStorage
Invoke-WebRequest -Uri "http://localhost:5000/api/reports/export/bugs/pdf" `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN"} `
  -OutFile "bugs-report.pdf"

# Open the PDF
.\bugs-report.pdf
```

✅ **SUCCESS!** PDF downloaded and opens with bug data

---

## 🎉 All Done! 

You've verified:
- ✅ Notifications working (bell icon shows in navbar)
- ✅ Test Suites working (can create and manage suites)
- ✅ Report Export working (PDF downloads)
- ✅ Backend runs on port 5000
- ✅ Frontend runs on port 3000
- ✅ Database migrations applied

---

## 📸 What You Should See

### Navbar with Notification Bell:
```
🎯 TestTrack Pro    [Projects] [Test Cases] [Test Suites]    🔔(2)  user@email.com  [Logout]
                                                               ↑
                                                         New bell icon!
```

### Test Suites Page:
```
┌─────────────────────────────────┐
│ Test Suites          [+ Create] │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Smoke Test Suite       ✏️📋🗑️│ │
│ │ Critical tests...           │ │
│ │ Test Cases: 5               │ │
│ │ [Manage Test Cases]         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Notification Dropdown:
```
┌──────────────────────────────┐
│ Notifications  [Mark all read]│
├──────────────────────────────┤
│ 📢 Welcome to TestTrack Pro!  │
│    New features added...      │
│    Just now                   │
├──────────────────────────────┤
│ [View All Notifications]      │
└──────────────────────────────┘
```

---

## ⚠️ Troubleshooting (if needed)

### "Cannot connect to database"
→ Make sure MySQL is running
→ Check `backend/.env` credentials

### "Port 5000 already in use"  
→ Kill existing process:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### "Module not found: pdfkit"
→ Run: `cd backend; npm install pdfkit exceljs`

### MySQL connection timeout
→ Restart MySQL service:
```powershell
Restart-Service MySQL80
```

---

## 📚 Full Documentation

For detailed feature testing, see: **TESTING_GUIDE.md**

