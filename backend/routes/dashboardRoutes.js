const express = require("express");
const router = express.Router();
const db = require("../config/db");

// CORRECT IMPORTS
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");


// ================= DASHBOARD DATA =================
router.get(
  "/dashboard-data",
  authMiddleware,
  (req, res) => {

    const sql = `
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

      res.json(result[0]);
    });
  }
);


module.exports = router;
