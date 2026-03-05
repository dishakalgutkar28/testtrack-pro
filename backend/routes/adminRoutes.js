const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const BackupService = require("../services/backupService");
const { config } = require("../config/env");
const path = require("path");

// Initialize backup service
const backupService = new BackupService({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name
});

// Helper function to log audit events
const logAuditEvent = (userId, action, details, targetType, targetId) => {
  const sql = `
    INSERT INTO audit_logs (user_id, action, details, target_type, target_id, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  db.query(sql, [userId, action, JSON.stringify(details), targetType, targetId], (err) => {
    if (err) {
      console.error("❌ Audit log error:", err.message);
      console.error("   SQL:", sql);
      console.error("   Params:", [userId, action, JSON.stringify(details), targetType, targetId]);
    } else {
      console.log(`✅ Audit log created: ${action} for ${targetType}:${targetId}`);
    }
  });
};

// ================= GET ALL USERS =================
router.get("/users", authMiddleware, requireRole("admin"), (req, res) => {
  const sql = "SELECT id, email, role, is_active FROM users ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching users:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
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
  const { role, email, password } = req.body;
  const adminId = req.user.id;

  if (parseInt(id) === adminId && role && role !== "admin") {
    return res.status(400).json({ error: "Cannot demote your own admin role" });
  }

  let updates = [];
  let params = [];

  if (role && ["tester", "developer", "admin"].includes(role)) {
    updates.push("role = ?");
    params.push(role);
  }

  if (email) {
    updates.push("email = ?");
    params.push(email);
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ error: "Failed to hash password" });
      
      updates.push("password = ?");
      params.push(hashedPassword);
      params.push(id);

      const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
      db.query(sql, params, (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Email already exists" });
          }
          return res.status(500).json({ error: "Failed to update user" });
        }
        
        logAuditEvent(adminId, "UPDATE_USER", { role, email: !!email, password: !!password }, "user", id);
        res.json({ message: "User updated successfully" });
      });
    });
    return;
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  params.push(id);
  const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
  db.query(sql, params, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(500).json({ error: "Failed to update user" });
    }
    
    logAuditEvent(adminId, "UPDATE_USER", { role, email: !!email }, "user", id);
    res.json({ message: "User updated successfully" });
  });
});


// ================= DEACTIVATE USER (Soft Delete) =================
router.put("/users/:id/deactivate", authMiddleware, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  if (parseInt(id) === adminId) {
    return res.status(400).json({ error: "Cannot deactivate your own account" });
  }

  db.query(
    "UPDATE users SET is_active = 0 WHERE id = ?",
    [id],
    err => {
      if (err) return res.status(500).json({ error: "Failed to deactivate user" });
      logAuditEvent(adminId, "DEACTIVATE_USER", { reason: "Admin deactivation" }, "user", id);
      res.json({ message: "User deactivated successfully" });
    }
  );
});

// ================= REACTIVATE USER =================
router.put("/users/:id/reactivate", authMiddleware, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  db.query(
    "UPDATE users SET is_active = 1 WHERE id = ?",
    [id],
    err => {
      if (err) return res.status(500).json({ error: "Failed to reactivate user" });
      logAuditEvent(adminId, "REACTIVATE_USER", {}, "user", id);
      res.json({ message: "User reactivated successfully" });
    }
  );
});

// ================= DELETE USER (Hard Delete) =================
router.delete("/users/:id", authMiddleware, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  if (parseInt(id) === adminId) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  db.query("DELETE FROM users WHERE id = ?", [id], err => {
    if (err) return res.status(500).json({ error: "Failed to delete user" });
    logAuditEvent(adminId, "DELETE_USER", {}, "user", id);
    res.json({ message: "User deleted successfully" });
  });
});

// ================= AUDIT LOGS =================

// Get all audit logs
router.get("/audit-logs", authMiddleware, requireRole("admin"), (req, res) => {
  const limit = req.query.limit || 100;
  const offset = req.query.offset || 0;
  
  const sql = `
    SELECT al.*, u.email FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.query(sql, [parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch audit logs" });
    res.json(results);
  });
});

// Get audit log summary
router.get("/audit-logs/summary", authMiddleware, requireRole("admin"), (req, res) => {
  const sql = `
    SELECT 
      action,
      COUNT(*) as count,
      MAX(created_at) as last_occurrence
    FROM audit_logs
    GROUP BY action
    ORDER BY count DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch audit summary" });
    res.json(results);
  });
});

// ================= PROJECT MANAGEMENT =================

// Get all projects with extended info
router.get("/projects", authMiddleware, requireRole("admin"), (req, res) => {
  const sql = `
    SELECT p.*,
      COUNT(DISTINCT t.id) as testcase_count,
      COUNT(DISTINCT b.id) as bug_count
    FROM projects p
    LEFT JOIN testcases t ON p.id = t.project_id
    LEFT JOIN bugs b ON p.id = b.project_id
    GROUP BY p.id
    ORDER BY p.id DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch projects" });
    res.json(results);
  });
});

