const express = require("express");
const router = express.Router();
const db = require("../config/db");

// CORRECT middleware imports
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
      return res.status(400).json({ error: "Bug title required" });
    }

    const sql = `
      INSERT INTO bugs 
      (title, description, severity, testcase_id, project_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        title,
        description || null,
        severity || "medium",
        testcase_id || null,
        project_id || null,
      ],
      (err, result) => {
        if (err) {
          console.log("Bug insert error:", err);
          return res.status(500).json({ error: "Failed to create bug" });
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
  db.query("SELECT * FROM bugs", (err, results) => {
    if (err) {
      console.log("Fetch bug error:", err);
      return res.status(500).json({ error: "Failed to fetch bugs" });
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
    const { status } = req.body;

    db.query(
      "UPDATE bugs SET status=? WHERE id=?",
      [status || "open", req.params.id],
      (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Update failed" });
        }

        res.json({ message: "Bug updated" });
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
    db.query("DELETE FROM bugs WHERE id=?", [req.params.id], (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Delete failed" });
      }

      res.json({ message: "Bug deleted" });
    });
  }
);

module.exports = router;
