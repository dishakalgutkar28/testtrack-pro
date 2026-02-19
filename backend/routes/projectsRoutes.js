const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");


// ================= GET ALL PROJECTS =================
router.get("/projects", authMiddleware, (req, res) => {
  db.query("SELECT * FROM projects ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch projects" });
    res.json(results);
  });
});


// ================= CREATE PROJECT (ADMIN ONLY) =================
router.post("/projects", authMiddleware, requireRole("admin"), (req, res) => {
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ error: "Project name required" });

  db.query(
    "INSERT INTO projects (name, description) VALUES (?, ?)",
    [name, description || null],
    err => {
      if (err) return res.status(500).json({ error: "Project creation failed" });
      res.json({ message: "Project created successfully" });
    }
  );
});


module.exports = router;
