const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");

// ================= DEBUG ENDPOINT - Check Test Case Data =================
router.get("/analytics/debug/testcases", authMiddleware, (req, res) => {
  const projectId = req.query.projectId;
  
  let whereClause = projectId ? "WHERE project_id = ?" : "";
  let params = projectId ? [projectId] : [];
  
  const sql = `
    SELECT 
      id, title, project_id, priority, automation_status, lifecycle_state,
      created_at
    FROM testcases
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT 10
  `;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch debug data", details: err.message });
    }
    res.json({
      total_count: results.length,
      testcases: results,
      sql_executed: sql,
      params: params
    });
  });
});

// ================= GET TESTCASE STATISTICS =================
router.get("/analytics/testcases", authMiddleware, (req, res) => {
  const projectId = req.query.projectId;
  const days = parseInt(req.query.days) || 30;
  
  console.log('📊 Fetching testcase analytics for projectId:', projectId, 'days:', days);
  
  // Get comprehensive testcase statistics
  let sql = `
    SELECT 
      COUNT(*) as total_testcases,
      SUM(CASE WHEN lifecycle_state = 'draft' THEN 1 ELSE 0 END) as draft_count,
      SUM(CASE WHEN lifecycle_state = 'ready' THEN 1 ELSE 0 END) as ready_count,
      SUM(CASE WHEN lifecycle_state = 'executing' OR lifecycle_state = 'in_progress' THEN 1 ELSE 0 END) as executing_count,
      SUM(CASE WHEN lifecycle_state = 'completed' OR lifecycle_state = 'done' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN lifecycle_state = 'closed' THEN 1 ELSE 0 END) as closed_count
    FROM testcases 
    WHERE 1=1
  `;
  let params = [];
  
  if (projectId) {
    sql += " AND project_id = ?";
    params.push(projectId);
  }
  
  // Only filter by date if days is less than 365 (1 year)
  if (days < 365) {
    sql += " AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(days);
  }
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Analytics query error:", err);
      return res.status(500).json({ error: "Failed to fetch analytics", details: err.message || err });
    }
    
    try {
      const data = results[0] || {};
      console.log('📊 Testcase stats:', data);
      
      res.json({
        total_testcases: parseInt(data.total_testcases) || 0,
        draft_count: parseInt(data.draft_count) || 0,
        ready_count: parseInt(data.ready_count) || 0,
        executing_count: parseInt(data.executing_count) || 0,
        completed_count: parseInt(data.completed_count) || 0,
        closed_count: parseInt(data.closed_count) || 0
      });
    } catch (parseErr) {
      console.error("❌ Error parsing analytics response:", parseErr);
      res.status(500).json({ error: "Error processing analytics", details: parseErr.message });
    }
  });
});

// ================= GET BUG STATISTICS =================
router.get("/analytics/bugs", authMiddleware, (req, res) => {
  const projectId = req.query.projectId;
  const days = parseInt(req.query.days) || 30;
  
  console.log('🐛 Fetching bug analytics for projectId:', projectId, 'days:', days);
  
  let sql = `
    SELECT 
      COUNT(*) as total_bugs,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
      SUM(CASE WHEN status = 'in_progress' OR status = 'in progress' THEN 1 ELSE 0 END) as progress_count,
      SUM(CASE WHEN status = 'closed' OR status = 'resolved' THEN 1 ELSE 0 END) as closed_count,
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
      SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_count,
      SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium_count,
      SUM(CASE WHEN severity = 'low' OR severity = 'minor' THEN 1 ELSE 0 END) as low_count
    FROM bugs
    WHERE 1=1
  `;
  let params = [];
  
  if (projectId) {
    sql += " AND project_id = ?";
    params.push(projectId);
  }
  
  if (days < 365) {
    sql += " AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(days);
  }
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Bug analytics error:", err);
      return res.status(500).json({ error: "Failed to fetch bug analytics", details: err.message || err });
    }
    
    try {
      const data = results[0] || {};
      console.log('🐛 Bug stats:', data);
      
      res.json({
        total_bugs: parseInt(data.total_bugs) || 0,
        open_count: parseInt(data.open_count) || 0,
        progress_count: parseInt(data.progress_count) || 0,
        closed_count: parseInt(data.closed_count) || 0,
        critical_count: parseInt(data.critical_count) || 0,
        high_count: parseInt(data.high_count) || 0,
        medium_count: parseInt(data.medium_count) || 0,
        low_count: parseInt(data.low_count) || 0
      });
    } catch (parseErr) {
      console.error("❌ Error parsing bugs response:", parseErr);
      res.status(500).json({ error: "Error processing bugs analytics", details: parseErr.message });
    }
  });
});

