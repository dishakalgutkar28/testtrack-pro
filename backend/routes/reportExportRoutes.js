/**
 * Report Export Routes
 * Handle PDF, Excel, and CSV report exports
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");
const { generatePDFReport } = require("../utils/pdfExport");
const { generateExcelReport } = require("../utils/excelExport");
const { generateCSVReport } = require("../utils/csvExport");
const emailService = require("../utils/emailService");

const formatEmailError = (error) => {
  const message = error?.message || "Failed to send email";
  const badAuth = /invalid login|badcredentials|authentication failed|535/i.test(message);

  if (badAuth) {
    return {
      error: "Email provider authentication failed",
      details: "SMTP credentials are invalid. Update email provider username/password (or app password) in backend environment settings.",
      raw: message
    };
  }

  return {
    error: "Failed to send report email",
    details: message
  };
};

/**
 * @route   GET /api/reports/export/bugs/pdf
 * @desc    Export bugs report as PDF
 * @access  Private
 */
router.get("/reports/export/bugs/pdf", authMiddleware, async (req, res) => {
  const { project_id, status, severity, assigned_to, date_from, date_to } = req.query;
  
  try {
    let sql = `
      SELECT 
        b.*,
        u.email as reporter_email,
        a.email as assigned_email,
        p.name as project_name
      FROM bugs b
      LEFT JOIN users u ON b.reported_by = u.id
      LEFT JOIN users a ON b.assigned_to = a.id
      LEFT JOIN projects p ON b.project_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (project_id) {
      sql += ` AND b.project_id = ?`;
      params.push(project_id);
    }
    if (status) {
      sql += ` AND b.status = ?`;
      params.push(status);
    }
    if (severity) {
      sql += ` AND b.severity = ?`;
      params.push(severity);
    }
    if (assigned_to) {
      sql += ` AND b.assigned_to = ?`;
      params.push(assigned_to);
    }
    if (date_from) {
      sql += ` AND b.created_at >= ?`;
      params.push(date_from);
    }
    if (date_to) {
      sql += ` AND b.created_at <= ?`;
      params.push(date_to);
    }
    
    sql += ` ORDER BY b.created_at DESC LIMIT 1000`;
    
    db.query(sql, params, async (err, bugs) => {
      if (err) {
        logger.error("Error fetching bugs for PDF export", { error: err });
        return res.status(500).json({ error: "Failed to fetch bugs" });
      }
      
      try {
        const pdfBuffer = await generatePDFReport('bugs', bugs, req.query);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bugs-report-${Date.now()}.pdf`);
        res.send(pdfBuffer);
        
        logger.info("PDF bug report generated", { userId: req.user.id, bugCount: bugs.length });
      } catch (pdfError) {
        logger.error("Error generating PDF", { error: pdfError });
        res.status(500).json({ error: "Failed to generate PDF report" });
      }
    });
  } catch (error) {
    logger.error("Error in PDF export route", { error });
    res.status(500).json({ error: "Failed to export report" });
  }
});

/**
 * @route   GET /api/reports/export/bugs/excel
 * @desc    Export bugs report as Excel
 * @access  Private
 */
