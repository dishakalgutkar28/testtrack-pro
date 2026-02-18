const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// IMPORTANT FIX
const { authMiddleware } = require("../middleware/authMiddleware");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";


// ================= PASSWORD VALIDATION =================
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!hasUpperCase) {
    return { valid: false, message: "Password must contain an uppercase letter" };
  }
  if (!hasLowerCase) {
    return { valid: false, message: "Password must contain a lowercase letter" };
  }
  if (!hasNumber) {
    return { valid: false, message: "Password must contain a number" };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: "Password must contain a special character" };
  }

  return { valid: true };
}


// ================= LOGIN =================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, results) => {
    if (err) {
      console.log("DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = results[0];

    try {
      const match = await bcrypt.compare(password, user.password);

      if (!match)
        return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role || "tester",
        },
        JWT_SECRET,
        { expiresIn: "8h" }
      );

      res.json({
        success: true,
        token,
        role: user.role || "tester",
        email: user.email,
      });

    } catch (e) {
      console.log("Auth error:", e);
      res.status(500).json({ message: "Authentication failed" });
    }
  });
});


// ================= REGISTER =================
router.post("/register", (req, res) => {
  const { email, password } = req.body;

  const userRole = "tester"; // Only tester allowed

  const validation = validatePassword(password);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    try {
      const hashed = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
        [email, hashed, userRole],
        (err) => {
          if (err)
            return res.status(500).json({ message: "Registration failed" });

          res.json({
            success: true,
            message: "Registration successful",
            role: userRole,
          });
        }
      );

    } catch {
      res.status(500).json({ message: "Registration failed" });
    }
  });
});


// ================= GET CURRENT USER =================
router.get("/user", authMiddleware, (req, res) => {
  db.query(
    "SELECT id, email, role FROM users WHERE id=?",
    [req.user.id],
    (err, results) => {
      if (err)
        return res.status(500).json({ message: "Database error" });

      if (results.length === 0)
        return res.status(404).json({ message: "User not found" });

      res.json(results[0]);
    }
  );
});


module.exports = router;
