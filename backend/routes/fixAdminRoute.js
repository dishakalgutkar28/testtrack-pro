/**
 * TEMPORARY FIX ENDPOINT
 * Deploy, call once, then remove.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'Admin@12345';

router.get('/fix-admin', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    db.query(
      "SELECT id FROM users WHERE email = ?",
      [ADMIN_EMAIL],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        if (results.length === 0) {
          db.query(
            "INSERT INTO users (name, email, password, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?)",
            ['Admin', ADMIN_EMAIL, hashedPassword, 'admin', 1, 1],
            (insertErr) => {
              if (insertErr) {
                return res.status(500).json({ error: 'Failed to create admin: ' + insertErr.message });
              }

              res.json({
                success: true,
                message: 'Admin account created successfully',
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                status: 'active and verified'
              });
            }
          );
        } else {
          db.query(
            "UPDATE users SET password = ?, role = 'admin', is_active = 1, email_verified = 1 WHERE email = ?",
            [hashedPassword, ADMIN_EMAIL],
            (updateErr) => {
              if (updateErr) {
                return res.status(500).json({ error: 'Failed to fix admin: ' + updateErr.message });
              }

              res.json({
                success: true,
                message: 'Admin account reset successfully',
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                status: 'active, verified, and password reset'
              });
            }
          );
        }
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
});

module.exports = router;
