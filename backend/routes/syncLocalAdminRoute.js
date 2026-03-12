const express = require('express');
const router = express.Router();
const db = require('../config/db');

const adminUser = {
  name: null,
  email: 'admin@test.com',
  password: '$2b$10$wKMZOvtyO7hyteMi0UPezO.EQ/en.vdHZEDJ4CAjptoa3tZcr2Ewy',
  role: 'admin',
  is_active: 1,
  email_verified: 1
};

router.get('/sync-local-admin', (req, res) => {
  db.query(
    'SELECT id FROM users WHERE email = ?',
    [adminUser.email],
    (selectErr, results) => {
      if (selectErr) {
        return res.status(500).json({ success: false, error: selectErr.message });
      }

      if (results.length === 0) {
        db.query(
          'INSERT INTO users (name, email, password, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
          [adminUser.name, adminUser.email, adminUser.password, adminUser.role, adminUser.is_active, adminUser.email_verified],
          (insertErr) => {
            if (insertErr) {
              return res.status(500).json({ success: false, error: insertErr.message });
            }

            return res.json({
              success: true,
              message: 'Production admin created from localhost admin data',
              email: adminUser.email
            });
          }
        );

        return;
      }

      db.query(
        'UPDATE users SET name = ?, password = ?, role = ?, is_active = ?, email_verified = ? WHERE email = ?',
        [adminUser.name, adminUser.password, adminUser.role, adminUser.is_active, adminUser.email_verified, adminUser.email],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ success: false, error: updateErr.message });
          }

          return res.json({
            success: true,
            message: 'Production admin synced from localhost admin data',
            email: adminUser.email
          });
        }
      );
    }
  );
});

module.exports = router;