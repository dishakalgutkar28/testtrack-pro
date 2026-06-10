const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { getAssignmentFilter } = require("../middleware/assignmentMiddleware");

const logAuditEvent = (userId, action, details, targetType, targetId) => {
  const sql = `
    INSERT INTO audit_logs
    (user_id, action, details, target_type, target_id, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  db.query(sql, [userId, action, JSON.stringify(details), targetType, targetId]);
};

// ================= GET PROJECTS WITH TEST CASE STATISTICS =================
router.get("/projects/with-stats", authMiddleware, (req, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (userRole === 'admin') {
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        (SELECT COUNT(*) FROM testcases WHERE project_id = p.id) as testcase_count,
        (SELECT COUNT(*) FROM testcases WHERE project_id = p.id AND priority = 'high') as high_priority_count,
        (SELECT COUNT(*) FROM testcases WHERE project_id = p.id AND priority = 'medium') as medium_priority_count,
        (SELECT COUNT(*) FROM testcases WHERE project_id = p.id AND priority = 'low') as low_priority_count,
        (SELECT COUNT(*) FROM bugs WHERE project_id = p.id) as bug_count,
        (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND status = 'open') as open_bugs_count,
        (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND status = 'closed') as closed_bugs_count,
        (SELECT COUNT(*) FROM execution_runs WHERE project_id = p.id) as execution_count,
        (SELECT COUNT(*) FROM execution_runs WHERE project_id = p.id AND status = 'pass') as passed_executions,
        (SELECT COUNT(*) FROM execution_runs WHERE project_id = p.id AND status = 'fail') as failed_executions
      FROM projects p
      ORDER BY testcase_count DESC, p.name ASC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Fetch projects with stats error:", err);
        return res.status(500).json({ error: "Failed to fetch projects with statistics", details: err.message });
      }
      console.log(`✅ Admin ${userId} fetched projects stats`);
      res.json(results);
    });

  } else {
    // ✅ FIX: Developers and testers see projects where they have assigned testcases OR assigned bugs
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        (SELECT COUNT(*) FROM testcases WHERE project_id = p.id AND assigned_to = ?) as testcase_count,
        (SELECT COUNT(*) FROM testcases WHERE project_id = p.id AND priority = 'high' AND assigned_to = ?) as high_priority_count,
        (SELECT COUNT(*) FROM testcases WHERE project_id = p.id AND priority = 'medium' AND assigned_to = ?) as medium_priority_count,
        (SELECT COUNT(*) FROM testcases WHERE project_id = p.id AND priority = 'low' AND assigned_to = ?) as low_priority_count,
        (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND assigned_to = ?) as bug_count,
        (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND status = 'open' AND assigned_to = ?) as open_bugs_count,
        (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND status = 'closed' AND assigned_to = ?) as closed_bugs_count,
        (SELECT COUNT(*) FROM execution_runs WHERE project_id = p.id AND testcase_id IN (
          SELECT id FROM testcases WHERE project_id = p.id AND assigned_to = ?
        )) as execution_count,
        (SELECT COUNT(*) FROM execution_runs WHERE project_id = p.id AND status = 'pass' AND testcase_id IN (
          SELECT id FROM testcases WHERE project_id = p.id AND assigned_to = ?
        )) as passed_executions,
        (SELECT COUNT(*) FROM execution_runs WHERE project_id = p.id AND status = 'fail' AND testcase_id IN (
          SELECT id FROM testcases WHERE project_id = p.id AND assigned_to = ?
        )) as failed_executions
      FROM projects p
      WHERE (
        EXISTS (SELECT 1 FROM testcases t WHERE t.project_id = p.id AND t.assigned_to = ?)
        OR
        EXISTS (SELECT 1 FROM bugs b WHERE b.project_id = p.id AND b.assigned_to = ?)
      )
      ORDER BY testcase_count DESC, p.name ASC
    `;

    // 10 placeholders in SELECT + 2 in WHERE = 12 total
    const params = [...Array(10).fill(userId), userId, userId];

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("Fetch projects with stats error:", err);
        return res.status(500).json({ error: "Failed to fetch projects with statistics", details: err.message });
      }
      console.log(`✅ User ${userId} (${userRole}) fetched ${results.length} assigned projects with stats`);
      res.json(results);
    });
  }
});


// ================= GET PROJECT WITH TEST CASES BY ID =================
router.get("/projects/:id/testcases", authMiddleware, (req, res) => {
  const projectId = req.params.id;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const assignmentFilter = getAssignmentFilter(req.user, 't');
  let whereConditions = ['t.project_id = ?'];
  let params = [projectId];

  if (assignmentFilter.whereClause) {
    whereConditions.push(assignmentFilter.whereClause);
    params.push(...assignmentFilter.params);
  }

  const sql = `
    SELECT t.*
    FROM testcases t
    WHERE ${whereConditions.join(" AND ")}
    ORDER BY t.priority DESC, t.id DESC
  `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Fetch project testcases error:", err);
      return res.status(500).json({ error: "Failed to fetch test cases" });
    }
    console.log(`✅ User ${userId} (${userRole}) fetched ${results.length} testcases from project ${projectId}`);
    res.json(results);
  });
});


// ================= GET ALL PROJECTS =================
router.get("/projects", authMiddleware, (req, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (userRole === 'admin') {
    db.query("SELECT * FROM projects ORDER BY id DESC", (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to fetch projects" });
      console.log(`✅ Admin ${userId} fetched ${results.length} projects`);
      res.json({ projects: results, success: true });
    });

  } else {
    // ✅ FIX: Show projects where user has assigned testcases OR assigned bugs
    const sql = `
      SELECT DISTINCT p.*
      FROM projects p
      WHERE (
        EXISTS (SELECT 1 FROM testcases t WHERE t.project_id = p.id AND t.assigned_to = ?)
        OR
        EXISTS (SELECT 1 FROM bugs b WHERE b.project_id = p.id AND b.assigned_to = ?)
      )
      ORDER BY p.id DESC
    `;

    db.query(sql, [userId, userId], (err, results) => {
      if (err) {
        console.error("Fetch projects error:", err);
        return res.status(500).json({ error: "Failed to fetch projects" });
      }
      console.log(`✅ User ${userId} (${userRole}) fetched ${results.length} assigned projects`);
      res.json({ projects: results, success: true });
    });
  }
});


// ================= CREATE PROJECT (ADMIN ONLY) =================
router.post("/projects", authMiddleware, requireRole("admin"), (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Project name required" });
  }

  db.query(
    "INSERT INTO projects (name, description) VALUES (?, ?)",
    [name, description || null],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Project creation failed" });
      }

      logAuditEvent(req.user.id, "PROJECT_CREATED", { name, description }, "project", result.insertId);
      res.json({ message: "Project created successfully" });
    }
  );
});

module.exports = router;