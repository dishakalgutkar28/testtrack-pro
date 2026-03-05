# Authentication Features Implementation

## Overview
This document outlines the new authentication features added to TestTrack Pro:
1. ✅ Password Reset Flow
2. ✅ Email Verification  
3. ✅ Refresh Token System

---

## 🔐 Password Reset Flow

### Backend Implementation

#### New Endpoints:
- **POST /api/forgot-password** - Request a password reset
  - Body: `{ email: string }`
  - Generates a reset token valid for 1 hour
  - Sends email with reset link

- **POST /api/reset-password** - Reset password with token
  - Body: `{ token: string, newPassword: string }`
  - Validates token and expiry
  - Updates password and clears reset token

### Frontend Pages:
- **ForgotPassword.js** - Form to request reset link
- **ResetPassword.js** - Form to set new password
- Routes: `/forgot-password`, `/reset-password?token=xxx`

### Usage Flow:
1. User clicks "Forgot your password?" on login page
2. Enters email and submits
3. Receives email with reset link (logged to console in dev mode)
4. Clicks link → redirected to reset password page
5. Enters new password (min 8 characters)
6. Password updated → redirects to login

---

## 📧 Email Verification

### Backend Implementation

#### Database Schema Updates (in server.js):
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL;
```

#### New Endpoints:
- **GET /api/verify-email/:token** - Verify email with token
  - Sets `email_verified = TRUE`
  - Clears verification token

- **POST /api/resend-verification** - Resend verification email
  - Body: `{ email: string }`
  - Generates new token and sends email

#### Updated Endpoints:
- **POST /api/register** - Now sends verification email
  - Creates user with `email_verified = FALSE`
  - Generates verification token
  - Sends verification email

- **POST /api/login** - Now checks email verification
  - Returns 403 if email not verified
  - Prompts user to verify email

### Frontend Pages:
- **VerifyEmail.js** - Handles email verification from link
- Route: `/verify-email?token=xxx`

### Usage Flow:
1. User registers an account
2. Receives success message: "Please check your email to verify your account"
3. Email sent with verification link (logged to console in dev mode)
4. User clicks verification link
5. Redirected to verification page → email verified
6. Auto-redirects to login in 3 seconds
7. User can now log in

---

## 🔄 Refresh Token System

### Backend Implementation

#### Database Schema Updates:
```sql
ALTER TABLE users ADD COLUMN refresh_token TEXT NULL;
```

#### Token Strategy:
- **Access Token**: Short-lived (15 minutes) - used for API requests
- **Refresh Token**: Long-lived (7 days) - used to get new access tokens

#### New Endpoints:
- **POST /api/refresh-token** - Get new access token
  - Body: `{ refreshToken: string }`
  - Verifies refresh token against database
  - Returns new access + refresh tokens

- **POST /api/logout** - Invalidate refresh token
  - Body: `{ refreshToken: string }`
  - Clears refresh token from database

#### Updated Endpoints:
- **POST /api/login** - Now returns both tokens
  - Response includes `token` and `refreshToken`
  - Refresh token stored in database

### Frontend Implementation

#### Updated Files:
- **api.js** - Automatic token refresh on 401 errors
  - Intercepts 401 responses with `expired: true`
  - Automatically calls `/api/refresh-token`
  - Retries failed request with new token
  - Redirects to login if refresh fails

- **Login.js** - Stores both tokens
  - Saves `token` to localStorage
  - Saves `refreshToken` to localStorage

### authMiddleware Updates:
- Better error differentiation (expired vs invalid)
- Returns `expired: true` for expired tokens (triggers auto-refresh)

### Usage Flow:
1. User logs in → receives access token (15min) + refresh token (7 days)
2. Frontend uses access token for API calls
3. When access token expires:
   - API returns 401 with `expired: true`
   - Frontend automatically calls `/refresh-token`
   - Gets new tokens
   - Original request retried with new token
4. User stays logged in seamlessly for 7 days
5. If refresh token expires → user redirected to login

---

## 📁 New Files Created

### Backend:
- `backend/utils/emailService.js` - Email sending utility

### Frontend:
- `frontend/src/pages/VerifyEmail.js` + `.css`
- `frontend/src/pages/ForgotPassword.js` + `.css`
- `frontend/src/pages/ResetPassword.js` + `.css`

### Modified Files:

#### Backend:
- `backend/server.js` - Database schema migrations
- `backend/routes/authRoutes.js` - All new auth endpoints
- `backend/routes/executionRoutes.js` - Fixed GET /executions route
- `backend/middleware/authMiddleware.js` - Better token error handling

#### Frontend:
- `frontend/src/App.js` - New routes
- `frontend/src/services/api.js` - Auto token refresh
- `frontend/src/pages/Login.js` + `.css` - Refresh token storage, forgot password link
- `frontend/src/pages/Register.js` - Email verification message

---

## 🚀 Testing the Features

### 1. Test Email Verification:
```bash
cd backend
node server.js
```

```bash
cd frontend
npm start
```

1. Go to http://localhost:3000/register
2. Register with an email
3. Check backend console for verification email (includes link)
4. Copy the token from the link
5. Visit: http://localhost:3000/verify-email?token=PASTE_TOKEN_HERE
6. Should see success message
7. Try logging in → should work now

### 2. Test Password Reset:
1. Go to http://localhost:3000/login
2. Click "Forgot your password?"
3. Enter registered email
4. Check backend console for reset email (includes link)
5. Copy token from link
6. Visit: http://localhost:3000/reset-password?token=PASTE_TOKEN_HERE
7. Enter new password (min 8 chars)
8. Should redirect to login
9. Login with new password → should work

### 3. Test Refresh Tokens:
1. Login to the app
2. Open DevTools → Application → Local Storage
3. Note the `token` and `refreshToken`
4. Wait 15+ minutes (or manually delete `token`)
5. Try making an API call (navigate to another page)
6. Token should refresh automatically in background
7. Check Local Storage → new `token` should be present

---

## 🔧 Configuration

### Environment Variables (optional):
Create a `.env` file in the backend directory:

```env
# JWT Secrets
JWT_SECRET=your_super_secret_key_here
REFRESH_SECRET=your_refresh_secret_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=TestTrack Pro <noreply@testtrack.com>

