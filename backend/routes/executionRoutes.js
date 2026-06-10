const express = require("express");
const router = express.Router();
const db = require("../config/db");

const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { getAssignmentFilter } = require("../middleware/assignmentMiddleware");

const logAuditEvent = (userId, action, details, targetType, targetId) => {
  const sql = `
    INSERT INTO audit_logs (user_id, action, details, target_type, target_id, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  db.query(sql, [userId, action, JSON.stringify(details), targetType, targetId]);
};


// ================= EXECUTE TESTCASE =================
router.post(
  "/execution",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    let { testcase_id, status, notes, project_id } = req.body;

    if (!testcase_id || !status) {
      return res.status(400).json({ error: "Testcase ID and status required" });
    }

    const handleInsert = (numericTestcaseId) => {
      db.query(
        "INSERT INTO executions (testcase_id, status, notes, project_id) VALUES (?, ?, ?, ?)",
        [numericTestcaseId, status, notes || null, project_id || null],
        (err, result) => {
          if (err) {
            console.error("🔴 Execution insert error:", err.message);
            return res.status(500).json({ error: "Execution failed", details: err.message });
          }

          logAuditEvent(req.user.id, "TESTCASE_EXECUTED", { testcase_id: numericTestcaseId, status }, "execution", result.insertId);
          res.json({ message: "Execution recorded", id: result.insertId });
        }
      );
    };

    if (isNaN(testcase_id)) {
      let whereClause = "test_case_id = ?";
      let params = [testcase_id];

      if (testcase_id.toUpperCase().startsWith("TC-")) {
        const parts = testcase_id.split("-");
        if (parts.length === 2) {
          whereClause += ` OR test_case_id LIKE ? OR CONCAT('TC-', id) = ?`;
          params.push(`%-${parts[1]}`, testcase_id);
        }
      }

      db.query(`SELECT id FROM testcases WHERE ${whereClause} LIMIT 1`, params, (err, results) => {
        if (err || !results || results.length === 0) {
          return res.status(404).json({ error: "Test case not found", details: `Test case '${testcase_id}' not found.` });
        }
        handleInsert(results[0].id);
      });
    } else {
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

  // ✅ FIX: Filter executions by testcases where user is assigned_to OR created_by
  // Previously only checked assigned_to — if NULL, developer saw 0 executions
  if (userRole === 'tester' || userRole === 'developer') {
    whereClause = `
      WHERE executions.testcase_id IN (
        SELECT id FROM testcases
        WHERE assigned_to = ? OR created_by = ?
      )
    `;
    params.push(userId, userId);
  }

  const sql = `SELECT * FROM executions ${whereClause} ORDER BY id DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("🔴 Executions GET Error:", err.message);
      return res.status(500).json({ error: "Fetch failed", details: err.message });
    }

    console.log(`✅ User ${userId} (${userRole}) fetched ${results?.length || 0} executions`);
    res.json(results);
  });
};

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

    if (!testcase_id) {
      return res.status(400).json({ error: "Testcase ID required" });
    }

    const proceedWithExecution = (numericTestcaseId) => {
      db.query("SELECT test_steps FROM testcases WHERE id = ?", [numericTestcaseId], (err, results) => {
        if (err || !results.length) {
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

        db.query(
          "INSERT INTO execution_runs (testcase_id, tester_id, project_id, status) VALUES (?, ?, ?, 'pending')",
          [numericTestcaseId, userId, project_id || null],
          (insertErr, runResult) => {
            if (insertErr) {
              console.error("❌ Failed to create execution run:", insertErr);
              return res.status(500).json({ error: "Failed to start execution" });
            }

            const runId = runResult.insertId;

            if (steps.length > 0) {
              const stepValues = steps.map((step, idx) => [
                runId, idx + 1,
                step.action || step.step_number || `Step ${idx + 1}`,
                step.expectedResult || step.expected_result || null,
                'pending'
              ]);

              db.query(
                "INSERT INTO execution_steps (execution_run_id, step_number, step_action, step_expected, status) VALUES ?",
                [stepValues],
                (stepErr) => {
                  if (stepErr) console.log('Error inserting steps:', stepErr);
                  res.json({ message: "Execution run started", execution_run_id: runId, testcase_id: numericTestcaseId, steps: steps.length, test_steps: steps });
                }
              );
            } else {
              res.json({ message: "Execution run started", execution_run_id: runId, testcase_id: numericTestcaseId, steps: 0, test_steps: [] });
            }
          }
        );
      });
    };

    if (isNaN(testcase_id)) {
      let whereClause = "test_case_id = ?";
      let params = [testcase_id];

      if (testcase_id.toUpperCase().startsWith("TC-")) {
        const parts = testcase_id.split("-");
        if (parts.length === 2) {
          whereClause += ` OR test_case_id LIKE ? OR CONCAT('TC-', id) = ?`;
          params.push(`%-${parts[1]}`, testcase_id);
        }
      }

      db.query(`SELECT id, test_case_id FROM testcases WHERE ${whereClause} LIMIT 1`, params, (err, results) => {
        if (err || !results || results.length === 0) {
          return res.status(404).json({ error: "Test case not found", details: `Test case '${testcase_id}' not found.` });
        }
        proceedWithExecution(results[0].id);
      });
    } else {
      proceedWithExecution(parseInt(testcase_id));
    }
  }
);