// Create project
router.post("/projects", authMiddleware, requireRole("admin"), (req, res) => {
  const { name, description } = req.body;
  const adminId = req.user.id;

  if (!name) return res.status(400).json({ error: "Project name required" });

  db.query(
    "INSERT INTO projects (name, description) VALUES (?, ?)",
    [name, description || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to create project" });
      logAuditEvent(adminId, "CREATE_PROJECT", { name, description }, "project", result.insertId);
      res.json({ message: "Project created successfully", id: result.insertId });
    }
  );
});

// Update project
router.put("/projects/:id", authMiddleware, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const adminId = req.user.id;

  if (!name) return res.status(400).json({ error: "Project name required" });

  db.query(
    "UPDATE projects SET name = ?, description = ? WHERE id = ?",
    [name, description || null, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to update project" });
      logAuditEvent(adminId, "UPDATE_PROJECT", { name, description }, "project", id);
      res.json({ message: "Project updated successfully" });
    }
  );
});

// Delete project
router.delete("/projects/:id", authMiddleware, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  // Check if project has testcases or bugs
  const checkSql = "SELECT COUNT(*) as count FROM testcases WHERE project_id = ?";
  db.query(checkSql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to check project" });
    
    if (results[0].count > 0) {
      return res.status(400).json({ error: "Cannot delete project with existing test cases" });
    }

    const deleteSql = "DELETE FROM projects WHERE id = ?";
    db.query(deleteSql, [id], (err) => {
      if (err) return res.status(500).json({ error: "Failed to delete project" });
      logAuditEvent(adminId, "DELETE_PROJECT", {}, "project", id);
      res.json({ message: "Project deleted successfully" });
    });
  });
});

// ================= SYSTEM CONFIGURATION =================

// Get system settings
router.get("/settings", authMiddleware, requireRole("admin"), (req, res) => {
  const sql = "SELECT `key`, `value` FROM system_settings";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch settings" });
    
    const settings = {};
    results.forEach(row => {
      settings[row.key] = row.value;
    });
    
    res.json(settings);
  });
});

// Update system setting
router.put("/settings/:key", authMiddleware, requireRole("admin"), (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const adminId = req.user.id;

  const sql = `
    INSERT INTO system_settings (\`key\`, \`value\`) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE \`value\` = ?
  `;

  db.query(sql, [key, value, value], (err) => {
    if (err) return res.status(500).json({ error: "Failed to update setting" });
    logAuditEvent(adminId, "UPDATE_SETTING", { key, value }, "setting", 0);
    res.json({ message: "Setting updated successfully" });
  });
});

// ================= ROLES MANAGEMENT =================

