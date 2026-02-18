const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const bcrypt = require("bcrypt");

// Get all users (admin only)
router.get("/admin/users", requireRole('admin'), (req, res) => {
  db.query("SELECT id, email, role, created_at FROM users", (err, results) => {
    if (err) {
      console.log("Database Error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Create a new user (admin only) - Can be any role
router.post("/admin/users", requireRole('admin'), async (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, password, and role required" });
  }

  const validRoles = ['tester', 'developer', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  // Validate password
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return res.status(400).json({ 
      message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" 
    });
  }

  // Check if user exists
  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (err) {
      console.log("Database Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    try {
      const hashed = await bcrypt.hash(password, 10);
      db.query(
        "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
        [email, hashed, role],
        (err, result) => {
          if (err) {
            console.log("Database Error:", err);
            return res.status(500).json({ message: "Failed to create user" });
          }

          res.json({ 
            success: true, 
            message: `User created successfully as ${role}`,
            userId: result.insertId
          });
        }
      );
    } catch (e) {
      console.log("Hashing error:", e);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });
});

// Update user role (admin only)
router.put("/admin/users/:id/role", requireRole('admin'), (req, res) => {
  const { role } = req.body;
  const validRoles = ['tester', 'developer', 'admin'];
  
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  db.query("UPDATE users SET role=? WHERE id=?", [role, req.params.id], (err, result) => {
    if (err) {
      console.log("Database Error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User role updated successfully" });
  });
});

// Delete user (admin only)
router.delete("/admin/users/:id", requireRole('admin'), (req, res) => {
  const userId = req.params.id;
  
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }

  db.query("DELETE FROM users WHERE id=?", [userId], (err, result) => {
    if (err) {
      console.log("Database Error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  });
});

// Reset user password (admin only)
router.post("/admin/users/:id/reset-password", requireRole('admin'), async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ message: "Password required" });
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return res.status(400).json({ 
      message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" 
    });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    db.query("UPDATE users SET password=? WHERE id=?", [hashed, req.params.id], (err, result) => {
      if (err) {
        console.log("Database Error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Password reset successfully" });
    });
  } catch (e) {
    console.log("Hashing error:", e);
    return res.status(500).json({ message: "Password reset failed" });
  }
});

module.exports = router;