// ================= GET EXECUTION RUN WITH STEPS =================
router.get("/execution-run/:runId", authMiddleware, (req, res) => {
  const { runId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  db.query("SELECT * FROM execution_runs WHERE id = ?", [runId], (err, runResults) => {
    if (err || !runResults.length) {
      return res.status(404).json({ error: "Execution run not found" });
    }

    const run = runResults[0];

    const fetchSteps = () => {
      db.query(
        "SELECT * FROM execution_steps WHERE execution_run_id = ? ORDER BY step_number",
        [runId],
        (stepsErr, steps) => {
          if (stepsErr) return res.status(500).json({ error: "Failed to fetch steps" });
          res.json({ ...run, steps: steps || [] });
        }
      );
    };

    if (userRole !== 'admin') {
      // ✅ FIX: Allow access if assigned_to OR created_by matches
      db.query(
        "SELECT assigned_to, created_by FROM testcases WHERE id = ?",
        [run.testcase_id],
        (checkErr, checkResults) => {
          if (checkErr || !checkResults.length) {
            return res.status(403).json({ error: "Access denied." });
          }
          const tc = checkResults[0];
          if (tc.assigned_to !== userId && tc.created_by !== userId) {
            return res.status(403).json({ error: "Access denied. You can only view execution runs for your assigned testcases." });
          }
          fetchSteps();
        }
      );
    } else {
      fetchSteps();
    }
  });
});


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
        if (err) return res.status(500).json({ error: "Failed to update step" });
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

    if (!status) return res.status(400).json({ error: "Status required" });

    const endTime = new Date();

    db.query("SELECT start_time FROM execution_runs WHERE id = ?", [runId], (err, results) => {
      if (err || !results.length) {
        return res.status(404).json({ error: "Execution run not found" });
      }

      const startTime = new Date(results[0].start_time);
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      db.query(
        "UPDATE execution_runs SET status = ?, end_time = ?, duration_seconds = ? WHERE id = ?",
        [status, endTime, durationSeconds, runId],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: "Failed to end execution" });

          logAuditEvent(req.user.id, "EXECUTION_COMPLETED", { run_id: runId, status, duration_seconds: durationSeconds }, "execution_run", runId);
          res.json({ message: "Execution completed", duration_seconds: durationSeconds });
        }
      );
    });
  }
);