router.get("/reports/export/bugs/excel", authMiddleware, async (req, res) => {
  const { project_id, status, severity, assigned_to, date_from, date_to } = req.query;
  
  try {
    let sql = `
      SELECT 
        b.id,
        b.title,
        b.description,
        b.status,
        b.severity,
        b.priority,
        p.name as project_name,
        u.email as reporter_email,
        a.email as assigned_email,
        b.created_at,
        b.updated_at
      FROM bugs b
      LEFT JOIN users u ON b.reported_by = u.id
      LEFT JOIN users a ON b.assigned_to = a.id
      LEFT JOIN projects p ON b.project_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (project_id) {
      sql += ` AND b.project_id = ?`;
      params.push(project_id);
    }
    if (status) {
      sql += ` AND b.status = ?`;
      params.push(status);
    }
    if (severity) {
      sql += ` AND b.severity = ?`;
      params.push(severity);
    }
    if (assigned_to) {
      sql += ` AND b.assigned_to = ?`;
      params.push(assigned_to);
    }
    if (date_from) {
      sql += ` AND b.created_at >= ?`;
      params.push(date_from);
    }
    if (date_to) {
      sql += ` AND b.created_at <= ?`;
      params.push(date_to);
    }
    
    sql += ` ORDER BY b.created_at DESC LIMIT 5000`;
    
    db.query(sql, params, async (err, bugs) => {
      if (err) {
        logger.error("Error fetching bugs for Excel export", { error: err });
        return res.status(500).json({ error: "Failed to fetch bugs" });
      }
      
      try {
        const excelBuffer = await generateExcelReport('bugs', bugs);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=bugs-report-${Date.now()}.xlsx`);
        res.send(excelBuffer);
        
        logger.info("Excel bug report generated", { userId: req.user.id, bugCount: bugs.length });
      } catch (excelError) {
        logger.error("Error generating Excel", { error: excelError });
        res.status(500).json({ error: "Failed to generate Excel report" });
      }
    });
  } catch (error) {
    logger.error("Error in Excel export route", { error });
    res.status(500).json({ error: "Failed to export report" });
  }
});

/**
 * @route   GET /api/reports/export/testcases/csv
 * @desc    Export test cases as CSV
 * @access  Private
 */
router.get("/reports/export/testcases/csv", authMiddleware, (req, res) => {
  const { project_id, status, priority } = req.query;
  
  let sql = `
    SELECT 
      tc.id,
      tc.title,
      tc.description,
      tc.status,
      tc.priority,
      tc.automated,
      p.name as project_name,
      u.email as created_by_email,
      tc.created_at
    FROM testcases tc
    LEFT JOIN users u ON tc.created_by = u.id
    LEFT JOIN projects p ON tc.project_id = p.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (project_id) {
    sql += ` AND tc.project_id = ?`;
    params.push(project_id);
  }
  if (status) {
    sql += ` AND tc.status = ?`;
    params.push(status);
  }
  if (priority) {
    sql += ` AND tc.priority = ?`;
    params.push(priority);
  }
  
  sql += ` ORDER BY tc.created_at DESC`;
  
  db.query(sql, params, (err, testcases) => {
    if (err) {
      logger.error("Error fetching testcases for CSV export", { error: err });
      return res.status(500).json({ error: "Failed to fetch test cases" });
    }
    
    try {
      const csvContent = generateCSVReport('testcases', testcases);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=testcases-report-${Date.now()}.csv`);
      res.send(csvContent);
      
      logger.info("CSV testcase report generated", { userId: req.user.id, testcaseCount: testcases.length });
    } catch (csvError) {
      logger.error("Error generating CSV", { error: csvError });
      res.status(500).json({ error: "Failed to generate CSV report" });
    }
  });
});

/**
 * @route   GET /api/reports/export/execution-summary/pdf
 * @desc    Export execution summary as PDF
 * @access  Private
 */
router.get("/reports/export/execution-summary/pdf", authMiddleware, async (req, res) => {
  const { project_id, date_from, date_to } = req.query;
  
  try {
    let sql = `
      SELECT 
        tc.title as testcase_title,
        er.status,
        er.executed_at,
        er.executed_by,
        u.email as executed_by_email,
        p.name as project_name,
        er.notes
      FROM execution_runs er
      JOIN testcases tc ON er.testcase_id = tc.id
      LEFT JOIN projects p ON er.project_id = p.id
      LEFT JOIN users u ON er.executed_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (project_id) {
      sql += ` AND er.project_id = ?`;
      params.push(project_id);
    }
    if (date_from) {
      sql += ` AND er.executed_at >= ?`;
      params.push(date_from);
    }
    if (date_to) {
      sql += ` AND er.executed_at <= ?`;
      params.push(date_to);
    }
    
    sql += ` ORDER BY er.executed_at DESC LIMIT 1000`;
    
    db.query(sql, params, async (err, executions) => {
      if (err) {
        logger.error("Error fetching executions for PDF export", { error: err });
        return res.status(500).json({ error: "Failed to fetch executions" });
      }
      
      try {
        const pdfBuffer = await generatePDFReport('executions', executions, req.query);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=execution-summary-${Date.now()}.pdf`);
        res.send(pdfBuffer);
        
        logger.info("PDF execution report generated", { userId: req.user.id, executionCount: executions.length });
      } catch (pdfError) {
        logger.error("Error generating PDF", { error: pdfError });
        res.status(500).json({ error: "Failed to generate PDF report" });
      }
    });
  } catch (error) {
    logger.error("Error in execution PDF export route", { error });
    res.status(500).json({ error: "Failed to export report" });
  }
});

