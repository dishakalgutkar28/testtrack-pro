/**
 * Test Suite Routes
 * Handle test suite management - create, read, update, delete test suites
 * and manage test case associations
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const logger = require("../utils/logger");

/**
 * @route   GET /api/test-suites
 * @desc    Get all test suites
 * @access  Private (Tester, Developer, Admin)
 */
router.get("/test-suites", authMiddleware, (req, res) => {
  const { project_id } = req.query;
  
  let sql = `
    SELECT 
      ts.*,
      COUNT(DISTINCT stc.testcase_id) as test_case_count,
      u.email as created_by_email
    FROM test_suites ts
    LEFT JOIN suite_testcases stc ON ts.id = stc.suite_id
    LEFT JOIN users u ON ts.created_by = u.id
    WHERE ts.is_deleted = FALSE
  `;
  
  const params = [];
  
  if (project_id) {
    sql += ` AND ts.project_id = ?`;
    params.push(project_id);
  }
  
  sql += ` GROUP BY ts.id ORDER BY ts.created_at DESC`;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      logger.error("Error fetching test suites", { error: err });
      return res.status(500).json({ error: "Failed to fetch test suites" });
    }
    
    res.json({ success: true, suites: results });
  });
});

/**
 * @route   GET /api/test-suites/:id
 * @desc    Get single test suite with test cases
 * @access  Private
 */
router.get("/test-suites/:id", authMiddleware, (req, res) => {
  const suiteId = req.params.id;
  
  // Get suite details
  const suiteSql = `
    SELECT 
      ts.*,
      u.email as created_by_email,
      COUNT(DISTINCT stc.testcase_id) as test_case_count
    FROM test_suites ts
    LEFT JOIN suite_testcases stc ON ts.id = stc.suite_id
    LEFT JOIN users u ON ts.created_by = u.id
    WHERE ts.id = ? AND ts.is_deleted = FALSE
    GROUP BY ts.id
  `;
  
  db.query(suiteSql, [suiteId], (err, suiteResults) => {
    if (err) {
      logger.error("Error fetching test suite", { error: err, suiteId });
      return res.status(500).json({ error: "Failed to fetch test suite" });
    }
    
    if (suiteResults.length === 0) {
      return res.status(404).json({ error: "Test suite not found" });
    }
    
    const suite = suiteResults[0];
    
    // Get test cases in suite
    const testcasesSql = `
      SELECT 
        tc.*,
        stc.order_index,
        u.email as created_by_email
      FROM suite_testcases stc
      JOIN testcases tc ON stc.testcase_id = tc.id
      LEFT JOIN users u ON tc.created_by = u.id
      WHERE stc.suite_id = ?
      ORDER BY stc.order_index ASC, tc.id ASC
    `;
    
    db.query(testcasesSql, [suiteId], (err2, testcases) => {
      if (err2) {
        logger.error("Error fetching suite test cases", { error: err2, suiteId });
        return res.status(500).json({ error: "Failed to fetch test cases" });
      }
      
      suite.testcases = testcases;
      res.json({ success: true, suite });
    });
  });
});

/**
 * @route   POST /api/test-suites
 * @desc    Create new test suite
 * @access  Private (Tester, Admin)
 */
