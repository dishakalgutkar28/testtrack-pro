# Rate Limiting Implementation Guide

## Installation

First, install the express-rate-limit package:

```bash
cd backend
npm install express-rate-limit
```

## Implementation

The rate limiting middleware has been created in `backend/middleware/rateLimiter.js` with the following limiters:

### 1. General API Limiter
- **Limit:** 100 requests per 15 minutes per IP
- **Use:** Applied to all API routes

### 2. Auth Limiter (Strictest)
- **Limit:** 5 attempts per 15 minutes per IP
- **Use:** Login endpoint
- **Purpose:** Prevent brute force attacks

### 3. Registration Limiter
- **Limit:** 3 registrations per hour per IP
- **Use:** User registration endpoint
- **Purpose:** Prevent mass account creation

### 4. Password Reset Limiter
- **Limit:** 3 attempts per hour per IP
- **Use:** Forgot password / reset password endpoints

### 5. Create Limiter
- **Limit:** 30 creates per 15 minutes per user
- **Use:** Test case and bug creation endpoints

### 6. Upload Limiter
- **Limit:** 10 uploads per 15 minutes per user
- **Use:** File upload endpoints

## How to Apply Rate Limiting

### Step 1: Update server.js

Add rate limiters after other middleware:

```javascript
// At the top with other imports
const {
  generalLimiter,
  authLimiter,
  registerLimiter,
  passwordResetLimiter
} = require('./middleware/rateLimiter');

// After other middleware, before routes
app.use('/api', generalLimiter); // Apply general limit to all API routes
```

### Step 2: Update authRoutes.js

Apply specific limiters to auth routes:

```javascript
const { authLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Apply to login route
router.post("/login", authLimiter, (req, res) => {
  // ... existing code
});

// Apply to registration
router.post("/register", registerLimiter, async (req, res) => {
  // ... existing code
});

// Apply to password reset
router.post("/forgot-password", passwordResetLimiter, (req, res) => {
  // ... existing code
});

router.post("/reset-password", passwordResetLimiter, async (req, res) => {
  // ... existing code
});
```

### Step 3: Update testcaseRoutes.js and bugRoutes.js

Apply create limiter:

```javascript
const { createLimiter } = require('../middleware/rateLimiter');

// Apply to create endpoints
router.post("/testcase", authMiddleware, createLimiter, (req, res) => {
  // ... existing code
});

router.post("/bugs", authMiddleware, createLimiter, (req, res) => {
  // ... existing code
});
```

### Step 4: Update file upload routes

If you have file upload endpoints:

```javascript
const { uploadLimiter } = require('../middleware/rateLimiter');

router.post("/upload", authMiddleware, uploadLimiter, (req, res) => {
  // ... existing code
});
```

## Production Considerations

### Using Redis for Distributed Rate Limiting

For production with multiple server instances, use Redis as a store:

```bash
npm install rate-limit-redis redis
```

Update rateLimiter.js:

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  // ... rest of config
});
```

### Environment Variables

Add to `.env`:

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## Testing Rate Limiting

### Manual Testing

```bash
# Test auth rate limit (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "\nAttempt $i"
  sleep 1
done
```

### Automated Testing

```javascript
describe('Rate Limiting', () => {
  it('should block after 5 failed login attempts', async () => {
    for (let i = 0; i < 6; i++) {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'test@test.com', password: 'wrong' });
      
      if (i < 5) {
        expect(res.status).toBe(401); // Unauthorized
      } else {
        expect(res.status).toBe(429); // Too Many Requests
      }
    }
  });
});
```

## Monitoring

Rate limit headers are automatically added to responses:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640000000
```

Check logs for rate limit violations:

```bash
# View rate limit warnings
tail -f logs/app.log | grep "Rate limit"
```

## Troubleshooting

### Issue: Rate limit triggering too often

**Solution:** Increase the `max` value or `windowMs` in the limiter configuration.

### Issue: Legitimate users getting blocked

**Solution:** 
- Whitelist specific IPs
- Use user-based keys instead of IP-based
- Implement captcha after rate limit

### Issue: Rate limit not working across multiple servers

**Solution:** Implement Redis store (see Production Considerations above).

## Next Steps

1. Install express-rate-limit package
2. Apply rate limiters to routes as shown above
3. Test rate limiting in development
4. Configure Redis for production
5. Monitor and adjust limits based on usage patterns

## Benefits

✅ Protects against brute force attacks
✅ Prevents API abuse
✅ Reduces server load
✅ Improves security posture
✅ Complies with security best practices
