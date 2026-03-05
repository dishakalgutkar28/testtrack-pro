const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");


// ================= IMPORT TEST CASES FROM CSV =================
router.post(
  "/import/testcases",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    console.log('[CSV] Import request received');
    console.log('[CSV] User:', req.user);
    
    const { csvData, projectId } = req.body;

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return res.status(400).json({
        error: "CSV data required",
      });
    }

    console.log(`[CSV] Importing ${csvData.length} test cases for project: ${projectId}`);
    
    const userId = req.user?.id;
    const imported = [];
    const errors = [];
    let processed = 0;

    csvData.forEach((row, index) => {
      const {
        title,
        description,
        expected_result,
        priority,
        preconditions,
        postconditions,
        test_steps,
        environment_requirements,
        estimated_duration,
        tags,
        automation_status
      } = row;

      // Validate required fields
      if (!title || !description || !expected_result) {
        errors.push({
          row: index + 1,
          error: "Missing required fields (title, description, expected_result)"
        });
        processed++;
        return;
      }

      // Generate unique test case ID
      const year = new Date().getFullYear();
      const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const testCaseId = `TC-${year}-${rand}`;

      const sql = `
        INSERT INTO testcases
        (test_case_id, title, description, expected_result, project_id, priority, 
         preconditions, postconditions, test_steps, environment_requirements, 
         estimated_duration, tags, automation_status, created_by, version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          testCaseId,
          title,
          description,
          expected_result,
          projectId || null,
          priority || 'medium',
          preconditions || null,
          postconditions || null,
          test_steps || null,
          environment_requirements || null,
          estimated_duration ? parseInt(estimated_duration) : null,
          tags || null,
          automation_status || 'Not Automated',
          userId,
          1
        ],
        (err, result) => {
          processed++;

          if (err) {
            console.error("Import error:", err);
            errors.push({
              row: index + 1,
              error: err.message
            });
          } else {
            imported.push({
              row: index + 1,
              id: result.insertId,
              testCaseId
            });
          }

          // Send response when all rows processed
          if (processed === csvData.length) {
            res.json({
              success: true,
              imported: imported.length,
              errors: errors.length,
              details: {
                imported,
                errors
              }
            });
          }
        }
      );
    });
  }
);


// ================= EXPORT TEST CASES TO CSV =================
router.get(
  "/export/testcases",
  authMiddleware,
  (req, res) => {
    const projectId = req.query.projectId;

    let sql = "SELECT * FROM testcases";
    let params = [];

    if (projectId) {
      sql += " WHERE project_id=?";
      params.push(projectId);
    }

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("Export error:", err);
        return res.status(500).json({
          error: "Failed to export testcases",
        });
      }

      // Convert to CSV format
      const csvRows = [];
      
      // Headers
      const headers = [
        'test_case_id', 'title', 'description', 'expected_result', 'priority',
        'preconditions', 'postconditions', 'test_steps', 'environment_requirements',
        'estimated_duration', 'tags', 'automation_status'
      ];
      csvRows.push(headers.join(','));

      // Data rows
      results.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      });

      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="testcases.csv"');
      res.send(csvContent);
    });
  }
);


module.exports = router;
