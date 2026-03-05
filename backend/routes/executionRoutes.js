const express = require("express");
const router = express.Router();
const db = require("../config/db");

// FIXED IMPORTS
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { getAssignmentFilter } = require("../middleware/assignmentMiddleware");


// ================= EXECUTE TESTCASE =================
router.post(
  "/execution",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    let { testcase_id, status, notes, project_id } = req.body;

    console.log("📋 Execution POST received:", { testcase_id, status, notes, project_id });

    if (!testcase_id || !status) {
      return res.status(400).json({
        error: "Testcase ID and status required",
      });
    }

    // If testcase_id is a string (like 'TC-20'), look up the numeric ID
    const handleInsert = (numericTestcaseId) => {
      db.query(
        "INSERT INTO executions (testcase_id, status, notes, project_id) VALUES (?, ?, ?, ?)",
        [numericTestcaseId, status, notes || null, project_id || null],
        (err, result) => {
          if (err) {
            console.error("🔴 Execution insert error:", err.message, err.code);
            console.error("   SQL Info:", err.sql);
            return res.status(500).json({
              error: "Execution failed",
              details: err.message
            });
          }

          console.log("✅ Execution recorded with ID:", result.insertId);
          res.json({
            message: "Execution recorded",
            id: result.insertId,
          });
        }
      );
    };

    // Check if testcase_id is numeric or string
    if (isNaN(testcase_id)) {
      // It's a string like 'TC-1' or 'TC-2026-001', look it up
      console.log("🔍 Looking up numeric ID for test_case_id:", testcase_id);
      
      // Build flexible WHERE clause
      let whereClause = "test_case_id = ?";
      let params = [testcase_id];
      
      // Also try matching if they entered a partial ID like "TC-1"
      if (testcase_id.toUpperCase().startsWith("TC-")) {
        // User entered TC-1, also check for TC-YYYY-00001 format
        const parts = testcase_id.split("-");
        if (parts.length === 2) {
          // TC-1 format - look for any test_case_id that ends with the number
          whereClause += ` OR test_case_id LIKE ? OR CONCAT('TC-', id) = ?`;
          params.push(`%-${parts[1]}`, testcase_id);
        }
      } else if (!isNaN(testcase_id)) {
        // Just a number, look for it
        whereClause += ` OR id = ? OR CONCAT('TC-', id) = ?`;
        params.push(parseInt(testcase_id), `TC-${testcase_id}`);
      }
      
      db.query(
        `SELECT id FROM testcases WHERE ${whereClause} LIMIT 1`,
        params,
        (err, results) => {
          if (err || !results || results.length === 0) {
            console.error("❌ Test case not found:", testcase_id);
            db.query("SELECT id, test_case_id FROM testcases LIMIT 10", (debugErr, debugResults) => {
              if (!debugErr && debugResults) {
                console.log("📝 Available test cases:", debugResults.map(r => `${r.id}:${r.test_case_id}`).join(", "));
              }
            });
            return res.status(404).json({
              error: "Test case not found",
              details: `Test case '${testcase_id}' not found. Try entering the full test case ID like 'TC-2026-00001' or just the numeric ID.`
            });
          }
          const numericId = results[0].id;
          console.log("✅ Found numeric ID:", numericId, "for test_case_id:", testcase_id);
          handleInsert(numericId);
        }
      );
    } else {
      // It's already numeric
      handleInsert(parseInt(testcase_id));
    }
  }
);


