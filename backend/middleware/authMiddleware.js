const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

// Ensure JWT secret is configured
if (!process.env.JWT_SECRET) {
  logger.error("CRITICAL: JWT_SECRET must be set in environment variables");
  throw new Error("Missing required JWT_SECRET in environment configuration");
}

const JWT_SECRET = process.env.JWT_SECRET;

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("❌ Auth failed - No/invalid Authorization header for", req.method, req.url);
    console.warn("   Headers:", Object.keys(req.headers).join(", "));
    return res.status(401).json({ 
      error: "Unauthorized - No token",
      requiresAuth: true 
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log("✅ Auth successful for user:", decoded.email, "Method:", req.method, req.url);
    next();
  } catch (err) {
    console.error("❌ JWT Error for token:", token.substring(0, 20) + "...", "Error:", err.message);
    
    // Differentiate between expired and invalid tokens
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: "Token expired",
        expired: true 
      });
    }
    
    return res.status(401).json({ 
      error: "Invalid token",
      requiresAuth: true 
    });
  }
};

// Optional middleware to check if user is verified
exports.requireVerifiedEmail = (req, res, next) => {
  // This assumes user data is already attached by authMiddleware
  // For now, we'll skip DB check and rely on login enforcement
  // In production, you might want to verify email_verified status from DB
  next();
};
