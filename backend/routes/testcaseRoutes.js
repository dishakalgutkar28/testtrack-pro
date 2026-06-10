const router = require("express").Router();
const db = require("../config/db");

const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { getAssignmentFilter } = require("../middleware/assignmentMiddleware");
const NotificationService = require("../services/notificationService");
const logger = require("../utils/logger");

const logAuditEvent = (userId, action, details, targetType, targetId) => {
  const sql = `
    INSERT INTO audit_logs (user_id, action, details, target_type, target_id, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  db.query(sql, [userId, action, JSON.stringify(details), targetType, targetId], (err) => {
    if (err) {
      logger.error("Audit log error", { error: err.message, action, targetType, targetId });
    }
  });
};

router.get("/testcase/debug/routes", (req, res) => {
  res.json({
    message: "Testcase routes are loaded",
    endpoints: [
      "POST /testcase",
      "GET /testcase",
      "PUT /testcase/:id",
      "POST /testcase/:id/clone",
      "PUT /testcase/bulk-update",
      "GET /testcase/:id/history"
    ]
  });
});


// ================= CREATE TESTCASE =================
router.post(
  "/testcase",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    const {
      title, description, expected_result, expectedResult,
      projectId, priority, lifecycle_state, preconditions,
      postconditions, testSteps, environmentRequirements,
      estimatedDuration, tags, automationStatus, automationScriptLink,
    } = req.body;

    const userId = req.user?.id;
    const finalExpected = expected_result || expectedResult;
    const finalPriority = priority || 'medium';
    const finalLifecycleState = lifecycle_state || 'Draft';

    if (!title || !description || !finalExpected) {
      return res.status(400).json({ error: "Title, Description & Expected Result required" });
    }

    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const testCaseId = `TC-${year}-${rand}`;

    const sql = `
      INSERT INTO testcases
      (test_case_id, title, description, expected_result, project_id, priority, lifecycle_state,
       preconditions, postconditions, test_steps, environment_requirements, estimated_duration,
       tags, automation_status, automation_script_link, created_by, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [testCaseId, title, description, finalExpected, projectId || null,
       finalPriority, finalLifecycleState, preconditions || null,
       postconditions || null, testSteps ? JSON.stringify(testSteps) : null,
       environmentRequirements || null, estimatedDuration || null,
       tags ? JSON.stringify(tags) : null,
       automationStatus || 'Not Automated',
       automationScriptLink || null,
       userId || null, 1],
      (err, result) => {
        if (err) {
          console.error("Add testcase error:", err);
          return res.status(500).json({ error: "Failed to add testcase" });
        }

        logAuditEvent(userId, "TESTCASE_CREATED", { title, projectId, test_case_id: testCaseId }, "testcase", result.insertId);

        res.status(201).json({
          message: "Testcase added successfully",
          id: result.insertId,
          test_case_id: testCaseId,
        });
      }
    );
  }
);


// ================= FETCH TESTCASES =================
router.get("/testcase", authMiddleware, (req, res) => {
  const projectId = req.query.projectId;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const params = [];
  const conditions = ["testcases.is_deleted = FALSE"];

  if (projectId) {
    conditions.push("testcases.project_id = ?");
    params.push(projectId);
  }

  // ✅ FIX: Apply assignment filter for BOTH tester AND developer
  // Previously only tester was filtered — developer saw ALL testcases
  if (userRole === "tester" || userRole === "developer") {
    const assignmentFilter = getAssignmentFilter(req.user, "testcases");
    if (assignmentFilter.whereClause) {
      conditions.push(assignmentFilter.whereClause);
      params.push(...assignmentFilter.params);
    }
  }

  const sql = `SELECT * FROM testcases WHERE ${conditions.join(" AND ")} ORDER BY testcases.id DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch testcases" });
    }

    console.log(`✅ User ${userId} (${userRole}) fetched ${results.length} testcases`);
    res.json(results);
  });
});


// ================= BULK UPDATE TESTCASES =================
router.put(
  "/testcase/bulk-update",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    const { ids, updates } = req.body;
    const userId = req.user?.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Test case IDs array required" });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: "Updates object required" });
    }

    const allowedFields = ['priority', 'automation_status', 'project_id', 'tags', 'preconditions', 'postconditions', 'environment_requirements', 'estimated_duration'];
    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key}=?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid update fields provided" });
    }

    updateFields.push('last_modified_by=?');
    updateValues.push(userId);

    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE testcases SET ${updateFields.join(', ')} WHERE id IN (${placeholders})`;

    db.query(sql, [...updateValues, ...ids], (err, result) => {
      if (err) {
        console.error("[BULK-UPDATE] Error:", err);
        return res.status(500).json({ error: "Failed to update testcases", details: err.message });
      }

      res.json({ message: "Bulk update successful", updatedCount: result.affectedRows });
    });
  }
);