router.post(
  "/test-suites",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    const { name, description, project_id, parent_suite_id, testcase_ids } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ error: "Suite name is required" });
    }
    
    // Create suite
    const insertSql = `
      INSERT INTO test_suites 
      (name, description, project_id, parent_suite_id, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    db.query(
      insertSql,
      [name, description || null, project_id || null, parent_suite_id || null, userId],
      (err, result) => {
        if (err) {
          logger.error("Error creating test suite", { error: err, name });
          return res.status(500).json({ error: "Failed to create test suite" });
        }
        
        const suiteId = result.insertId;
        
        // Add test cases if provided
        if (testcase_ids && Array.isArray(testcase_ids) && testcase_ids.length > 0) {
          const values = testcase_ids.map((tcId, index) => 
            `(${suiteId}, ${tcId}, ${index})`
          ).join(',');
          
          const linkSql = `
            INSERT INTO suite_testcases (suite_id, testcase_id, order_index)
            VALUES ${values}
          `;
          
          db.query(linkSql, (err2) => {
            if (err2) {
              logger.warn("Error adding test cases to suite", { error: err2, suiteId });
            }
          });
        }
        
        logger.info("Test suite created", { suiteId, name, userId });
        res.status(201).json({
          success: true,
          message: "Test suite created successfully",
          suite_id: suiteId
        });
      }
    );
  }
);

/**
 * @route   PUT /api/test-suites/:id
 * @desc    Update test suite
 * @access  Private (Tester, Admin)
 */
router.put(
  "/test-suites/:id",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    const suiteId = req.params.id;
    const { name, description, project_id, parent_suite_id } = req.body;
    
    const updateSql = `
      UPDATE test_suites 
      SET name = ?, description = ?, project_id = ?, parent_suite_id = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = FALSE
    `;
    
    db.query(
      updateSql,
      [name, description || null, project_id || null, parent_suite_id || null, suiteId],
      (err, result) => {
        if (err) {
          logger.error("Error updating test suite", { error: err, suiteId });
          return res.status(500).json({ error: "Failed to update test suite" });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Test suite not found" });
        }
        
        logger.info("Test suite updated", { suiteId, name });
        res.json({ success: true, message: "Test suite updated successfully" });
      }
    );
  }
);

/**
 * @route   DELETE /api/test-suites/:id
 * @desc    Delete test suite (soft delete)
 * @access  Private (Tester, Admin)
 */
router.delete(
  "/test-suites/:id",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    const suiteId = req.params.id;
    
    const deleteSql = `
      UPDATE test_suites 
      SET is_deleted = TRUE, deleted_at = NOW()
      WHERE id = ?
    `;
    
    db.query(deleteSql, [suiteId], (err, result) => {
      if (err) {
        logger.error("Error deleting test suite", { error: err, suiteId });
        return res.status(500).json({ error: "Failed to delete test suite" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Test suite not found" });
      }
      
      logger.info("Test suite deleted", { suiteId });
      res.json({ success: true, message: "Test suite deleted successfully" });
    });
  }
);

/**
 * @route   POST /api/test-suites/:id/testcases
 * @desc    Add test cases to suite
 * @access  Private (Tester, Admin)
 */
router.post(
  "/test-suites/:id/testcases",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    const suiteId = req.params.id;
    const { testcase_ids } = req.body;
    
    if (!testcase_ids || !Array.isArray(testcase_ids) || testcase_ids.length === 0) {
      return res.status(400).json({ error: "Test case IDs array required" });
    }
    
    // Get current max order
    const maxOrderSql = `
      SELECT COALESCE(MAX(order_index), -1) as max_order
      FROM suite_testcases
      WHERE suite_id = ?
    `;
    
    db.query(maxOrderSql, [suiteId], (err, orderResults) => {
      if (err) {
        logger.error("Error getting max order", { error: err });
        return res.status(500).json({ error: "Failed to add test cases" });
      }
      
      let startOrder = orderResults[0].max_order + 1;
      
      const values = testcase_ids.map((tcId, index) => 
        `(${suiteId}, ${tcId}, ${startOrder + index})`
      ).join(',');
      
      const insertSql = `
        INSERT IGNORE INTO suite_testcases (suite_id, testcase_id, order_index)
        VALUES ${values}
      `;
      
      db.query(insertSql, (err2, result) => {
        if (err2) {
          logger.error("Error adding test cases to suite", { error: err2, suiteId });
          return res.status(500).json({ error: "Failed to add test cases" });
        }
        
        logger.info("Test cases added to suite", { suiteId, count: result.affectedRows });
        res.json({
          success: true,
          message: `${result.affectedRows} test case(s) added to suite`
        });
      });
    });
  }
);

/**
 * @route   DELETE /api/test-suites/:id/testcases/:testcaseId
 * @desc    Remove test case from suite
 * @access  Private (Tester, Admin)
 */
router.delete(
  "/test-suites/:id/testcases/:testcaseId",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const { id: suiteId, testcaseId } = req.params;
    
    const deleteSql = `
      DELETE FROM suite_testcases
      WHERE suite_id = ? AND testcase_id = ?
    `;
    
    db.query(deleteSql, [suiteId, testcaseId], (err, result) => {
      if (err) {
        logger.error("Error removing test case from suite", { error: err, suiteId, testcaseId });
        return res.status(500).json({ error: "Failed to remove test case" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Test case not found in suite" });
      }
      
      logger.info("Test case removed from suite", { suiteId, testcaseId });
      res.json({ success: true, message: "Test case removed from suite" });
    });
  }
);

/**
 * @route   PUT /api/test-suites/:id/reorder
 * @desc    Reorder test cases within suite
 * @access  Private (Tester, Admin)
 */
router.put(
  "/test-suites/:id/reorder",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const suiteId = req.params.id;
    const testcase_order = req.body.testcase_order || req.body.test_cases; // Array of { testcase_id, order_index }
    
    if (!testcase_order || !Array.isArray(testcase_order)) {
      return res.status(400).json({ error: "Test case order array required" });
    }
    
    // Build bulk update
    const updatePromises = testcase_order.map(({ testcase_id, order_index }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          UPDATE suite_testcases
          SET order_index = ?
          WHERE suite_id = ? AND testcase_id = ?
        `;
        
        db.query(sql, [order_index, suiteId, testcase_id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    });
    
    Promise.all(updatePromises)
      .then(() => {
        logger.info("Suite test cases reordered", { suiteId });
        res.json({ success: true, message: "Test cases reordered successfully" });
      })
      .catch((err) => {
        logger.error("Error reordering test cases", { error: err, suiteId });
        res.status(500).json({ error: "Failed to reorder test cases" });
      });
  }
);

