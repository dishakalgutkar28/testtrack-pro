const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const NotificationService = require("../services/notificationService");
const logger = require("../utils/logger");

// ================= CREATE RETEST REQUEST =================
router.post(
  "/retest-requests",
  authMiddleware,
  (req, res) => {
    const { bug_id, notes } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!bug_id) {
      return res.status(400).json({ error: "Bug ID is required" });
    }

    // Only developers and admins can request re-tests
    if (userRole !== "developer" && userRole !== "admin") {
      return res.status(403).json({ error: "Only developers can request re-tests" });
    }

    // Check if bug exists and get reporter
    db.query("SELECT id, title, assigned_to, reported_by FROM bugs WHERE id = ?", [bug_id], (err, bugResults) => {
      if (err) {
        console.error("Fetch bug error:", err);
        return res.status(500).json({ error: "Failed to fetch bug" });
      }

      if (!bugResults || bugResults.length === 0) {
        return res.status(404).json({ error: "Bug not found" });
      }

      const bug = bugResults[0];

      // Create retest request
      const sql = `
        INSERT INTO retest_requests (bug_id, requested_by, notes, status)
        VALUES (?, ?, ?, 'pending')
      `;
      db.query(sql, [bug_id, userId, notes || null], async (err, result) => {
        if (err) {
          console.error("Create retest request error:", err);
          return res.status(500).json({ error: "Failed to create re-test request" });
        }

        // Notify the tester who reported this bug
        try {
          if (bug.reported_by) {
            // Check if the reporter is a tester
            const reporter = await new Promise((resolve, reject) => {
              db.query("SELECT id, email, role FROM users WHERE id = ?", [bug.reported_by], (err, results) => {
                if (err) reject(err);
                else resolve(results && results.length > 0 ? results[0] : null);
              });
            });

            if (reporter && reporter.role === 'tester') {
              await NotificationService.sendNotification({
                userId: reporter.id,
                type: "retest_request",
                title: `Re-test requested for bug: ${bug.title}`,
                message: `Bug #${bug_id} requires re-testing after fix applied`,
                link: `/bugs/${bug_id}`,
                senderId: userId
              });
            } else {
              logger.warn("Bug reporter is not a tester, notifying all testers instead", { bugId: bug_id });
              // Fallback: notify all testers if reporter is not a tester
              const testers = await new Promise((resolve, reject) => {
                db.query("SELECT id FROM users WHERE role = 'tester'", (err, results) => {
                  if (err) reject(err);
                  else resolve(results || []);
                });
              });

              for (const tester of testers) {
                await NotificationService.sendNotification({
                  userId: tester.id,
                  type: "retest_request",
                  title: `Re-test requested for bug: ${bug.title}`,
                  message: `Bug #${bug_id} requires re-testing after fix applied`,
                  link: `/bugs/${bug_id}`,
                  senderId: userId
                });
              }
            }
          } else {
            logger.warn("Bug has no reporter, notifying all testers", { bugId: bug_id });
            // If no reporter, notify all testers
            const testers = await new Promise((resolve, reject) => {
              db.query("SELECT id FROM users WHERE role = 'tester'", (err, results) => {
                if (err) reject(err);
                else resolve(results || []);
              });
            });

            for (const tester of testers) {
              await NotificationService.sendNotification({
                userId: tester.id,
                type: "retest_request",
                title: `Re-test requested for bug: ${bug.title}`,
                message: `Bug #${bug_id} requires re-testing after fix applied`,
                link: `/bugs/${bug_id}`,
                senderId: userId
              });
            }
          }
        } catch (notificationErr) {
          console.error("❌ Failed to send retest notifications:", notificationErr);
          logger.error("Failed to send retest notifications", { error: notificationErr.message, stack: notificationErr.stack });
        }

        res.status(201).json({
          success: true,
          message: "Re-test request created successfully",
          retest_id: result.insertId
        });
      });
    });
  }
);