// Get all roles with permissions
router.get("/roles", authMiddleware, requireRole("admin"), (req, res) => {
  const sql = `
    SELECT DISTINCT role FROM users
    UNION
    SELECT DISTINCT role FROM role_permissions
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch roles" });
    
    const roles = ['tester', 'developer', 'admin'];
    res.json(roles);
  });
});

// Get role permissions
router.get("/roles/:role/permissions", authMiddleware, requireRole("admin"), (req, res) => {
  const { role } = req.params;

  const sql = "SELECT permission FROM role_permissions WHERE role = ?";
  db.query(sql, [role], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch permissions" });
    res.json(results.map(r => r.permission));
  });
});

// Update role permissions
router.put("/roles/:role/permissions", authMiddleware, requireRole("admin"), (req, res) => {
  const { role } = req.params;
  const { permissions } = req.body;
  const adminId = req.user.id;

  // Delete existing permissions
  const deleteSql = "DELETE FROM role_permissions WHERE role = ?";
  db.query(deleteSql, [role], (err) => {
    if (err) return res.status(500).json({ error: "Failed to update permissions" });

    if (permissions.length === 0) {
      logAuditEvent(adminId, "UPDATE_ROLE_PERMISSIONS", { role, permissions }, "role", 0);
      return res.json({ message: "Role permissions updated successfully" });
    }

    // Insert new permissions
    const insertSql = "INSERT INTO role_permissions (role, permission) VALUES ?";
    const values = permissions.map(p => [role, p]);

    db.query(insertSql, [values], (err) => {
      if (err) return res.status(500).json({ error: "Failed to update permissions" });
      logAuditEvent(adminId, "UPDATE_ROLE_PERMISSIONS", { role, permissions }, "role", 0);
      res.json({ message: "Role permissions updated successfully" });
    });
  });
});

// ================= BACKUP MANAGEMENT =================

// Trigger backup
router.post("/backup", authMiddleware, requireRole("admin"), async (req, res) => {
  const adminId = req.user.id;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup_${timestamp}`;

  // Create backup record in database first
  const insertSql = `
    INSERT INTO backups (name, status, created_by, created_at)
    VALUES (?, 'in_progress', ?, NOW())
  `;

  db.query(insertSql, [backupName, adminId], async (err, result) => {
    if (err) {
      console.error("Failed to create backup record:", err);
      return res.status(500).json({ error: "Failed to create backup record" });
    }

    const backupId = result.insertId;

    try {
      // Perform actual database backup
      const backupResult = await backupService.createBackup(backupName);
      
      // Update backup record with success status
      const updateSql = `
        UPDATE backups 
        SET status = 'completed', 
            file_path = ?, 
            file_size = ?
        WHERE id = ?
      `;
      
      db.query(updateSql, [backupResult.fileName, backupResult.fileSize, backupId], (updateErr) => {
        if (updateErr) {
          console.error("Failed to update backup status:", updateErr);
        }
      });

      // Log the successful backup
      logAuditEvent(adminId, "TRIGGER_BACKUP", { 
        backupName, 
        fileName: backupResult.fileName,
        fileSize: backupResult.fileSizeMB + ' MB'
      }, "backup", backupId);

      res.json({ 
        message: "Backup completed successfully", 
        backup_id: backupId, 
        name: backupName,
        fileName: backupResult.fileName,
        fileSize: backupResult.fileSizeMB + ' MB'
      });

    } catch (backupError) {
      console.error("Backup failed:", backupError);
      
      // Update backup record with failed status
      const updateSql = `UPDATE backups SET status = 'failed' WHERE id = ?`;
      db.query(updateSql, [backupId]);

      logAuditEvent(adminId, "BACKUP_FAILED", { 
        backupName, 
        error: backupError.message 
      }, "backup", backupId);

      res.status(500).json({ 
        error: "Backup failed", 
        details: backupError.message 
      });
    }
  });
});

// Get backups list
router.get("/backups", authMiddleware, requireRole("admin"), (req, res) => {
  const sql = `
    SELECT b.*, u.email FROM backups b
    LEFT JOIN users u ON b.created_by = u.id
    ORDER BY b.created_at DESC
    LIMIT 50
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch backups" });
    res.json(results);
  });
});

// Delete backup
router.delete("/backups/:id", authMiddleware, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  // First, get backup details to find the file
  db.query("SELECT * FROM backups WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch backup" });
    if (results.length === 0) return res.status(404).json({ error: "Backup not found" });

    const backup = results[0];
    const fileName = backup.file_path || backup.name + '.sql';

    // Delete physical backup file
    try {
      backupService.deleteBackupFile(fileName);
    } catch (fileErr) {
      console.error("Failed to delete backup file:", fileErr);
    }

    // Delete backup record from database
    db.query("DELETE FROM backups WHERE id = ?", [id], (deleteErr) => {
      if (deleteErr) return res.status(500).json({ error: "Failed to delete backup record" });
      logAuditEvent(adminId, "DELETE_BACKUP", { fileName }, "backup", id);
      res.json({ message: "Backup deleted successfully" });
    });
  });
});

// Download backup file
router.get("/backups/:id/download", authMiddleware, requireRole("admin"), (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM backups WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch backup" });
    if (results.length === 0) return res.status(404).json({ error: "Backup not found" });

    const backup = results[0];
    const fileName = backup.file_path || backup.name + '.sql';
    const filePath = path.join(__dirname, '..', 'backups', fileName);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Backup file not found on disk" });
    }

    // Send file for download
    res.download(filePath, fileName, (downloadErr) => {
      if (downloadErr) {
        console.error("Download error:", downloadErr);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to download backup" });
        }
      }
    });
  });
});

// Restore from backup
router.post("/backups/:id/restore", authMiddleware, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  db.query("SELECT * FROM backups WHERE id = ?", [id], async (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch backup" });
    if (results.length === 0) return res.status(404).json({ error: "Backup not found" });

    const backup = results[0];
    const fileName = backup.file_path || backup.name + '.sql';

    try {
      // Perform database restore
      await backupService.restoreBackup(fileName);

      logAuditEvent(adminId, "RESTORE_BACKUP", { 
        backupId: id,
        fileName 
      }, "backup", id);

      res.json({ 
        message: "Database restored successfully", 
        backup: backup.name 
      });

    } catch (restoreError) {
      console.error("Restore failed:", restoreError);
      
      logAuditEvent(adminId, "RESTORE_FAILED", { 
        backupId: id,
        fileName,
        error: restoreError.message 
      }, "backup", id);

      res.status(500).json({ 
        error: "Restore failed", 
        details: restoreError.message 
      });
    }
  });
});


module.exports = router;
