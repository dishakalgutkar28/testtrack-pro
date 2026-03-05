const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

// ================= GET CURRENT LIFECYCLE STATE =================
router.get("/testcase/:id/lifecycle", authMiddleware, (req, res) => {
  const testcaseId = req.params.id;

  const sql = `SELECT lifecycle_state, reopen_count, closed_at, closed_by FROM testcases WHERE id = ?`;
  
  db.query(sql, [testcaseId], (err, results) => {
    if (err) {
      console.error("Get lifecycle state error:", err);
      return res.status(500).json({ error: "Failed to fetch lifecycle state" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Test case not found" });
    }

    res.json(results[0]);
  });
});

// ================= GET LIFECYCLE HISTORY =================
router.get("/testcase/:id/lifecycle-history", authMiddleware, (req, res) => {
  const testcaseId = req.params.id;

  const sql = `
    SELECT 
      tl.id,
      tl.state,
      tl.reason,
      tl.changed_at,
      u.email as changed_by_user
    FROM testcase_lifecycle tl
    LEFT JOIN users u ON tl.changed_by = u.id
    WHERE tl.testcase_id = ?
    ORDER BY tl.changed_at DESC
  `;

  db.query(sql, [testcaseId], (err, results) => {
    if (err) {
      console.error("Get lifecycle history error:", err);
      return res.status(500).json({ error: "Failed to fetch lifecycle history" });
    }

    res.json(results || []);
  });
});

// ================= CHANGE LIFECYCLE STATE =================
// Allowed transitions:
// Draft -> Ready -> In Execution -> Completed -> Closed
// Closed -> Reopened -> Ready/In Execution
router.put("/testcase/:id/lifecycle", authMiddleware, requireRole("tester"), (req, res) => {
  const testcaseId = req.params.id;
  const { newState, reason } = req.body;
  const userId = req.user.id;

  if (!newState) {
    return res.status(400).json({ error: "New state is required" });
  }

  // Valid states
  const validStates = ["Draft", "Ready", "In Execution", "Completed", "Closed", "Reopened"];
  if (!validStates.includes(newState)) {
    return res.status(400).json({ error: "Invalid state" });
  }

  // Get current state
  const getCurrent = `SELECT lifecycle_state FROM testcases WHERE id = ?`;
  
  db.query(getCurrent, [testcaseId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Test case not found" });
    }

    const currentState = results[0].lifecycle_state;

    // Validate transition
    const validTransitions = {
      "Draft": ["Ready"],
      "Ready": ["In Execution", "Draft"],
      "In Execution": ["Completed", "Ready"],
      "Completed": ["Closed"],
      "Closed": ["Reopened"],
      "Reopened": ["Ready", "In Execution", "Closed"]
    };

    if (!validTransitions[currentState] || !validTransitions[currentState].includes(newState)) {
      return res.status(400).json({
        error: `Invalid transition from ${currentState} to ${newState}`,
        availableStates: validTransitions[currentState]
      });
    }

    // Update testcase and create history
    const updateTestcase = `
      UPDATE testcases 
      SET lifecycle_state = ?,
          closed_by = ?,
          closed_at = ?
      WHERE id = ?
    `;

    const closedAt = (newState === "Closed") ? new Date() : null;

    db.query(updateTestcase, [newState, userId, closedAt, testcaseId], (updateErr) => {
      if (updateErr) {
        console.error("Update lifecycle state error:", updateErr);
        return res.status(500).json({ error: "Failed to update lifecycle state" });
      }

      // Insert into history
      const insertHistory = `
        INSERT INTO testcase_lifecycle (testcase_id, state, reason, changed_by)
        VALUES (?, ?, ?, ?)
      `;

      db.query(insertHistory, [testcaseId, newState, reason || null, userId], (histErr) => {
        if (histErr) {
          console.error("Insert lifecycle history error:", histErr);
          return res.status(500).json({ error: "State updated but history failed" });
        }

        res.json({
          message: `State changed from ${currentState} to ${newState}`,
          currentState: newState
        });
      });
    });
  });
});

// ================= VALIDATE TRANSITION =================
router.post("/testcase/:id/lifecycle-validate", authMiddleware, (req, res) => {
  const testcaseId = req.params.id;
  const { proposedState } = req.body;

  const sql = `SELECT lifecycle_state FROM testcases WHERE id = ?`;

  db.query(sql, [testcaseId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Test case not found" });
    }

    const currentState = results[0].lifecycle_state;

    const validTransitions = {
      "Draft": ["Ready"],
      "Ready": ["In Execution", "Draft"],
      "In Execution": ["Completed", "Ready"],
      "Completed": ["Closed"],
      "Closed": ["Reopened"],
      "Reopened": ["Ready", "In Execution", "Closed"]
    };

    const isValid = validTransitions[currentState] && 
                   validTransitions[currentState].includes(proposedState);

    res.json({
      currentState,
      isValid,
      availableStates: validTransitions[currentState] || []
    });
  });
});

module.exports = router;