// ================= UPDATE TESTCASE =================
router.put(
  "/testcase/:id",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const {
      title, description, expected_result, expectedResult,
      priority, lifecycle_state, test_steps, automation_status,
      change_description, projectId, assigned_to
    } = req.body;

    const finalExpected = expected_result || expectedResult;
    const testcaseId = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole === 'admin' && assigned_to !== undefined) {
      const updateSql = `UPDATE testcases SET assigned_to=? WHERE id=?`;

      db.query(updateSql, [assigned_to || null, testcaseId], (err, result) => {
        if (err) {
          console.error("Update assignment error:", err);
          return res.status(500).json({ error: "Failed to update assignment" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Testcase not found" });
        }

        if (assigned_to) {
          (async () => {
            try {
              const testcaseData = await new Promise((resolve, reject) => {
                db.query("SELECT title FROM testcases WHERE id=?", [testcaseId], (err, results) => {
                  if (err) reject(err);
                  else resolve(results[0]);
                });
              });

              if (testcaseData) {
                await NotificationService.notifyTestcaseAssignment(
                  testcaseId, assigned_to, userId, testcaseData.title
                );
              }
            } catch (notifyErr) {
              logger.error("Failed to send testcase assignment notification", { error: notifyErr });
            }
          })();
        }

        logAuditEvent(userId, "TESTCASE_ASSIGNED", { testcase_id: testcaseId, assigned_to }, "testcase", testcaseId);
        res.json({ message: "Assignment updated successfully" });
      });
      return;
    }

    db.query("SELECT * FROM testcases WHERE id=?", [testcaseId], (selectErr, selectResults) => {
      if (selectErr) {
        console.error("Select error:", selectErr);
        return res.status(500).json({ error: "Failed to fetch current testcase" });
      }

      if (selectResults.length === 0) {
        return res.status(404).json({ error: "Testcase not found" });
      }

      const currentTestcase = selectResults[0];

      if (currentTestcase.is_deleted) {
        return res.status(404).json({ error: "Testcase not found" });
      }

      if (userRole === "tester") {
        const isOwner = currentTestcase.created_by === userId;
        const isAssignee = currentTestcase.assigned_to === userId;
        if (!isOwner && !isAssignee) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const newVersion = (currentTestcase.version || 1) + 1;

      const historySql = `
        INSERT INTO testcase_history
        (testcase_id, title, description, expected_result, priority, test_steps,
         automation_status, version, modified_by, change_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        historySql,
        [
          testcaseId, currentTestcase.title, currentTestcase.description,
          currentTestcase.expected_result, currentTestcase.priority,
          currentTestcase.test_steps, currentTestcase.automation_status,
          currentTestcase.version, userId, change_description || 'Updated test case'
        ],
        (historyErr) => {
          if (historyErr) console.error("History save error:", historyErr);

          const updateSql = `
            UPDATE testcases
            SET title=?, description=?, expected_result=?, priority=?, lifecycle_state=?,
                test_steps=?, automation_status=?, project_id=?, version=?, last_modified_by=?
            WHERE id=?
          `;

          db.query(
            updateSql,
            [
              title, description, finalExpected,
              priority || currentTestcase.priority,
              lifecycle_state || currentTestcase.lifecycle_state,
              test_steps || currentTestcase.test_steps,
              automation_status || currentTestcase.automation_status,
              projectId || null, newVersion, userId, testcaseId
            ],
            (err, result) => {
              if (err) {
                console.error("Update error:", err);
                return res.status(500).json({ error: "Failed to update testcase" });
              }

              if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Testcase not found" });
              }

              logAuditEvent(userId, "TESTCASE_UPDATED", { testcase_id: testcaseId, version: newVersion }, "testcase", testcaseId);
              res.json({ message: "Updated successfully", version: newVersion });
            }
          );
        }
      );
    });
  }
);


// ================= DELETE TESTCASE =================
router.delete(
  "/testcase/:id",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const testcaseId = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    db.query("SELECT id, created_by, assigned_to, is_deleted FROM testcases WHERE id=?", [testcaseId], (err, results) => {
      if (err) {
        console.error("Delete error:", err);
        return res.status(500).json({ error: "Failed to delete testcase" });
      }

      if (!results || results.length === 0 || results[0].is_deleted) {
        return res.status(404).json({ error: "Testcase not found" });
      }

      const testcase = results[0];
      if (userRole === "tester") {
        const isOwner = testcase.created_by === userId;
        const isAssignee = testcase.assigned_to === userId;
        if (!isOwner && !isAssignee) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      db.query(
        "UPDATE testcases SET is_deleted=TRUE, deleted_at=NOW(), deleted_by=? WHERE id=?",
        [userId, testcaseId],
        (updateErr) => {
          if (updateErr) {
            console.error("Delete error:", updateErr);
            return res.status(500).json({ error: "Failed to delete testcase" });
          }

          logAuditEvent(userId, "DELETE_TESTCASE", { testcaseId }, "testcase", testcaseId);
          res.json({ message: "Deleted successfully" });
        }
      );
    });
  }
);


// ================= CLONE TESTCASE =================
router.post(
  "/testcase/:id/clone",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const testcaseId = req.params.id;
    const userId = req.user?.id || 0;

    db.query("SELECT id, title FROM testcases WHERE id = ? AND is_deleted = FALSE", [testcaseId], (checkErr, checkResults) => {
      if (checkErr) {
        return res.status(500).json({ error: "Failed to check testcase", details: checkErr.message });
      }

      if (!checkResults || checkResults.length === 0) {
        return res.status(404).json({ error: "Testcase not found" });
      }

      const generateId = () => {
        const year = new Date().getFullYear();
        const ts = Date.now().toString().slice(-6);
        const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `TC-${year}-${ts}${rand}`;
      };

      const tryClone = (newId, attempt = 0) => {
        if (attempt > 3) {
          return res.status(500).json({ error: "Could not generate unique ID" });
        }

        const escapedNewId = newId.replace(/'/g, "''");

        const sql = `
          INSERT INTO testcases
          (test_case_id, title, description, expected_result, project_id, priority,
           preconditions, postconditions, test_steps, environment_requirements,
           estimated_duration, tags, automation_status, automation_script_link,
           created_by, created_date, last_modified_by, last_modified_date, version)
          SELECT
            '${escapedNewId}', CONCAT('COPY - ', title), description, expected_result,
            project_id, priority, preconditions, postconditions, test_steps,
            environment_requirements, estimated_duration, tags, automation_status,
            automation_script_link, ${userId}, NOW(), ${userId}, NOW(), 1
          FROM testcases WHERE id = ${testcaseId}
        `;

        db.query(sql, [], (err, result) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY' && attempt < 3) {
              return tryClone(generateId(), attempt + 1);
            }
            return res.status(500).json({ error: "Failed to clone testcase", details: err.message });
          }

          res.json({ message: "Testcase cloned successfully", testCaseId: newId, affectedRows: result.affectedRows });
        });
      };

      tryClone(generateId());
    });
  }
);


// ================= GET VERSION HISTORY =================
router.get("/testcase/:id/history", authMiddleware, (req, res) => {
  const testcaseId = req.params.id;

  const sql = `
    SELECT h.*, u.email as modified_by_email
    FROM testcase_history h
    LEFT JOIN users u ON h.modified_by = u.id
    WHERE h.testcase_id = ?
    ORDER BY h.modified_at DESC
  `;

  db.query(sql, [testcaseId], (err, results) => {
    if (err) {
      console.error("History fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch version history" });
    }

    res.json(results);
  });
});


// ================= REOPEN CLOSED TESTCASE =================
router.post(
  "/testcase/:id/reopen",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const testcaseId = req.params.id;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Reason for reopening is required" });
    }

    db.query(`SELECT lifecycle_state, reopen_count FROM testcases WHERE id = ?`, [testcaseId], (checkErr, checkResults) => {
      if (checkErr) return res.status(500).json({ error: "Database error" });

      if (!checkResults || checkResults.length === 0) {
        return res.status(404).json({ error: "Test case not found" });
      }

      const currentState = checkResults[0].lifecycle_state;
      const currentReopenCount = checkResults[0].reopen_count || 0;

      if (currentState !== "Closed") {
        return res.status(400).json({
          error: `Cannot reopen a test case in ${currentState} state. Only Closed test cases can be reopened.`
        });
      }

      db.query(
        `UPDATE testcases SET lifecycle_state = 'Reopened', reopen_count = ? WHERE id = ?`,
        [currentReopenCount + 1, testcaseId],
        (updateErr) => {
          if (updateErr) {
            console.error("Reopen update error:", updateErr);
            return res.status(500).json({ error: "Failed to reopen test case" });
          }

          db.query(
            `INSERT INTO testcase_reopen_history (testcase_id, reopened_by, reason, previous_state, new_state) VALUES (?, ?, ?, ?, ?)`,
            [testcaseId, userId, reason, currentState, "Reopened"],
            (histErr) => {
              if (histErr) {
                console.error("Reopen history error:", histErr);
                return res.status(500).json({ error: "Test case reopened but history failed" });
              }

              res.json({ message: "Test case reopened successfully", newState: "Reopened", reopenCount: currentReopenCount + 1 });
            }
          );
        }
      );
    });
  }
);

module.exports = router;