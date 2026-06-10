# 🔧 Quick Fix for Admin Login on Vercel

## Step 1: Add the Fix Route to Your Backend

Open `backend/server.js` and add this line **near the top** where other routes are imported:

```javascript
const fixAdminRoute = require('./routes/fixAdminRoute');
```

Then add this line **after** your other routes are registered (around line 40-50):

```javascript
// FOR TEMPORARY FIX ONLY - DELETE AFTER RUNNING
app.use('/api', fixAdminRoute);
```

**Example:**
```javascript
// ... other imports ...
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fixAdminRoute = require('./routes/fixAdminRoute');  // ← ADD THIS

app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', fixAdminRoute);  // ← ADD THIS
```

---

## Step 2: Deploy to Vercel

```bash
git add .
git commit -m "Temporary: Add admin fix endpoint"
git push
```

Wait for deployment to complete (usually 1-2 minutes).

---

## Step 3: Run the Fix

Visit this URL in your browser:
```
https://your-vercel-url.vercel.app/api/fix-admin
```

You should see a response like:
```json
{
  "success": true,
  "message": "✅ Admin account FIXED successfully!",
  "email": "admin@test.com",
  "status": "now active and verified"
}
```

---

## Step 4: Try Logging In

Go back to your Vercel URL and login with:
- **Email:** `admin@test.com`
- **Password:** `Admin@12345` (or your original password)

✅ You should now have access to the admin panel!

---

## Step 5: Clean Up (IMPORTANT!)

1. Delete the `fixAdminRoute` lines from `server.js`
2. Delete the file `backend/routes/fixAdminRoute.js`
3. Deploy again:

```bash
git add .
git commit -m "Remove temporary admin fix endpoint"
git push
```

---

**⚠️ Security Note:** This endpoint is temporary and allows anyone to fix/create admin accounts. Delete it immediately after using!
