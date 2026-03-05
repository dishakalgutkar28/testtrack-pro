const express = require("express");
const router = express.Router();
const db = require("../config/db");

// CORRECT IMPORTS
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { getAssignmentFilter } = require("../middleware/assignmentMiddleware");


// ================= DASHBOARD DATA =================
router.get(
  "/dashboard-data",
  authMiddleware,
  (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let sql = '';

    if (userRole === 'admin') {
      // Admin sees all counts
      sql = `
        SELECT
          (SELECT COUNT(*) FROM testcases) AS testcases,
          (SELECT COUNT(*) FROM bugs) AS bugs,
          (SELECT COUNT(*) FROM executions) AS executions
      `;

      db.query(sql, (err, result) => {
        if (err) {
          console.log("Dashboard error:", err);
          return res.status(500).json({
            error: "Failed to fetch dashboard data",
          });
        }
        console.log(`✅ Admin ${userId} fetched dashboard data`);
        res.json(result[0]);
      });
    } else {
      // Tester/Developer sees only assigned
      sql = `
        SELECT
          (SELECT COUNT(*) FROM testcases WHERE assigned_to = ?) AS testcases,
          (SELECT COUNT(*) FROM bugs WHERE assigned_to = ?) AS bugs,
          (SELECT COUNT(*) FROM executions WHERE testcase_id IN (
            SELECT id FROM testcases WHERE assigned_to = ?
          )) AS executions
      `;

      const params = [userId, userId, userId];

      db.query(sql, params, (err, result) => {
        if (err) {
          console.log("Dashboard error:", err);
          return res.status(500).json({
            error: "Failed to fetch dashboard data",
          });
        }
        console.log(`✅ User ${userId} (${userRole}) fetched dashboard data`);
        res.json(result[0]);
      });
    }
  }
);


module.exports = router;
