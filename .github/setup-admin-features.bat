@echo off
echo ========================================
echo TestTrack Pro - Admin Features Setup
echo ========================================
echo.
echo This script will help you set up the new admin features.
echo.
echo STEP 1: Database Migration
echo ========================================
echo Please run the following SQL file in your MySQL client:
echo   backend/migrations/006_admin_features.sql
echo.
echo Option A: MySQL Workbench
echo   1. Open MySQL Workbench
echo   2. Open the file: backend/migrations/006_admin_features.sql
echo   3. Click Execute (or press Ctrl+Shift+Enter)
echo.
echo Option B: MySQL CLI
echo   mysql -u root -p testtrack ^< backend/migrations/006_admin_features.sql
echo.
pause
echo.
echo STEP 2: Verify Database Changes
echo ========================================
echo The following tables should now exist:
echo   - audit_logs
echo   - system_settings
echo   - role_permissions
echo   - backups
echo.
echo The users table should have a new column:
echo   - is_active
echo.
pause
echo.
echo STEP 3: Testing
echo ========================================
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   node server.js
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm start
echo.
echo Once both are running:
echo   1. Login as admin user
echo   2. Navigate to Admin Dashboard
echo   3. Test all 6 management sections
echo.
echo ========================================
echo Setup complete! Happy testing!
echo ========================================
pause
