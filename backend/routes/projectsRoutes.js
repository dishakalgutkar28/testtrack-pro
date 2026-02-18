const router = require("express").Router();
const db = require("../config/db");

const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

router.post("/projects", authMiddleware, requireRole("admin"), (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Project name required" });
  }

  db.query(
    "INSERT INTO projects (name) VALUES (?)",
    [name.trim()],
    (err, result) => {
      if (err) {
        console.error("Create project error:", err);
        return res.status(500).json({ error: "Failed to create project" });
      }
      res.status(201).json({ id: result.insertId, name: name.trim() });
    }
  );
});

// ✅ List projects (Any logged-in user)
router.get("/projects", authMiddleware, (req, res) => {
  db.query("SELECT * FROM projects ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("Fetch projects error:", err);
      return res.status(500).json({ error: "Failed to fetch projects" });
    }
    res.json(results);
  });
});

module.exports = router;
