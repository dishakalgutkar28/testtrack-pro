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

const getUserColumns = callback => {
  db.query('SHOW COLUMNS FROM users', (err, columns) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null, new Set(columns.map(column => column.Field)));
  });
};

const buildInsertStatement = availableColumns => {
  const columnNames = [];
  const values = [];
  const placeholders = [];

  if (availableColumns.has('username')) {
    columnNames.push('username');
    values.push('admin');
    placeholders.push('?');
  }

  if (availableColumns.has('name')) {
    columnNames.push('name');
    values.push(adminUser.name);
    placeholders.push('?');
  }

  columnNames.push('email', 'password');
  values.push(adminUser.email, adminUser.password);
  placeholders.push('?', '?');

  if (availableColumns.has('role')) {
    columnNames.push('role');
    values.push(adminUser.role);
    placeholders.push('?');
  }

  if (availableColumns.has('is_active')) {
    columnNames.push('is_active');
    values.push(adminUser.is_active);
    placeholders.push('?');
  }

  if (availableColumns.has('email_verified')) {
    columnNames.push('email_verified');
    values.push(adminUser.email_verified);
    placeholders.push('?');
  }

  return {
    sql: `INSERT INTO users (${columnNames.join(', ')}) VALUES (${placeholders.join(', ')})`,
    values
  };
};

const buildUpdateStatement = availableColumns => {
  const updates = ['password = ?'];
  const values = [adminUser.password];

  if (availableColumns.has('name')) {
    updates.push('name = ?');
    values.push(adminUser.name);
  }

  if (availableColumns.has('role')) {
    updates.push('role = ?');
    values.push(adminUser.role);
  }

  if (availableColumns.has('is_active')) {
    updates.push('is_active = ?');
    values.push(adminUser.is_active);
  }

  if (availableColumns.has('email_verified')) {
    updates.push('email_verified = ?');
    values.push(adminUser.email_verified);
  }

  values.push(adminUser.email);

  return {
    sql: `UPDATE users SET ${updates.join(', ')} WHERE email = ?`,
    values
  };
};

router.get('/sync-local-admin', (req, res) => {
  getUserColumns((columnsErr, availableColumns) => {
    if (columnsErr) {
      return res.status(500).json({ success: false, error: columnsErr.message });
    }

    db.query(
      'SELECT id FROM users WHERE email = ?',
      [adminUser.email],
      (selectErr, results) => {
        if (selectErr) {
          return res.status(500).json({ success: false, error: selectErr.message });
        }

        if (results.length === 0) {
          const insertStatement = buildInsertStatement(availableColumns);

          db.query(insertStatement.sql, insertStatement.values, (insertErr) => {
            if (insertErr) {
              return res.status(500).json({ success: false, error: insertErr.message });
            }

            return res.json({
              success: true,
              message: 'Production admin created from localhost admin data',
              email: adminUser.email
            });
          });

          return;
        }

        const updateStatement = buildUpdateStatement(availableColumns);

        db.query(updateStatement.sql, updateStatement.values, (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ success: false, error: updateErr.message });
          }

          return res.json({
            success: true,
            message: 'Production admin synced from localhost admin data',
            email: adminUser.email
          });
        });
      }
    );
  });
});

router.get('/unlock-tester-login', (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ success: false, error: 'Query param email is required' });
  }

  getUserColumns((columnsErr, availableColumns) => {
    if (columnsErr) {
      return res.status(500).json({ success: false, error: columnsErr.message });
    }

    if (!availableColumns.has('email_verified') && !availableColumns.has('is_active')) {
      return res.json({
        success: true,
        message: 'No email verification fields exist in this schema',
        email
      });
    }

    const updates = [];
    const values = [];

    if (availableColumns.has('email_verified')) {
      updates.push('email_verified = 1');
    }

    if (availableColumns.has('is_active')) {
      updates.push('is_active = 1');
    }

    values.push(email);

    db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE email = ?`,
      values,
      (updateErr, result) => {
        if (updateErr) {
          return res.status(500).json({ success: false, error: updateErr.message });
        }

        if (!result || result.affectedRows === 0) {
          return res.status(404).json({ success: false, error: 'User not found', email });
        }

        return res.json({
          success: true,
          message: 'Tester account unlocked for login',
          email
        });
      }
    );
  });
});

module.exports = router;