/**
 * @route   POST /api/reports/send
 * @desc    Send a plain-text or HTML report to a recipient (project developer or provided email)
 * @access  Private
 */
router.post('/reports/send', authMiddleware, async (req, res) => {
  try {
    const { project_id, to, subject, text, html } = req.body;

    if (!text && !html) {
      return res.status(400).json({ error: 'Report content required (text or html)' });
    }

    let recipient = to;

    // If no explicit recipient provided, try to fetch from project metadata
    if (!recipient && project_id) {
      db.query('SELECT * FROM projects WHERE id = ? LIMIT 1', [project_id], (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch project' });
        }

        const project = results && results[0] ? results[0] : null;
        if (!project) return res.status(400).json({ error: 'Project not found and no recipient provided' });

        // Check common email-like fields on the project record
        const emailFields = ['developerEmail','developer_email','devEmail','dev_email','ownerEmail','owner_email','contactEmail','contact_email','email'];
        recipient = emailFields.map(f => project[f]).find(Boolean);

        if (!recipient) return res.status(400).json({ error: 'No recipient email found on project and none provided' });

        // Send email
        emailService.sendEmail(recipient, subject || `TestTrack Pro Report - ${project.name || 'Project'}`, html || null, text || null)
          .then(result => res.json({ success: true, messageId: result.messageId }))
          .catch(e => {
            logger.error('Error sending report email (project recipient)', { error: e.message, projectId: project_id, to: recipient });
            res.status(500).json(formatEmailError(e));
          });
      });
      return;
    }

    if (!recipient) return res.status(400).json({ error: 'Recipient email required' });

    const sendResult = await emailService.sendEmail(recipient, subject || 'TestTrack Pro Report', html || null, text || null);
        // Persist sent report record (best-effort)
        try {
          const insertSql = `INSERT INTO sent_reports (project_id, sender_id, to_email, subject, body) VALUES (?, ?, ?, ?, ?)`;
          const senderId = req.user?.id || null;
          db.query(insertSql, [project_id || null, senderId, recipient, subject || null, text || null], (e) => {
            if (e) logger.error('Failed to persist sent_report', { error: e.message });
          });
        } catch (persistErr) {
          logger.error('Error persisting sent_report', { error: persistErr.message });
        }

        // Create in-app notification for recipient if they are a user in the system
        try {
          db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [recipient], (err, results) => {
            if (!err && results && results[0]) {
              const recipientUserId = results[0].id;
              const notifSql = `INSERT INTO notifications (user_id, sender_id, type, title, message, link) VALUES (?, ?, 'system', ?, ?, ?)`;
              const title = 'Report Sent to You';
              const message = `A report has been sent to you for project: ${subject || ''}`;
              const link = `/reports/sent`;
              db.query(notifSql, [recipientUserId, req.user?.id || null, title, message, link], (nerr) => {
                if (nerr) logger.error('Failed to create notification for sent report', { error: nerr.message, recipientUserId });
              });
            }
          });
        } catch (notifErr) {
          logger.error('Error creating in-app notification for sent report', { error: notifErr.message });
        }

        res.json({ success: true, messageId: sendResult.messageId });
  } catch (error) {
    logger.error('Error in /reports/send', { error: error.message });
    res.status(500).json(formatEmailError(error));
  }
});

module.exports = router;