// ================= GET RETEST REQUESTS FOR CURRENT USER =================
router.get(
  "/retest-requests",
  authMiddleware,
  (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let sql;
    let params;

    if (userRole === "tester") {
      // Testers see re-test requests for bugs (all pending re-tests)
      sql = `
        SELECT 
          rr.id,
          rr.bug_id,
          rr.requested_by,
          rr.requested_at,
          rr.status,
          rr.notes,
          b.title as bug_title,
          b.description as bug_description,
          b.severity,
          u.email as requested_by_email
        FROM retest_requests rr
        JOIN bugs b ON rr.bug_id = b.id
        JOIN users u ON rr.requested_by = u.id
        WHERE rr.status = 'pending'
        ORDER BY rr.requested_at DESC
      `;
      params = [];
    } else {
      // Developers see their own re-test requests
      sql = `
        SELECT 
          rr.id,
          rr.bug_id,
          rr.requested_by,
          rr.requested_at,
          rr.status,
          rr.notes,
          b.title as bug_title,
          b.description as bug_description,
          b.severity,
          u.email as requested_by_email
        FROM retest_requests rr
        JOIN bugs b ON rr.bug_id = b.id
        JOIN users u ON rr.requested_by = u.id
        WHERE rr.requested_by = ?
        ORDER BY rr.requested_at DESC
      `;
      params = [userId];
    }

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("Fetch retest requests error:", err);
        return res.status(500).json({ error: "Failed to fetch re-test requests" });
      }

      res.json(results || []);
    });
  }
);

// ================= GET RETEST REQUESTS FOR SPECIFIC BUG =================
router.get(
  "/bugs/:bugId/retest-requests",
  authMiddleware,
  (req, res) => {
    const bugId = req.params.bugId;

    const sql = `
      SELECT 
        rr.id,
        rr.bug_id,
        rr.requested_by,
        rr.requested_at,
        rr.status,
        rr.notes,
        rr.completed_at,
        rr.completed_by,
        u.email as requested_by_email,
        uc.email as completed_by_email
      FROM retest_requests rr
      JOIN users u ON rr.requested_by = u.id
      LEFT JOIN users uc ON rr.completed_by = uc.id
      WHERE rr.bug_id = ?
      ORDER BY rr.requested_at DESC
    `;

    db.query(sql, [bugId], (err, results) => {
      if (err) {
        console.error("Fetch bug retest requests error:", err);
        return res.status(500).json({ error: "Failed to fetch re-test requests" });
      }

      res.json(results || []);
    });
  }
);

// ================= MARK RETEST AS COMPLETED =================
router.put(
  "/retest-requests/:id/complete",
  authMiddleware,
  (req, res) => {
    const retestId = req.params.id;
    const userId = req.user?.id;
    const { notes } = req.body;

    const sql = `
      UPDATE retest_requests
      SET status = 'completed', completed_at = NOW(), completed_by = ?, notes = CONCAT(IFNULL(notes, ''), '\n\n[COMPLETED BY TESTER]\n', ?)
      WHERE id = ?
    `;

    db.query(sql, [userId, notes || "Re-test completed", retestId], (err, result) => {
      if (err) {
        console.error("Update retest request error:", err);
        return res.status(500).json({ error: "Failed to update re-test request" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Re-test request not found" });
      }

      res.json({ success: true, message: "Re-test marked as completed" });
    });
  }
);

// ================= CANCEL RETEST REQUEST =================
router.put(
  "/retest-requests/:id/cancel",
  authMiddleware,
  (req, res) => {
    const retestId = req.params.id;
    const { reason } = req.body;

    const sql = `
      UPDATE retest_requests
      SET status = 'cancelled', notes = CONCAT(IFNULL(notes, ''), '\n\n[CANCELLED]\n', ?)
      WHERE id = ?
    `;

    db.query(sql, [reason || "Request cancelled", retestId], (err, result) => {
      if (err) {
        console.error("Cancel retest request error:", err);
        return res.status(500).json({ error: "Failed to cancel re-test request" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Re-test request not found" });
      }

      res.json({ success: true, message: "Re-test request cancelled" });
    });
  }
);

module.exports = router;
