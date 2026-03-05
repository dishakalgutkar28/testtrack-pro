const express = require("express");
const router = express.Router();
const db = require("../config/db");
const NotificationService = require("../services/notificationService");
const logger = require("../utils/logger");

// Middleware imports
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { getAssignmentFilter } = require("../middleware/assignmentMiddleware");


// ================= CREATE BUG =================
router.post(
  "/bugs",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    const { title, description, severity, testcase_id, project_id, steps_to_reproduce, expected_behavior, actual_behavior, environment_affected, version } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "Bug title is required",
      });
    }

    const status = "open"; // Default status
    const userId = req.user?.id;
    
    // Generate unique bug ID (BUG-2024-XXXXX)
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const bugId = `BUG-${year}-${rand}`;

    const sql = `
      INSERT INTO bugs
      (bug_id, title, description, severity, status, testcase_id, project_id, steps_to_reproduce, expected_behavior, actual_behavior, environment_affected, version, created_by, reported_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        bugId,
        title,
        description || null,
        severity || "medium",
        status,
        testcase_id || null,
        project_id || null,
        steps_to_reproduce || null,
        expected_behavior || null,
        actual_behavior || null,
        environment_affected || null,
        version || null,
        userId || null,
        userId || null,
      ],
      (err, result) => {
        if (err) {
          console.error("Bug insert error:", err);
          return res.status(500).json({
            error: "Failed to create bug",
          });
        }

        res.status(201).json({
          message: "Bug created successfully",
          id: result.insertId,
          bug_id: bugId,
        });
      }
    );
  }
);


// ================= GET ALL BUGS =================
router.get("/bugs", authMiddleware, (req, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const params = [];
  const conditions = [];

  // Add assignment filter for testers and developers
  const assignmentFilter = getAssignmentFilter(req.user, 'bugs');
  
  if (assignmentFilter.whereClause) {
    conditions.push(assignmentFilter.whereClause);
    params.push(...assignmentFilter.params);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : '';
  const sql = `SELECT * FROM bugs ${whereClause} ORDER BY id DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Fetch bug error:", err);
      return res.status(500).json({
        error: "Failed to fetch bugs",
      });
    }

    console.log(`✅ User ${userId} (${userRole}) fetched ${results.length} bugs`);
    res.json(results);
  });
});


// ================= UPDATE BUG STATUS =================
router.put(
  "/bugs/:id",
  authMiddleware,
  requireRole("tester", "developer", "admin"),
  (req, res) => {
    const { status, assigned_to, due_date, fix_notes, linked_commit } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;
    const bugId = req.params.id;

    // First, fetch current bug details
    db.query("SELECT * FROM bugs WHERE id = ?", [bugId], (err, bugResults) => {
      if (err) {
        console.error("Fetch bug error:", err);
        return res.status(500).json({ error: "Failed to fetch bug details" });
      }

      if (bugResults.length === 0) {
        return res.status(404).json({ error: "Bug not found" });
      }

      const currentBug = bugResults[0];

      // Build dynamic update query
      const updates = [];
      const values = [];

      if (userRole === "tester") {
        // Allow tester to assign if: they reported it, created it, or if no one is assigned yet (legacy bugs)
        const isReporter = currentBug.reported_by === userId || currentBug.created_by === userId;
        const isLegacyBug = !currentBug.reported_by && !currentBug.created_by;
        
        if (!isReporter && !isLegacyBug) {
          return res.status(403).json({ error: "Access denied. Only the bug reporter can assign it." });
        }

        if (status !== undefined || due_date !== undefined || fix_notes !== undefined || linked_commit !== undefined) {
          return res.status(403).json({
            error: "Testers can only assign bugs to developers.",
          });
        }

        if (assigned_to !== undefined) {
          updates.push("assigned_to=?");
          values.push(assigned_to || null);
        }
      } else if (userRole === "developer") {
        if (assigned_to !== undefined || due_date !== undefined) {
          return res.status(403).json({
            error: "Developers can only update status and fix notes.",
          });
        }

        if (status) {
          updates.push("status=?");
          values.push(status);
        }

        if (fix_notes !== undefined) {
          updates.push("fix_notes=?");
          values.push(fix_notes || null);
        }

        if (linked_commit !== undefined) {
          updates.push("linked_commit=?");
          values.push(linked_commit || null);
        }
      } else if (userRole === "admin") {
        if (status) {
          updates.push("status=?");
          values.push(status);
        }

        if (assigned_to !== undefined) {
          updates.push("assigned_to=?");
          values.push(assigned_to || null);
        }

        if (due_date !== undefined) {
          updates.push("due_date=?");
          values.push(due_date || null);
        }

        if (fix_notes !== undefined) {
          updates.push("fix_notes=?");
          values.push(fix_notes || null);
        }

        if (linked_commit !== undefined) {
          updates.push("linked_commit=?");
          values.push(linked_commit || null);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: "No fields to update",
        });
      }

      values.push(bugId);

      db.query(
        `UPDATE bugs SET ${updates.join(", ")} WHERE id=?`,
        values,
        (updateErr, result) => {
          if (updateErr) {
            console.error("Update bug error:", updateErr);
            return res.status(500).json({
              error: "Update failed",
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              error: "Bug not found",
            });
          }

          // Send notifications asynchronously
          (async () => {
            try {
              // Notify on assignment
              if (assigned_to !== undefined && assigned_to !== currentBug.assigned_to && assigned_to !== null) {
                await NotificationService.notifyBugAssignment(
                  bugId,
                  assigned_to,
                  req.user.id,
                  currentBug.title
                );
              }

              // Notify on status change
              if (status && status !== currentBug.status) {
                if (currentBug.assigned_to) {
                  await NotificationService.notifyBugStatusChange(
                    bugId,
                    currentBug.assigned_to,
                    req.user.id,
                    currentBug.title,
                    currentBug.status,
                    status
                  );
                }
              }
            } catch (notifyError) {
              logger.error("Error sending notifications", { error: notifyError });
            }
          })();

          res.json({
            message: "Bug updated successfully",
          });
        }
      );
    });
  }
);


// ================= DELETE BUG =================
router.delete(
  "/bugs/:id",
  authMiddleware,
  requireRole("admin"),
  (req, res) => {
    db.query(
      "DELETE FROM bugs WHERE id=?",
      [req.params.id],
      (err, result) => {
        if (err) {
          console.error("Delete bug error:", err);
          return res.status(500).json({
            error: "Delete failed",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            error: "Bug not found",
          });
        }

        res.json({
          message: "Bug deleted successfully",
        });
      }
    );
  }
);

// ================= GET DEVELOPERS FOR ASSIGNMENT =================
router.get(
  "/developers",
  authMiddleware,
  (req, res) => {
    db.query(
      "SELECT id, email FROM users WHERE role='developer'",
      (err, results) => {
        if (err) {
          console.error("Get developers error:", err);
          return res.status(500).json({
            error: "Failed to fetch developers",
          });
        }
        res.json(results);
      }
    );
  }
);

module.exports = router;
