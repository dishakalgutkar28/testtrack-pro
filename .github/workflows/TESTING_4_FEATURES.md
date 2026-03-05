# Testing Guide - 4 Missing Features

## Prerequisites
- Backend: `npm install` in `/backend` directory (installs multer)
- Frontend: Already has axios configured for API
- Database: Run migrations automatically on server startup

---

## Feature 1: Testcase Ownership & Edit Restrictions

### Test Case 1.1: Tester Can Edit Own Testcase
1. Login as **Tester A**
2. Create a new testcase
3. Edit the testcase → Should succeed ✅
4. Expected: "Testcase updated successfully"

### Test Case 1.2: Tester Cannot Edit Another Tester's Testcase
1. Login as **Tester A**
2. Create and note a testcase ID
3. Logout, Login as **Tester B**
4. Try to edit Tester A's testcase → Should fail with 403 ❌
5. Expected: "You do not have permission to edit this testcase"

### Test Case 1.3: Admin Can Edit Any Testcase
1. Login as **Admin**
2. Find a testcase created by Tester A
3. Edit it → Should succeed ✅
4. Expected: "Testcase updated successfully"

### Test Case 1.4: Assigned Tester Can Edit Testcase
1. Login as **Admin**
2. Create a testcase
3. Assign it to **Tester B** (set assigned_to field)
4. Logout, Login as **Tester B**
5. Edit the testcase → Should succeed ✅
6. Expected: "Testcase updated successfully"

---

## Feature 2: Soft Delete with Audit Trail

### Test Case 2.1: Delete Testcase (Soft Delete)
1. Login as **Tester A**
2. Create and note a testcase ID (e.g., TC-1)
3. Click **Delete** button on testcase
4. Confirm deletion
5. Check: Testcase should NOT appear in GET /testcase list ❌
6. Check: Testcase record still exists in DB with `is_deleted=TRUE, deleted_at=NOW()` ✅
7. Check: Database audit_logs table has entry: `action="SOFT_DELETE_TESTCASE"` ✅

### Test Case 2.2: Audit Trail Entry
1. Open MySQL/DB console
2. Query: `SELECT * FROM audit_logs WHERE action='SOFT_DELETE_TESTCASE' ORDER BY created_at DESC LIMIT 1;`
3. Expected columns:
   - `user_id` = ID of tester who deleted
   - `action` = "SOFT_DELETE_TESTCASE"
   - `details` = JSON with testcaseId and title
   - `target_type` = "testcase"
   - `target_id` = testcase ID
   - `created_at` = deletion timestamp

### Test Case 2.3: Deleted Testcase Not Shown in List
1. Login as **Tester A**
2. Go to Testcase list page
3. Testcase should NOT appear in list
4. Check network: GET /testcase response should filter `is_deleted = FALSE`

### Test Case 2.4: History Shows Deletion
1. Login as **Admin**
2. Open testcase detail page (if available)
3. Check test case detail for soft-delete indicator
4. Expected: Deleted status shown to admin

---

## Feature 3: Tester Bug Assignment

### Test Case 3.1: Tester Can Create Bug
1. Login as **Tester A**
2. Create a new bug with:
   - Title: "Test Bug"
   - Description: "Testing bug assignment"
3. Click **Create Bug**
4. Expected: Bug created successfully ✅
5. Verify: `reported_by` and `created_by` = Tester A's ID

### Test Case 3.2: Tester Can Assign Bug to Developer
1. Login as **Tester A**
2. Open the bug just created
3. Click **Assign To** dropdown
4. Select a **Developer** from list
5. Click **Assign**
6. Expected: "Bug assigned to Developer XXX" ✅
7. Verify DB: `assigned_to` field updated with developer ID

### Test Case 3.3: Developer Receives Notification on Assignment
1. Stay as **Tester A**
2. Assign bug to **Developer B**
3. Login as **Developer B** (preferably in another browser tab)
4. Expected: Notification appears → "Bug assigned to you: Test Bug" ✅

### Test Case 3.4: Developer Cannot Assign Bugs
1. Login as **Developer A**
2. Try to open bug and change assignment
3. Expected: Assignment dropdown disabled or hidden ❌
4. Expected: Update fails with permission error

### Test Case 3.5: Tester Cannot Modify Other Fields
1. Login as **Tester A**
2. Try to change bug status/priority/severity
3. Expected: Fields read-only or update fails ❌
4. Expected: Error: "Testers can only assign bugs"

### Test Case 3.6: Only Reporter/Creator Can Assign
1. Create bug as **Tester A**
2. Logout, Login as **Tester B**
3. Try to assign the bug to a developer
4. Expected: Permission denied ❌
5. Expected: Error: "Only bug reporter can assign"

---

## Feature 4: File Attachments

### Test Case 4.1: Upload Attachment to Testcase
1. Login as **Tester A**
2. Go to Testcase detail page
3. Scroll to **Attachments** section
4. Drag-and-drop OR click to select file (e.g., "test-doc.pdf")
5. Expected: Upload progress shown
6. Expected: File appears in attachments list ✅
7. Verify DB: Row added to `testcase_attachments` table

### Test Case 4.2: Upload Attachment to Bug
1. Login as **Tester A**
2. Go to Bug detail page
3. Scroll to **Attachments** section
4. Upload file (e.g., "bug-screenshot.png")
5. Expected: File appears in attachments list ✅
6. Verify DB: Row added to `bug_attachments` table