// ================= GET EXECUTION STATISTICS =================
router.get("/analytics/executions", authMiddleware, (req, res) => {
  const projectId = req.query.projectId;
  const days = parseInt(req.query.days) || 30;
  
  console.log('▶️ Fetching execution analytics for projectId:', projectId, 'days:', days);
  
  let sql = `
    SELECT 
      COUNT(*) as total_executions,
      SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) as pass_count,
      SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as fail_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
    FROM executions
    WHERE 1=1
  `;
  let params = [];
  
  if (projectId) {
    sql += " AND project_id = ?";
    params.push(projectId);
  }
  
  if (days < 365) {
    sql += " AND executed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(days);
  }
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Execution analytics error:", err);
      return res.status(500).json({ error: "Failed to fetch execution analytics", details: err.message || err });
    }
    
    try {
      const data = results[0] || {};
      const total = parseInt(data.total_executions) || 0;
      const passed = parseInt(data.pass_count) || 0;
      const failed = parseInt(data.fail_count) || 0;
      const pending = parseInt(data.pending_count) || 0;
      const passPercentage = total > 0 ? Math.round((passed / total) * 100) : 0;
      
      console.log('▶️ Execution stats:', data);
      
      res.json({
        total_executions: total,
        pass_count: passed,
        fail_count: failed,
        pending_count: pending,
        pass_percentage: passPercentage,
        avg_duration_minutes: 0
      });
    } catch (parseErr) {
      console.error("❌ Error parsing executions response:", parseErr);
      res.status(500).json({ error: "Error processing executions analytics", details: parseErr.message });
    }
  });
});

// ================= GET PERFORMANCE METRICS =================
router.get("/analytics/performance", authMiddleware, (req, res) => {
  const projectId = req.query.projectId;
  const days = parseInt(req.query.days) || 30;
  
  console.log('📈 Fetching performance metrics for projectId:', projectId, 'days:', days);
  
  let sql = "SELECT COUNT(*) as executions_run FROM executions";
  let params = [];
  
  if (projectId) {
    sql += " WHERE project_id = ? AND executed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(projectId);
    params.push(days);
  } else {
    sql += " WHERE executed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(days);
  }
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Performance analytics error:", err);
      return res.status(500).json({ error: "Failed to fetch performance metrics", details: err.message || err });
    }
    
    try {
      console.log('📈 Performance metrics result:', results);
      // Return empty array - performance data will be fetched separately
      res.json([]);
    } catch (parseErr) {
      console.error("❌ Error parsing performance response:", parseErr);
      res.status(500).json({ error: "Error processing performance metrics", details: parseErr.message });
    }
  });
});

// ================= GET PROJECT SUMMARY =================
router.get("/analytics/project-summary", authMiddleware, (req, res) => {
  const projectId = req.query.projectId;
  
  if (!projectId) {
    return res.status(400).json({ error: "projectId required" });
  }

  console.log('📋 Fetching project summary for projectId:', projectId);

  // Simple query to get just the project
  const sql = "SELECT id, name FROM projects WHERE id = ?";

  db.query(sql, [projectId], (err, results) => {
    if (err) {
      console.error("❌ Project summary error:", err);
      return res.status(500).json({ error: "Failed to fetch project summary", details: err.message || err });
    }
    
    try {
      const project = results && results[0];
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json({
        id: project.id,
        name: project.name || 'Unknown',
        total_testcases: 0,
        total_bugs: 0,
        total_executions: 0,
        open_bugs: 0,
        passed_executions: 0,
        overall_pass_rate: 0
      });
    } catch (parseErr) {
      console.error("❌ Error parsing project summary:", parseErr);
      res.status(500).json({ error: "Error processing project summary", details: parseErr.message });
    }
  });
});

// ================= GET TESTCASE PRIORITY BREAKDOWN =================
router.get("/analytics/priority-breakdown", authMiddleware, (req, res) => {
  const projectId = req.query.projectId;
  const days = parseInt(req.query.days) || 30;
  
  console.log('📊 Fetching priority breakdown for projectId:', projectId, 'days:', days);
  
  let sql = "SELECT priority, COUNT(*) as count FROM testcases WHERE 1=1";
  let params = [];
  
  if (projectId) {
    sql += " AND project_id = ?";
    params.push(projectId);
  }
  
  sql += " AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY priority";
  params.push(days);
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Priority breakdown error:", err);
      return res.status(500).json({ error: "Failed to fetch priority breakdown", details: err.message || err });
    }
    
    res.json(results || []);
  });
});

// ================= GET AUTOMATION STATUS =================
router.get("/analytics/automation-status", authMiddleware, (req, res) => {
  const projectId = req.query.projectId;
  const days = parseInt(req.query.days) || 30;
  
  console.log('🤖 Fetching automation status for projectId:', projectId, 'days:', days);
  
  let sql = "SELECT automation_status, COUNT(*) as count FROM testcases WHERE 1=1";
  let params = [];
  
  if (projectId) {
    sql += " AND project_id = ?";
    params.push(projectId);
  }
  
  sql += " AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY automation_status";
  params.push(days);
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Automation status error:", err);
      return res.status(500).json({ error: "Failed to fetch automation status", details: err.message || err });
    }
    
    res.json(results || []);
  });
});

module.exports = router;