// ================= GET EXECUTIONS =================
const getExecutionsHandler = (req, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const params = [];
  let whereClause = '';

  // Add assignment filter for testers and developers
  // Filter executions based on testcase assignment
  if (userRole === 'tester' || userRole === 'developer') {
    whereClause = `
      WHERE executions.id IN (
        SELECT e.id FROM executions e
        INNER JOIN testcases t ON e.testcase_id = t.id
        WHERE t.assigned_to = ?
      )
    `;
    params.push(userId);
  }

  const sql = `SELECT * FROM executions ${whereClause} ORDER BY id DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("🔴 Executions GET Error:", err.message, err.code);
      return res.status(500).json({
        error: "Fetch failed",
        details: err.message
      });
    }

    console.log(`✅ User ${userId} (${userRole}) fetched ${results?.length || 0} executions`);
    res.json(results);
  });
};

// Support both singular and plural routes
router.get("/execution", authMiddleware, getExecutionsHandler);
router.get("/executions", authMiddleware, getExecutionsHandler);


// ================= START EXECUTION RUN (With Steps) =================
router.post(
  "/execution-run/start",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    let { testcase_id, project_id } = req.body;
    const userId = req.user?.id;

    console.log("📋 Execution run start received:", { testcase_id, project_id });

    if (!testcase_id) {
      return res.status(400).json({ error: "Testcase ID required" });
    }

    // Helper function to execute with numeric TC ID
    const proceedWithExecution = (numericTestcaseId) => {
      // Get testcase to extract steps
      db.query(
        "SELECT test_steps FROM testcases WHERE id = ?",
        [numericTestcaseId],
        (err, results) => {
          if (err || !results.length) {
            console.error("❌ Testcase not found:", numericTestcaseId, err);
            return res.status(404).json({ error: "Testcase not found" });
          }

          const testcaseData = results[0];
          let steps = [];

          try {
            if (testcaseData.test_steps) {
              const parsed = typeof testcaseData.test_steps === 'string' 
                ? JSON.parse(testcaseData.test_steps) 
                : testcaseData.test_steps;
              steps = Array.isArray(parsed) ? parsed : [];
            }
          } catch (e) {
            console.log('Error parsing test steps:', e);
          }

          console.log("✅ Found testcase with", steps.length, "steps");

          // Create execution run
          db.query(
            "INSERT INTO execution_runs (testcase_id, tester_id, project_id, status) VALUES (?, ?, ?, 'pending')",
            [numericTestcaseId, userId, project_id || null],
            (insertErr, runResult) => {
              if (insertErr) {
                console.error("❌ Failed to create execution run:", insertErr);
                return res.status(500).json({ error: "Failed to start execution" });
              }

              const runId = runResult.insertId;
              console.log("✅ Created execution run #" + runId + " for testcase_id:", numericTestcaseId);

              // Insert execution steps
              if (steps.length > 0) {
                const stepValues = steps.map((step, idx) => [
                  runId,
                  idx + 1,
                  step.action || step.step_number || `Step ${idx + 1}`,
                  step.expectedResult || step.expected_result || null,
                  'pending'
                ]);

                const sql = "INSERT INTO execution_steps (execution_run_id, step_number, step_action, step_expected, status) VALUES ?";
                db.query(sql, [stepValues], (stepErr) => {
                  if (stepErr) {
                    console.log('Error inserting steps:', stepErr);
                  }

                  res.json({
                    message: "Execution run started",
                    execution_run_id: runId,
                    testcase_id: numericTestcaseId,
                    steps: steps.length,
                    test_steps: steps
                  });
                });
              } else {
                res.json({
                  message: "Execution run started",
                  execution_run_id: runId,
                  testcase_id: numericTestcaseId,
                  steps: 0,
                  test_steps: []
                });
              }
            }
          );
        }
      );
    };

    // Check if testcase_id is numeric or string (like TC-1, TC-2026-001, or just 1)
    if (isNaN(testcase_id)) {
      // It's a string - could be TC-1, TC-2026-001, or partial match
      console.log("🔍 Looking up numeric ID for test_case_id:", testcase_id);
      
      // Build flexible WHERE clause
      let whereClause = "test_case_id = ?";
      let params = [testcase_id];
      
      // Also try matching if they entered a partial ID like "TC-1"
      if (testcase_id.toUpperCase().startsWith("TC-")) {
        // User entered TC-1, also check for TC-YYYY-00001 format
        const parts = testcase_id.split("-");
        if (parts.length === 2) {
          // TC-1 format - look for any test_case_id that ends with the number
          whereClause += ` OR test_case_id LIKE ? OR CONCAT('TC-', id) = ?`;
          params.push(`%-${parts[1]}`, testcase_id);
        }
      } else if (!isNaN(testcase_id)) {
        // Just a number, look for it
        whereClause += ` OR id = ? OR CONCAT('TC-', id) = ?`;
        params.push(parseInt(testcase_id), `TC-${testcase_id}`);
      }
      
      db.query(
        `SELECT id, test_case_id FROM testcases WHERE ${whereClause} LIMIT 1`,
        params,
        (err, results) => {
          if (err) {
            console.error("❌ Error querying testcase:", err.message);
            return res.status(500).json({ error: "Database error", details: err.message });
          }
          
          if (!results || results.length === 0) {
            // Debug: get all testcase IDs
            console.log("❌ Test case not found:", testcase_id);
            db.query("SELECT id, test_case_id FROM testcases LIMIT 10", (debugErr, debugResults) => {
              if (!debugErr && debugResults) {
                console.log("📝 Available test cases:", debugResults.map(r => `${r.id}:${r.test_case_id}`).join(", "));
              }
            });
            return res.status(404).json({
              error: "Test case not found",
              details: `Test case '${testcase_id}' not found. Try entering the full test case ID like 'TC-2026-00001' or just the numeric ID.`
            });
          }
          const numericId = results[0].id;
          console.log("✅ Found numeric ID:", numericId, "for test_case_id:", results[0].test_case_id);
          proceedWithExecution(numericId);
        }
      );
    } else {
      // It's already numeric
      console.log("📌 Using numeric testcase_id:", parseInt(testcase_id));
      proceedWithExecution(parseInt(testcase_id));
    }
  }
);


// ================= GET EXECUTION RUN WITH STEPS =================
router.get(
  "/execution-run/:runId",
  authMiddleware,
  (req, res) => {
    const { runId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    db.query(
      "SELECT * FROM execution_runs WHERE id = ?",
      [runId],
      (err, runResults) => {
        if (err || !runResults.length) {
          return res.status(404).json({ error: "Execution run not found" });
        }

        const run = runResults[0];

        // Check access: admins can see all, others only see assigned
        if (userRole !== 'admin') {
          // Check if testcase is assigned to user
          db.query(
            "SELECT assigned_to FROM testcases WHERE id = ?",
            [run.testcase_id],
            (checkErr, checkResults) => {
              if (checkErr || !checkResults.length || checkResults[0].assigned_to !== userId) {
                return res.status(403).json({ error: "Access denied. You can only view execution runs for your assigned testcases." });
              }

              // User has access, fetch steps
              db.query(
                "SELECT * FROM execution_steps WHERE execution_run_id = ? ORDER BY step_number",
                [runId],
                (stepsErr, steps) => {
                  if (stepsErr) {
                    return res.status(500).json({ error: "Failed to fetch steps" });
                  }

                  console.log(`✅ User ${userId} (${userRole}) fetched execution run ${runId}`);
                  res.json({
                    ...run,
                    steps: steps || []
                  });
                }
              );
            }
          );
        } else {
          // Admin can see all
          db.query(
            "SELECT * FROM execution_steps WHERE execution_run_id = ? ORDER BY step_number",
            [runId],
            (stepsErr, steps) => {
              if (stepsErr) {
                return res.status(500).json({ error: "Failed to fetch steps" });
              }

              console.log(`✅ Admin ${userId} fetched execution run ${runId}`);
              res.json({
                ...run,
                steps: steps || []
              });
            }
          );
        }
      }
    );
  }
);


// ================= UPDATE EXECUTION STEP =================
router.put(
  "/execution-step/:stepId",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const { stepId } = req.params;
    const { status, actual_result, notes } = req.body;

    if (!status || !['pass', 'fail', 'pending', 'skipped'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updateTime = status !== 'pending' ? new Date() : null;

    db.query(
      "UPDATE execution_steps SET status = ?, actual_result = ?, notes = ?, end_time = ? WHERE id = ?",
      [status, actual_result || null, notes || null, updateTime, stepId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to update step" });
        }

        res.json({ message: "Step updated successfully" });
      }
    );
  }
);


// ================= END EXECUTION RUN =================
router.post(
  "/execution-run/:runId/end",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const { runId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status required" });
    }

    const endTime = new Date();

    // Get start time to calculate duration
    db.query(
      "SELECT start_time FROM execution_runs WHERE id = ?",
      [runId],
      (err, results) => {
        if (err || !results.length) {
          return res.status(404).json({ error: "Execution run not found" });
        }

        const startTime = new Date(results[0].start_time);
        const durationSeconds = Math.floor((endTime - startTime) / 1000);

        db.query(
          "UPDATE execution_runs SET status = ?, end_time = ?, duration_seconds = ? WHERE id = ?",
          [status, endTime, durationSeconds, runId],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ error: "Failed to end execution" });
            }

            res.json({
              message: "Execution completed",
              duration_seconds: durationSeconds
            });
          }
        );
      }
    );
  }
);


// ================= GET EXECUTION RUNS FOR COMPARISON =================
router.get(
  "/execution-runs/testcase/:testcaseId",
  authMiddleware,
  (req, res) => {
    let { testcaseId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    console.log("🔍 Fetching execution runs for testcase:", testcaseId);

    // Function to query execution runs with numeric testcase ID
    const queryExecutionRuns = (numericTestcaseId) => {
      // Check access: verify user has access to this testcase
      const checkAccessQuery = userRole === 'admin' 
        ? "SELECT id FROM testcases WHERE id = ?"
        : "SELECT id FROM testcases WHERE id = ? AND assigned_to = ?";
      
      const checkParams = userRole === 'admin' 
        ? [numericTestcaseId]
        : [numericTestcaseId, userId];

      db.query(checkAccessQuery, checkParams, (checkErr, checkResults) => {
        if (checkErr || !checkResults.length) {
          return res.status(403).json({ error: "Access denied. You can only view execution runs for your assigned testcases." });
        }

        // User has access, fetch execution runs
        db.query(
          "SELECT * FROM execution_runs WHERE testcase_id = ? ORDER BY created_at DESC",
          [numericTestcaseId],
          (err, results) => {
            if (err) {
              console.error("❌ Error fetching execution runs:", err);
              return res.status(500).json({ error: "Failed to fetch execution runs" });
            }

            console.log(`✅ User ${userId} (${userRole}) found ${results.length} execution runs for testcase ID: ${numericTestcaseId}`);
            res.json(results || []);
          }
        );
      });
    };

    // Check if testcase_id is numeric or string
    if (isNaN(testcaseId)) {
      // It's a string like 'TC-20', need to look up the numeric ID
      console.log("🔍 Looking up numeric ID for test_case_id:", testcaseId);
      
      // Build flexible WHERE clause
      let whereClause = "test_case_id = ?";
      let params = [testcaseId];
      
      // Also try matching if they entered a partial ID like "TC-1"
      if (testcaseId.toUpperCase().startsWith("TC-")) {
        const parts = testcaseId.split("-");
        if (parts.length === 2) {
          // TC-1 format - look for any test_case_id that ends with the number
          whereClause += ` OR test_case_id LIKE ? OR CONCAT('TC-', id) = ?`;
          params.push(`%-${parts[1]}`, testcaseId);
        }
      }
      
      db.query(
        `SELECT id FROM testcases WHERE ${whereClause} LIMIT 1`,
        params,
        (err, results) => {
          if (err || !results || results.length === 0) {
            console.error("❌ Test case not found:", testcaseId);
            return res.status(404).json({
              error: "Test case not found",
              details: `Test case '${testcaseId}' not found.`
            });
          }
          const numericId = results[0].id;
          console.log("✅ Found numeric ID:", numericId, "for test_case_id:", testcaseId);
          queryExecutionRuns(numericId);
        }
      );
    } else {
      // It's already numeric
      console.log("📌 Using numeric testcase_id:", parseInt(testcaseId));
      queryExecutionRuns(parseInt(testcaseId));
    }
  }
);


// ================= COMPARE TWO EXECUTION RUNS =================
router.get(
  "/execution-runs/compare/:runId1/:runId2",
  authMiddleware,
  (req, res) => {
    const { runId1, runId2 } = req.params;

    // Get both runs with their steps
    Promise.all([
      new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM execution_runs WHERE id = ?",
          [runId1],
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
          }
        );
      }),
      new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM execution_steps WHERE execution_run_id = ? ORDER BY step_number",
          [runId1],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      }),
      new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM execution_runs WHERE id = ?",
          [runId2],
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
          }
        );
      }),
      new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM execution_steps WHERE execution_run_id = ? ORDER BY step_number",
          [runId2],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      })
    ])
      .then(([run1, steps1, run2, steps2]) => {
        res.json({
          run1: { ...run1, steps: steps1 },
          run2: { ...run2, steps: steps2 },
          comparison: {
            statusChanged: run1.status !== run2.status,
            durationDiff: (run2.duration_seconds || 0) - (run1.duration_seconds || 0),
            stepsDiff: (steps2.length) - (steps1.length)
          }
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: "Comparison failed" });
      });
  }
);


module.exports = router;