// ================= GET EXECUTION RUNS FOR TESTCASE =================
router.get("/execution-runs/testcase/:testcaseId", authMiddleware, (req, res) => {
  let { testcaseId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const queryExecutionRuns = (numericTestcaseId) => {
    // ✅ FIX: Allow access if assigned_to OR created_by matches
    const checkAccessQuery = userRole === 'admin'
      ? "SELECT id FROM testcases WHERE id = ?"
      : "SELECT id FROM testcases WHERE id = ? AND (assigned_to = ? OR created_by = ?)";

    const checkParams = userRole === 'admin'
      ? [numericTestcaseId]
      : [numericTestcaseId, userId, userId];

    db.query(checkAccessQuery, checkParams, (checkErr, checkResults) => {
      if (checkErr || !checkResults.length) {
        return res.status(403).json({ error: "Access denied." });
      }

      db.query(
        "SELECT * FROM execution_runs WHERE testcase_id = ? ORDER BY created_at DESC",
        [numericTestcaseId],
        (err, results) => {
          if (err) return res.status(500).json({ error: "Failed to fetch execution runs" });
          res.json(results || []);
        }
      );
    });
  };

  if (isNaN(testcaseId)) {
    let whereClause = "test_case_id = ?";
    let params = [testcaseId];

    if (testcaseId.toUpperCase().startsWith("TC-")) {
      const parts = testcaseId.split("-");
      if (parts.length === 2) {
        whereClause += ` OR test_case_id LIKE ? OR CONCAT('TC-', id) = ?`;
        params.push(`%-${parts[1]}`, testcaseId);
      }
    }

    db.query(`SELECT id FROM testcases WHERE ${whereClause} LIMIT 1`, params, (err, results) => {
      if (err || !results || results.length === 0) {
        return res.status(404).json({ error: "Test case not found" });
      }
      queryExecutionRuns(results[0].id);
    });
  } else {
    queryExecutionRuns(parseInt(testcaseId));
  }
});


// ================= PROJECT EXECUTION =================
router.post(
  "/execution/project",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    const { executions, project_id } = req.body;

    if (!executions || executions.length === 0) {
      return res.status(400).json({ error: "No executions provided" });
    }

    const values = executions.map(item => [item.testcase_id, item.status, item.notes || null, project_id]);

    db.query(
      `INSERT INTO executions (testcase_id, status, notes, project_id) VALUES ?`,
      [values],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Execution failed" });
        }

        logAuditEvent(req.user.id, "PROJECT_EXECUTION", { project_id, count: executions.length }, "project", project_id);
        res.json({ message: "Project execution saved", count: result.affectedRows });
      }
    );
  }
);


// ================= COMPARE TWO EXECUTION RUNS =================
router.get("/execution-runs/compare/:runId1/:runId2", authMiddleware, (req, res) => {
  const { runId1, runId2 } = req.params;

  Promise.all([
    new Promise((resolve, reject) => {
      db.query("SELECT * FROM execution_runs WHERE id = ?", [runId1], (err, results) => {
        if (err) reject(err); else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT * FROM execution_steps WHERE execution_run_id = ? ORDER BY step_number", [runId1], (err, results) => {
        if (err) reject(err); else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT * FROM execution_runs WHERE id = ?", [runId2], (err, results) => {
        if (err) reject(err); else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT * FROM execution_steps WHERE execution_run_id = ? ORDER BY step_number", [runId2], (err, results) => {
        if (err) reject(err); else resolve(results);
      });
    })
  ])
    .then(([run1, steps1, run2, steps2]) => {
      res.json({
        run1: { ...run1, steps: steps1 },
        run2: { ...run2, steps: steps2 },
        comparison: {
          statusChanged: run1.status !== run2.status,
          durationDiff: (run2.duration_seconds || 0) - (run1.duration_seconds || 0),
          stepsDiff: steps2.length - steps1.length
        }
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Comparison failed" });
    });
});


module.exports = router;