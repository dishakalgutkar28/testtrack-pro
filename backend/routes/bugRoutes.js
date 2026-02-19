const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Middleware imports
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");


// ================= CREATE BUG =================
router.post(
  "/bugs",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    const { title, description, severity, testcase_id, project_id } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "Bug title is required",
      });
    }

    const status = "open"; // Default status

    const sql = `
      INSERT INTO bugs
      (title, description, severity, testcase_id, project_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        title,
        description || null,
        severity || "medium",
        testcase_id || null,
        project_id || null,
        status,
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
        });
      }
    );
  }
);


// ================= GET ALL BUGS =================
router.get("/bugs", authMiddleware, (req, res) => {
  db.query("SELECT * FROM bugs ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("Fetch bug error:", err);
      return res.status(500).json({
        error: "Failed to fetch bugs",
      });
    }

    res.json(results);
  });
});


// ================= UPDATE BUG STATUS =================
router.put(
  "/bugs/:id",
  authMiddleware,
  requireRole("developer", "admin"),
  (req, res) => {
    const { status, assigned_to, due_date } = req.body;
    const userRole = req.user.role;

    // Build dynamic update query
    const updates = [];
    const values = [];

    // Developers can only update status
    if (userRole === "developer") {
      if (status) {
        updates.push("status=?");
        values.push(status);
      }
      if (assigned_to !== undefined || due_date !== undefined) {
        return res.status(403).json({
          error: "Developers can only update bug status. Assignment and due dates are managed by admins.",
        });
      }
    }

    // Admins can update everything
    if (userRole === "admin") {
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
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    values.push(req.params.id);

    db.query(
      `UPDATE bugs SET ${updates.join(", ")} WHERE id=?`,
      values,
      (err, result) => {
        if (err) {
          console.error("Update bug error:", err);
          return res.status(500).json({
            error: "Update failed",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            error: "Bug not found",
          });
        }

        res.json({
          message: "Bug updated successfully",
        });
      }
    );
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