### Test Case 4.3: Download Attachment
1. Go to Bug/Testcase detail page with attachment
2. Click **Download** button on attachment
3. Expected: File downloads to browser default directory ✅
4. Expected: MIME type correct (PDF shows as PDF, PNG as image, etc.)

### Test Case 4.4: Delete Own Attachment
1. Go to Bug/Testcase detail page
2. Find attachment uploaded by current user
3. Click **Delete** button
4. Confirm deletion
5. Expected: File removed from list ✅
6. Verify DB: Record deleted from attachment table

### Test Case 4.5: Admin Can Delete Any Attachment
1. Login as **Tester A**, upload attachment
2. Logout, Login as **Admin**
3. Go to same Bug/Testcase
4. Click **Delete** on Tester A's attachment
5. Expected: Deletion succeeds ✅
6. Tester A goes back: Attachment gone

### Test Case 4.6: Tester Cannot Delete Others' Attachments
1. As **Tester A**, upload attachment to bug
2. Logout, Login as **Tester B**
3. Go to same bug
4. Try to delete Tester A's attachment
5. Expected: Delete button disabled or deletion fails ❌
6. Expected: Error: "You can only delete your own attachments"

### Test Case 4.7: File Type Validation
1. Try to upload executable file (.exe, .bat)
2. Expected: Upload fails ❌
3. Expected: Error: "File type not allowed"

### Test Case 4.8: File Size Validation
1. Try to upload file > 10 MB
2. Expected: Upload fails ❌
3. Expected: Error: "File size exceeds 10MB limit"

### Test Case 4.9: Rate Limiting
1. Upload 11 attachments in quick succession
2. Expected: 11th upload fails ❌
3. Expected: Error: "Rate limit exceeded. Max 10 uploads per 15 minutes"

### Test Case 4.10: File Organization on Server
1. SSH into server/check backend uploads directory
2. Expected structure:
   ```
   /backend/uploads/
   ├── testcase_123_attachment1.pdf
   ├── bug_456_attachment2.png
   └── ...
   ```

---

## Database Verification

### Check Testcase Soft-Delete
```sql
SELECT id, title, is_deleted, deleted_at, deleted_by FROM testcases WHERE is_deleted = TRUE LIMIT 5;
```
Expected: Soft-deleted testcases shown with timestamps

### Check Testcase Audit Log
```sql
SELECT user_id, action, details, created_at FROM audit_logs 
WHERE action = 'SOFT_DELETE_TESTCASE' 
ORDER BY created_at DESC LIMIT 5;
```
Expected: Deletion events with user/timestamp

### Check Bug Assignment History
```sql
SELECT id, title, created_by, reported_by, assigned_to FROM bugs 
WHERE reported_by IS NOT NULL 
LIMIT 5;
```
Expected: All bugs have `reported_by` set

### Check Attachments Tables
```sql
SELECT * FROM testcase_attachments LIMIT 5;
SELECT * FROM bug_attachments LIMIT 5;
```
Expected: File records with file_name, file_path, uploaded_by, uploaded_at

---

## API Endpoint Testing (cURL)

### Upload Attachment
```bash
curl -X POST http://localhost:5000/api/attachments/testcase/123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf"
```
Expected: 200 OK with attachment details

### List Attachments
```bash
curl -X GET http://localhost:5000/api/attachments/testcase/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 200 OK with array of attachments

### Delete Attachment
```bash
curl -X DELETE http://localhost:5000/api/attachments/testcase/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 200 OK or 403 Forbidden (if not owner)

---

## Checklist Summary

- [ ] Testcase ownership enforcement works
- [ ] Other tester cannot edit testcase
- [ ] Admin can edit any testcase
- [ ] Assigned tester can edit testcase
- [ ] Testcase soft-delete hides from list
- [ ] Soft-delete creates audit log entry
- [ ] Deleted record exists in database
- [ ] Tester can create bugs
- [ ] Tester can assign bug to developer
- [ ] Developer receives notification
- [ ] Developer cannot assign bugs
- [ ] Tester cannot modify other bug fields
- [ ] Only reporter can assign bug
- [ ] Upload attachment to testcase
- [ ] Upload attachment to bug
- [ ] Download attachment
- [ ] Delete own attachment
- [ ] Admin can delete any attachment
- [ ] Cannot delete others' attachments
- [ ] File type validation works
- [ ] File size validation works
- [ ] Rate limiting enforced
- [ ] Files stored in correct directory
- [ ] Database tables have correct data

---

## Troubleshooting

### Issue: Upload button not appearing
- Check: Is Attachments.js imported in Bug.js and Testcase.js?
- Check: Are entityType and entityId props correct?
- Check: Frontend running on correct port?

### Issue: 404 on /api/attachments
- Check: attachmentRoutes.js mounted in server.js?
- Check: app.use("/api", attachmentRoutes) called?

### Issue: File not saving
- Check: /backend/uploads directory exists?
- Check: Node.js process has write permissions?
- Check: Multer error in server console

### Issue: Soft-delete not working
- Check: is_deleted column exists in testcases table?
- Check: Query filtering by is_deleted = FALSE?

### Issue: Audit log empty
- Check: audit_logs table exists?
- Check: logAuditEvent function called on delete?

---

**All 4 features are now ready for testing!**
