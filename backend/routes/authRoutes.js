const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailService");
const logger = require("../utils/logger");

// Ensure JWT secrets are configured
if (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET) {
  logger.error("CRITICAL: JWT_SECRET and REFRESH_SECRET must be set in environment variables");
  throw new Error("Missing required JWT secrets in environment configuration");
}

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "tester",
    },
    JWT_SECRET,
    { expiresIn: "24h" } // 24 hours access token (long enough for normal usage)
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    REFRESH_SECRET,
    { expiresIn: "7d" } // Long-lived refresh token
  );

  return { accessToken, refreshToken };
};

/* ===========================
   LOGIN ROUTE
=========================== */

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, results) => {
      if (err) {
        console.log("DB Error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = results[0];

      // Check if email is verified 
      // Skip verification for:
      // 1. Admin/Developer accounts
      // 2. Existing users (email_verified is NULL - column didn't exist before)
      // 3. Already verified users
      const needsVerification = user.email_verified === false && 
                               user.email_verification_token !== null &&
                               user.role !== 'admin' && 
                               user.role !== 'developer';
      
      if (needsVerification) {
        return res.status(403).json({ 
          message: "Please verify your email before logging in",
          requiresVerification: true 
        });
      }

      try {
        // Always use bcrypt comparison - no plaintext passwords allowed
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate access and refresh tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token in database
        db.query(
          "UPDATE users SET refresh_token=? WHERE id=?",
          [refreshToken, user.id],
          (updateErr) => {
            if (updateErr) {
              console.log("Refresh token update error:", updateErr);
            }
          }
        );

        res.json({
          success: true,
          token: accessToken,
          refreshToken,
          role: user.role,
          email: user.email,
        });
      } catch (e) {
        console.log("Login error:", e);
        res.status(500).json({ message: "Authentication failed" });
      }
    }
  );
});

/* ===========================
   REGISTER ROUTE
   ONLY TESTER CAN REGISTER
=========================== */

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email & password required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  try {
    // Check if user already exists
    db.query("SELECT * FROM users WHERE email=?", [email], async (err, results) => {
      if (err) {
        console.log("DB Error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      db.query(
        "INSERT INTO users (email, password, role, email_verified, email_verification_token) VALUES (?, ?, ?, ?, ?)",
        [email, hashed, "tester", false, verificationToken],
        async (insertErr, insertResult) => {
          if (insertErr) {
            console.log("Registration error:", insertErr);

            // Backward compatibility: older DB may not have email verification columns yet.
            if (insertErr.code === "ER_BAD_FIELD_ERROR") {
              db.query(
                "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
                [email, hashed, "tester"],
                (legacyInsertErr) => {
                  if (legacyInsertErr) {
                    console.log("Legacy registration error:", legacyInsertErr);
                    return res.status(500).json({
                      message: "Registration failed",
                      code: legacyInsertErr.code || "LEGACY_INSERT_ERROR"
                    });
                  }

                  return res.json({
                    success: true,
                    message: "Registration successful! Your account is active.",
                  });
                }
              );
              return;
            }

            return res.status(500).json({
              message: "Registration failed",
              code: insertErr.code || "REGISTER_INSERT_ERROR"
            });
          }

          // Send verification email
          try {
            await sendVerificationEmail(email, verificationToken);
            res.json({
              success: true,
              message: "Registration successful! Please check your email to verify your account.",
            });
          } catch (emailErr) {
            console.log("Email sending error:", emailErr);
            // In production, don't block registration if email provider is temporarily unavailable.
            // Auto-verify this user so they can log in immediately.
            if (process.env.NODE_ENV === "production") {
              db.query(
                "UPDATE users SET email_verified=TRUE, email_verification_token=NULL WHERE id=?",
                [insertResult.insertId],
                (autoVerifyErr) => {
                  if (autoVerifyErr) {
                    console.log("Auto-verify fallback error:", autoVerifyErr);

                    // If verification columns are not present, account still exists and is usable.
                    if (autoVerifyErr.code === "ER_BAD_FIELD_ERROR") {
                      return res.json({
                        success: true,
                        message: "Registration successful! Your account is active.",
                      });
                    }

                    return res.status(500).json({
                      success: false,
                      message: "Registration created but activation failed. Please contact support.",
                    });
                  }

                  return res.json({
                    success: true,
                    message: "Registration successful. Email service is unavailable, so your account has been activated automatically.",
                  });
                }
              );
              return;
            }

            // In development, keep previous behavior so email setup issues stay visible.
            db.query("DELETE FROM users WHERE id=?", [insertResult.insertId], (rollbackErr) => {
              if (rollbackErr) {
                console.log("Rollback error after email failure:", rollbackErr);
              }
            });

            return res.status(500).json({
              success: false,
              message: "Unable to send verification email. Please try again.",
            });
          }
        }
      );
    });
  } catch (e) {
    console.log("Registration error:", e);
    res.status(500).json({ message: "Registration error" });
  }
});

