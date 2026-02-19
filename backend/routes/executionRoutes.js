const express = require("express");
const router = express.Router();
const db = require("../config/db");

// FIXED IMPORTS
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");


// ================= EXECUTE TESTCASE =================
router.post(
  "/execution",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const { testcase_id, status, notes, project_id } = req.body;

    if (!testcase_id || !status) {
      return res.status(400).json({
        error: "Testcase ID and status required",
      });
    }

    db.query(
      "INSERT INTO executions (testcase_id, status, notes, project_id) VALUES (?, ?, ?, ?)",
      [testcase_id, status, notes || null, project_id || null],
      (err, result) => {
        if (err) {
          console.log("Execution insert error:", err);
          return res.status(500).json({
            error: "Execution failed",
          });
        }

        res.json({
          message: "Execution recorded",
          id: result.insertId,
        });
      }
    );
  }
);


// ================= GET EXECUTIONS =================
router.get("/execution", authMiddleware, (req, res) => {
  db.query("SELECT * FROM executions ORDER BY id DESC", (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: "Fetch failed",
      });
    }

    res.json(results);
  });
});


module.exports = router;