# Environment
NODE_ENV=development
```

### Email Service Setup (Production):
To enable real email sending, uncomment the nodemailer code in `backend/utils/emailService.js` and install:

```bash
cd backend
npm install nodemailer
```

---

## 🛡️ Security Features

1. **Password Requirements**:
   - Minimum 8 characters
   - Validated on both frontend and backend

2. **Token Security**:
   - Cryptographically secure random tokens (32 bytes)
   - Tokens hashed and stored in database
   - Time-limited expiration

3. **Email Verification**:
   - Users cannot log in until email is verified
   - Prevents spam registrations

4. **Refresh Token Rotation**:
   - New refresh token generated on each refresh
   - Old token invalidated
   - Prevents token replay attacks

5. **Secure Logout**:
   - Invalidates refresh token on logout
   - Prevents reuse of stolen tokens

---

## 📝 API Reference

### Authentication Endpoints

#### Register
```http
POST /api/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (201):
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account."
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "role": "tester",
  "email": "user@example.com"
}

Error (403 - Email not verified):
{
  "message": "Please verify your email before logging in",
  "requiresVerification": true
}
```

#### Verify Email
```http
GET /api/verify-email/:token

Response (200):
{
  "success": true,
  "message": "Email verified successfully! You can now log in."
}
```

#### Resend Verification
```http
POST /api/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "Verification email sent! Please check your inbox."
}
```

#### Forgot Password
```http
POST /api/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "If that email is registered, a password reset link has been sent."
}
```

#### Reset Password
```http
POST /api/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "newPassword": "NewSecurePass123!"
}

Response (200):
{
  "success": true,
  "message": "Password reset successful! You can now log in with your new password."
}
```

#### Refresh Token
```http
POST /api/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout
```http
POST /api/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🔍 Troubleshooting

### Email verification link not working?
- Check backend console for the actual verification link
- Token is in the URL query parameter
- Make sure backend server is running

### Refresh token not working?
- Check browser console for errors
- Verify both tokens are in localStorage
- Check backend console for JWT errors

### Password reset expired?
- Reset tokens expire in 1 hour
- Request a new reset link

### Still can't login after verification?
- Check database: `SELECT email_verified FROM users WHERE email='your@email.com'`
- Should be `1` or `TRUE`
- If not, manually update: `UPDATE users SET email_verified=TRUE WHERE email='your@email.com'`

---

## ✅ Summary

All three authentication features have been successfully implemented:

1. ✅ **Password Reset Flow** - Full implementation with email notifications
2. ✅ **Email Verification** - Required for all new registrations
3. ✅ **Refresh Token System** - Automatic token refresh for better UX

The system now has enterprise-grade authentication with:
- Secure token management
- Email verification
- Password recovery
- Automatic session refresh
- Role-based access control

**Note**: In development mode, emails are logged to the backend console. For production, configure a real email service (SMTP/SendGrid/etc.) in `emailService.js`.