/* ===========================
   EMAIL VERIFICATION
=========================== */

router.get("/verify-email/:token", (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: "Verification token required" });
  }

  db.query(
    "SELECT * FROM users WHERE email_verification_token=?",
    [token],
    (err, results) => {
      if (err) {
        console.log("DB Error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      const user = results[0];

      if (user.email_verified) {
        return res.json({ message: "Email already verified", alreadyVerified: true });
      }

      db.query(
        "UPDATE users SET email_verified=TRUE, email_verification_token=NULL WHERE id=?",
        [user.id],
        (updateErr) => {
          if (updateErr) {
            console.log("Update error:", updateErr);
            return res.status(500).json({ message: "Verification failed" });
          }

          res.json({
            success: true,
            message: "Email verified successfully! You can now log in.",
          });
        }
      );
    }
  );
});

/* ===========================
   RESEND VERIFICATION EMAIL
=========================== */

router.post("/resend-verification", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, results) => {
    if (err) {
      console.log("DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    const user = results[0];

    if (user.email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    db.query(
      "UPDATE users SET email_verification_token=? WHERE id=?",
      [verificationToken, user.id],
      async (updateErr) => {
        if (updateErr) {
          console.log("Update error:", updateErr);
          return res.status(500).json({ message: "Failed to generate new token" });
        }

        try {
          await sendVerificationEmail(email, verificationToken);
          res.json({
            success: true,
            message: "Verification email sent! Please check your inbox.",
          });
        } catch (emailErr) {
          console.log("Email sending error:", emailErr);
          res.status(500).json({ message: "Failed to send verification email" });
        }
      }
    );
  });
});

/* ===========================
   PASSWORD RESET REQUEST
=========================== */

router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, results) => {
    if (err) {
      console.log("DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // Don't reveal if email exists or not (security best practice)
    if (results.length === 0) {
      return res.json({
        success: true,
        message: "If that email is registered, a password reset link has been sent.",
      });
    }

    const user = results[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    db.query(
      "UPDATE users SET password_reset_token=?, password_reset_expires=? WHERE id=?",
      [resetToken, resetExpires, user.id],
      async (updateErr) => {
        if (updateErr) {
          console.log("Update error:", updateErr);
          return res.status(500).json({ message: "Failed to generate reset token" });
        }

        try {
          await sendPasswordResetEmail(email, resetToken);
          res.json({
            success: true,
            message: "If that email is registered, a password reset link has been sent.",
          });
        } catch (emailErr) {
          console.log("Email sending error:", emailErr);
          res.status(500).json({ message: "Failed to send reset email" });
        }
      }
    );
  });
});

/* ===========================
   PASSWORD RESET CONFIRMATION
=========================== */

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  db.query(
    "SELECT * FROM users WHERE password_reset_token=? AND password_reset_expires > NOW()",
    [token],
    async (err, results) => {
      if (err) {
        console.log("DB Error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const user = results[0];

      try {
        const hashed = await bcrypt.hash(newPassword, 10);

        db.query(
          "UPDATE users SET password=?, password_reset_token=NULL, password_reset_expires=NULL WHERE id=?",
          [hashed, user.id],
          (updateErr) => {
            if (updateErr) {
              console.log("Password update error:", updateErr);
              return res.status(500).json({ message: "Password reset failed" });
            }

            res.json({
              success: true,
              message: "Password reset successful! You can now log in with your new password.",
            });
          }
        );
      } catch (hashErr) {
        console.log("Hashing error:", hashErr);
        res.status(500).json({ message: "Password reset failed" });
      }
    }
  );
});

/* ===========================
   REFRESH TOKEN
=========================== */

router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    // Check if refresh token exists in database
    db.query(
      "SELECT * FROM users WHERE id=? AND refresh_token=?",
      [decoded.id, refreshToken],
      (err, results) => {
        if (err) {
          console.log("DB Error:", err);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }

        const user = results[0];

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        // Update refresh token in database
        db.query(
          "UPDATE users SET refresh_token=? WHERE id=?",
          [newRefreshToken, user.id],
          (updateErr) => {
            if (updateErr) {
              console.log("Token update error:", updateErr);
              return res.status(500).json({ message: "Failed to refresh token" });
            }

            res.json({
              success: true,
              token: accessToken,
              refreshToken: newRefreshToken,
            });
          }
        );
      }
    );
  } catch (jwtErr) {
    console.log("JWT Error:", jwtErr);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

/* ===========================
   LOGOUT (INVALIDATE REFRESH TOKEN)
=========================== */

router.post("/logout", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.json({ success: true, message: "Logged out" });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    db.query(
      "UPDATE users SET refresh_token=NULL WHERE id=?",
      [decoded.id],
      (err) => {
        if (err) {
          console.log("Logout error:", err);
        }
        res.json({ success: true, message: "Logged out successfully" });
      }
    );
  } catch (jwtErr) {
    // Token invalid, but still logout
    res.json({ success: true, message: "Logged out" });
  }
});

module.exports = router;
