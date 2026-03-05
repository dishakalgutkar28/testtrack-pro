const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

// ================= LINK COMMIT TO TEST CASE =================
router.post("/testcase/:id/commits", authMiddleware, requireRole("tester", "developer", "admin"), (req, res) => {
  const testcaseId = req.params.id;
  const { commit_sha, commit_message, commit_author, commit_date, repository_url } = req.body;
  const userId = req.user.id;

  if (!commit_sha || !commit_sha.trim()) {
    return res.status(400).json({ error: "Commit SHA is required" });
  }

  // Validate SHA format (40 char hex or shortened)
  if (!/^[a-f0-9]{7,40}$/i.test(commit_sha.trim())) {
    return res.status(400).json({ error: "Invalid commit SHA format (should be 7-40 hex characters)" });
  }

  const sql = `
    INSERT INTO testcase_commits (testcase_id, commit_sha, commit_message, commit_author, commit_date, repository_url, linked_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [testcaseId, commit_sha.trim(), commit_message || null, commit_author || null, commit_date || null, repository_url || null, userId],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: "This commit is already linked to this test case" });
        }
        console.error("Link commit error:", err);
        return res.status(500).json({ error: "Failed to link commit" });
      }

      res.status(201).json({
        message: "Commit linked successfully",
        id: result.insertId
      });
    }
  );
});

// ================= GET COMMITS FOR TEST CASE =================
router.get("/testcase/:id/commits", authMiddleware, (req, res) => {
  const testcaseId = req.params.id;

  const sql = `
    SELECT 
      tc.id,
      tc.commit_sha,
      tc.commit_message,
      tc.commit_author,
      tc.commit_date,
      tc.repository_url,
      tc.linked_at,
      u.email as linked_by_user
    FROM testcase_commits tc
    LEFT JOIN users u ON tc.linked_by = u.id
    WHERE tc.testcase_id = ?
    ORDER BY tc.linked_at DESC
  `;

  db.query(sql, [testcaseId], (err, results) => {
    if (err) {
      console.error("Get commits error:", err);
      return res.status(500).json({ error: "Failed to fetch commits" });
    }

    res.json(results || []);
  });
});

// ================= UNLINK COMMIT FROM TEST CASE =================
router.delete("/testcase/:id/commits/:commitId", authMiddleware, requireRole("tester", "developer", "admin"), (req, res) => {
  const testcaseId = req.params.id;
  const commitId = req.params.commitId;

  const sql = `DELETE FROM testcase_commits WHERE id = ? AND testcase_id = ?`;

  db.query(sql, [commitId, testcaseId], (err, result) => {
    if (err) {
      console.error("Unlink commit error:", err);
      return res.status(500).json({ error: "Failed to unlink commit" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Commit link not found" });
    }

    res.json({ message: "Commit unlinked successfully" });
  });
});

// ================= LINK COMMIT TO EXECUTION =================
router.post("/execution/:id/commits", authMiddleware, requireRole("tester", "developer", "admin"), (req, res) => {
  const executionId = req.params.id;
  const { commit_sha, commit_message } = req.body;

  if (!commit_sha || !commit_sha.trim()) {
    return res.status(400).json({ error: "Commit SHA is required" });
  }

  const sql = `
    INSERT INTO execution_commits (execution_id, commit_sha, commit_message)
    VALUES (?, ?, ?)
  `;

  db.query(
    sql,
    [executionId, commit_sha.trim(), commit_message || null],
    (err, result) => {
      if (err) {
        console.error("Link execution commit error:", err);
        return res.status(500).json({ error: "Failed to link commit to execution" });
      }

      res.status(201).json({
        message: "Commit linked to execution successfully",
        id: result.insertId
      });
    }
  );
});

// ================= GET COMMITS FOR EXECUTION =================
router.get("/execution/:id/commits", authMiddleware, (req, res) => {
  const executionId = req.params.id;

  const sql = `
    SELECT 
      ec.id,
      ec.commit_sha,
      ec.commit_message,
      ec.linked_at
    FROM execution_commits ec
    WHERE ec.execution_id = ?
    ORDER BY ec.linked_at DESC
  `;

  db.query(sql, [executionId], (err, results) => {
    if (err) {
      console.error("Get execution commits error:", err);
      return res.status(500).json({ error: "Failed to fetch commits" });
    }

    res.json(results || []);
  });
});

module.exports = router;