/**
 * @route   POST /api/test-suites/:id/clone
 * @desc    Clone test suite with all test cases
 * @access  Private (Tester, Admin)
 */
router.post(
  "/test-suites/:id/clone",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const suiteId = req.params.id;
    const userId = req.user.id;
    
    // Get original suite
    const getSuiteSql = `
      SELECT * FROM test_suites
      WHERE id = ? AND is_deleted = FALSE
    `;
    
    db.query(getSuiteSql, [suiteId], (err, suiteResults) => {
      if (err || suiteResults.length === 0) {
        return res.status(404).json({ error: "Test suite not found" });
      }
      
      const originalSuite = suiteResults[0];
      const newName = `COPY - ${originalSuite.name}`;
      
      // Create new suite
      const insertSql = `
        INSERT INTO test_suites 
        (name, description, project_id, parent_suite_id, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      db.query(
        insertSql,
        [newName, originalSuite.description, originalSuite.project_id, originalSuite.parent_suite_id, userId],
        (err2, insertResult) => {
          if (err2) {
            logger.error("Error cloning test suite", { error: err2, suiteId });
            return res.status(500).json({ error: "Failed to clone test suite" });
          }
          
          const newSuiteId = insertResult.insertId;
          
          // Copy test case associations
          const copyTestcasesSql = `
            INSERT INTO suite_testcases (suite_id, testcase_id, order_index)
            SELECT ?, testcase_id, order_index
            FROM suite_testcases
            WHERE suite_id = ?
          `;
          
          db.query(copyTestcasesSql, [newSuiteId, suiteId], (err3) => {
            if (err3) {
              logger.warn("Error copying test cases to cloned suite", { error: err3, newSuiteId });
            }
            
            logger.info("Test suite cloned", { originalSuiteId: suiteId, newSuiteId });
            res.status(201).json({
              success: true,
              message: "Test suite cloned successfully",
              suite_id: newSuiteId
            });
          });
        }
      );
    });
  }
);

/**
 * @route   POST /api/test-suites/:id/execute
 * @desc    Execute a test suite (create execution record)
 * @access  Private
 */
router.post("/test-suites/:id/execute", authMiddleware, (req, res) => {
  const suiteId = req.params.id;
  const userId = req.user?.id;
  const { notes, environment } = req.body;

  // Get test cases in the suite
  const getTestCasesSql = `
    SELECT COUNT(*) as total_count
    FROM suite_testcases
    WHERE suite_id = ?
  `;

  db.query(getTestCasesSql, [suiteId], (err, results) => {
    if (err) {
      logger.error("Error getting suite test cases", { error: err, suiteId });
      return res.status(500).json({ error: "Failed to count test cases" });
    }

    const totalTestcases = results[0].total_count;

    if (totalTestcases === 0) {
      return res.status(400).json({ error: "Suite has no test cases to execute" });
    }

    // Create execution record
    const createExecutionSql = `
      INSERT INTO suite_executions 
      (suite_id, executed_by, status, total_testcases, notes, environment, start_time)
      VALUES (?, ?, 'completed', ?, ?, ?, NOW())
    `;

    db.query(
      createExecutionSql,
      [suiteId, userId, totalTestcases, notes || null, environment || 'development'],
      (err2, result) => {
        if (err2) {
          logger.error("Error creating suite execution", { error: err2, suiteId });
          return res.status(500).json({ error: "Failed to create execution record" });
        }

        logger.info("Suite execution created", { suiteId, executionId: result.insertId, userId });
        
        res.status(201).json({
          success: true,
          message: "Suite execution started",
          execution_id: result.insertId,
          total_testcases: totalTestcases
        });
      }
    );
  });
});

/**
 * @route   GET /api/test-suites/:id/executions
 * @desc    Get execution history for a test suite
 * @access  Private
 */
router.get("/test-suites/:id/executions", authMiddleware, (req, res) => {
  const suiteId = req.params.id;

  const sql = `
    SELECT 
      se.*,
      CASE
        WHEN COALESCE(se.failed_testcases, 0) > 0 AND COALESCE(se.passed_testcases, 0) > 0 THEN 'partial'
        WHEN COALESCE(se.failed_testcases, 0) > 0 THEN 'failed'
        WHEN COALESCE(se.passed_testcases, 0) > 0 THEN 'completed'
        ELSE se.status
      END as overall_status,
      u.email as executed_by_name
    FROM suite_executions se
    LEFT JOIN users u ON se.executed_by = u.id
    WHERE se.suite_id = ?
    ORDER BY se.start_time DESC
    LIMIT 20
  `;

  db.query(sql, [suiteId], (err, results) => {
    if (err) {
      logger.error("Error fetching suite executions", { error: err, suiteId });
      return res.status(500).json({ error: "Failed to fetch executions" });
    }

    res.json({ success: true, executions: results });
  });
});

/**
 * @route   DELETE /api/test-suites/:id/executions/:executionId
 * @desc    Delete a single execution history record for a suite
 * @access  Private (Tester, Admin)
 */
router.delete(
  "/test-suites/:id/executions/:executionId",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const { id: suiteId, executionId } = req.params;

    const deleteSql = `
      DELETE FROM suite_executions
      WHERE id = ? AND suite_id = ?
    `;

    db.query(deleteSql, [executionId, suiteId], (err, result) => {
      if (err) {
        logger.error("Error deleting suite execution", { error: err, suiteId, executionId });
        return res.status(500).json({ error: "Failed to delete execution history" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Execution history record not found" });
      }

      logger.info("Suite execution deleted", { suiteId, executionId });
      return res.json({ success: true, message: "Execution history deleted successfully" });
    });
  }
);

/**
 * @route   GET /api/test-suites/:id/execution/:executionId
 * @desc    Get execution details with steps for execution mode
 * @access  Private
 */
router.get("/test-suites/:id/execution/:executionId", authMiddleware, (req, res) => {
  const { id: suiteId, executionId } = req.params;

  const sql = `
    SELECT 
      se.*,
      ts.name as suite_name,
      ts.description as suite_description
    FROM suite_executions se
    JOIN test_suites ts ON se.suite_id = ts.id
    WHERE se.id = ? AND se.suite_id = ?
  `;

  db.query(sql, [executionId, suiteId], (err, execResults) => {
    if (err || !execResults.length) {
      logger.error("Error fetching execution", { error: err, executionId });
      return res.status(404).json({ error: "Execution not found" });
    }

    const execution = execResults[0];

    // Get test cases in the suite with their steps
    const testcasesSql = `
      SELECT 
        tc.id,
        tc.title,
        tc.description,
        GROUP_CONCAT(
          CASE
            WHEN tstep.step_number IS NOT NULL THEN JSON_OBJECT(
              'step_number', tstep.step_number,
              'action', tstep.action,
              'test_data', tstep.test_data,
              'expected_result', tstep.expected_result
            )
          END
          ORDER BY tstep.step_number SEPARATOR ','
        ) as steps
      FROM suite_testcases st
      JOIN testcases tc ON st.testcase_id = tc.id
      LEFT JOIN test_steps tstep ON tc.id = tstep.testcase_id
      WHERE st.suite_id = ?
      GROUP BY tc.id
      ORDER BY st.order_index, tc.id
    `;

    db.query(testcasesSql, [suiteId], (err2, testcases) => {
      if (err2) {
        logger.error("Error fetching test cases for execution", { error: err2 });
        return res.status(500).json({ error: "Failed to fetch test cases" });
      }

      // Parse steps JSON
      const parsedTestcases = testcases.map(tc => ({
        ...tc,
        steps: tc.steps ? JSON.parse('[' + tc.steps + ']') : []
      }));

      res.json({
        success: true,
        execution,
        testcases: parsedTestcases
      });
    });
  });
});

/**
 * @route   POST /api/test-suites/:id/execute-step
 * @desc    Save execution result for a single test step
 * @access  Private
 */
router.post("/test-suites/:id/execute-step", authMiddleware, (req, res) => {
  const { id: suiteId } = req.params;
  const { executionId, stepNumber, testcaseId, status, actualResult, notes } = req.body;
  const normalizedStepNumber = Number(stepNumber);

  if (!executionId || stepNumber === undefined || stepNumber === null || !testcaseId || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!Number.isInteger(normalizedStepNumber) || normalizedStepNumber < 1) {
    return res.status(400).json({ error: "Invalid step number" });
  }

  if (!['pass', 'fail', 'blocked', 'skipped'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  // Get step details from test_steps table
  const getStepSql = `
    SELECT ts.* FROM test_steps ts
    WHERE ts.testcase_id = ? AND ts.step_number = ?
  `;

  db.query(getStepSql, [testcaseId, normalizedStepNumber], (err, stepResults) => {
    if (err) {
      logger.error("Error fetching step", { error: err, testcaseId, stepNumber: normalizedStepNumber });
      return res.status(500).json({ error: "Failed to fetch step details" });
    }

    // Some test cases can be created without structured test_steps.
    // In that case, still allow recording pass/fail against the requested step number.
    const step = stepResults[0] || {
      action: null,
      test_data: null,
      expected_result: null
    };

    // Save step execution result
    const saveSql = `
      INSERT INTO test_step_executions 
      (execution_id, step_number, action, test_data, expected_result, actual_result, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        actual_result = ?,
        status = ?,
        notes = ?,
        updated_at = NOW()
    `;

    db.query(
      saveSql,
      [
        executionId,
        normalizedStepNumber,
        step.action,
        step.test_data,
        step.expected_result,
        actualResult || null,
        status,
        notes || null,
        actualResult || null,
        status,
        notes || null
      ],
      (err2) => {
        if (err2) {
          logger.error("Error saving step execution", { error: err2 });
          return res.status(500).json({ error: "Failed to save step result" });
        }

        // Update execution totals
        const updateTotalsSql = `
          UPDATE suite_executions se
          SET 
            passed_testcases = (SELECT COUNT(*) FROM test_step_executions WHERE execution_id = ? AND status = 'pass'),
            failed_testcases = (SELECT COUNT(*) FROM test_step_executions WHERE execution_id = ? AND status = 'fail'),
            blocked_testcases = (SELECT COUNT(*) FROM test_step_executions WHERE execution_id = ? AND status = 'blocked'),
            skipped_testcases = (SELECT COUNT(*) FROM test_step_executions WHERE execution_id = ? AND status = 'skipped'),
            status = CASE
              WHEN (SELECT COUNT(*) FROM test_step_executions WHERE execution_id = ? AND status = 'fail') > 0 THEN 'failed'
              ELSE 'completed'
            END,
            end_time = NOW()
          WHERE id = ?
        `;

        db.query(updateTotalsSql, [executionId, executionId, executionId, executionId, executionId, executionId], (err3) => {
          if (err3) {
            logger.error("Error updating execution totals", { error: err3 });
          }

          res.json({
            success: true,
            message: `Step ${normalizedStepNumber} recorded as ${status.toUpperCase()}`
          });
        });
      }
    );
  });
});

module.exports = router;
