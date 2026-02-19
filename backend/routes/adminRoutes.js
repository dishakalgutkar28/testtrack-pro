const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");


// ================= GET ALL USERS =================
router.get("/users", authMiddleware, requireRole("admin"), (req, res) => {
  db.query("SELECT id, email, role FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch users" });
    res.json(results);
  });
});


// ================= CREATE USER =================
router.post("/users", authMiddleware, requireRole("admin"), async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role)
    return res.status(400).json({ error: "All fields required" });

  // Validate password strength
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashedPassword, role],
      err => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Email already exists" });
          }
          return res.status(500).json({ error: "Failed to create user" });
        }
        res.json({ message: "User created successfully" });
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to hash password" });
  }
});


// ================= UPDATE USER ROLE =================
router.put("/users/:id", authMiddleware, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !["tester", "developer", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  db.query(
    "UPDATE users SET role = ? WHERE id = ?",
    [role, id],
    err => {
      if (err) return res.status(500).json({ error: "Failed to update user" });
      res.json({ message: "User role updated successfully" });
    }
  );
});


// ================= DELETE USER =================
router.delete("/users/:id", authMiddleware, requireRole("admin"), (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  db.query("DELETE FROM users WHERE id = ?", [id], err => {
    if (err) return res.status(500).json({ error: "Failed to delete user" });
    res.json({ message: "User deleted successfully" });
  });
});


module.exports = router;
