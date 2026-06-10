# 🔧 How to Fix Admin Login on Vercel

## Step 1: Get Your Vercel Database Credentials

### Option A: Using Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Find your **testtrack** project
3. Click on the **MySQL** service
4. Look for these variables in the **Variables** tab:
   - `MYSQL_HOST` → Copy this
   - `MYSQL_USER` → Copy this  
   - `MYSQL_PASSWORD` → Copy this
   - `MYSQL_DATABASE` → Copy this (should be "testtrack")

### Option B: Using Vercel PostgreSQL
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **testtrack-pro** project
3. Go to **Settings → Environment Variables**
4. Look for `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
5. Copy these values

---

## Step 2: Update the Script

Open `backend/reset-vercel-admin-password.js` and replace:

```javascript
const connection = mysql.createConnection({
  host: 'your-vercel-db-host.railway.app',  // ← PASTE YOUR HOST HERE
  user: 'root',                              // ← PASTE YOUR USER HERE
  password: 'your-password',                 // ← PASTE YOUR PASSWORD HERE
  database: 'testtrack',                     // ← PASTE YOUR DATABASE NAME
  port: 3306                                 // ← Keep as 3306 usually
});
```

**Example (do not use these, use YOUR values):**
```javascript
const connection = mysql.createConnection({
  host: 'mysql.railway.internal',
  user: 'root',
  password: 'abcd1234efgh5678',
  database: 'testtrack',
  port: 3306
});
```

---

## Step 3: Run the Script

Open terminal in `backend/` folder and run:

```bash
node reset-vercel-admin-password.js
```

**If it says "Admin not found":**
- Run: `node add-admin-to-vercel.js` instead

---

## Step 4: Try Logging In

Go to your Vercel URL and login with:
- **Email:** admin@test.com
- **Password:** Admin@12345 (or whatever you set in the script)

✅ You should now access the admin page!

---

## Troubleshooting

### "Cannot connect to database"
- Check if credentials are correct
- Make sure your Railway/Vercel variables are copied exactly
- Check if port is correct (usually 3306 for MySQL)

### "Admin user not found"
- Your Vercel database is empty
- Run: `node add-admin-to-vercel.js`

### "Still getting invalid credentials on Vercel"
1. Make sure you ran the script on YOUR Vercel database (not local)
2. Check that email is exactly: `admin@test.com`
3. Try clearing browser cache (Ctrl+Shift+Delete)
4. Try incognito/private window

---

## 🎯 Quick Command Reference

```bash
# Check what admin users exist on Vercel
# (edit the script first with your DB credentials)
node reset-vercel-admin-password.js

# Create new admin if none exists
node add-admin-to-vercel.js

# Check local database (no editing needed)
node check-admin-user.js
```
