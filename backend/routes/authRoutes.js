const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

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

      try {
        let match = false;

        // Check if password hashed
        if (/^\$2[aby]\$/.test(user.password)) {
          match = await bcrypt.compare(password, user.password);
        } else {
          match = password === user.password;
        }

        if (!match) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

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

  try {
    const hashed = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashed, "tester"],
      (err) => {
        if (err) {
          console.log("Registration error:", err);
          return res.status(500).json({ message: "Registration failed" });
        }

        res.json({
          success: true,
          message: "Tester registered successfully",
        });
      }
    );
  } catch (e) {
    res.status(500).json({ message: "Registration error" });
  }
});

module.exports = router;
