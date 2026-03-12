// Load environment variables first
require('dotenv').config();

// Validate environment configuration
const { validateEnv, config } = require('./config/env');
validateEnv();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const authRoutesExample = require("./routes/authRoutes.example"); // Phase 2 Example
const testcaseRoutes = require("./routes/testcaseRoutes");
const bugRoutes = require("./routes/bugRoutes");
const executionRoutes = require("./routes/executionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const projectsRoutes = require("./routes/projectsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const commentRoutes = require("./routes/commentRoutes");
const csvRoutes = require("./routes/csvRoutes");
const lifecycleRoutes = require("./routes/lifecycleRoutes");
const commitRoutes = require("./routes/commitRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const testSuiteRoutes = require("./routes/testSuiteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportExportRoutes = require("./routes/reportExportRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const retestRoutes = require("./routes/retestRoutes");

const db = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { addSecurityHeaders } = require('./utils/sanitizeOutput');
const { blockSQLInjection } = require('./utils/sanitize');
const { getCsrfToken } = require('./middleware/csrfProtection');

const app = express();

// CORS Configuration - Restrict to allowed origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());
    const isExplicitlyAllowed = allowedOrigins.indexOf(origin) !== -1;
    const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

    if (isExplicitlyAllowed || isVercelPreview) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours - browsers cache preflight requests
};

app.use(cors(corsOptions));
app.use(express.json());

// Security headers middleware
app.use(addSecurityHeaders());

// SQL injection detection middleware
app.use(blockSQLInjection());

// Request logging middleware
app.use(logger.requestLogger);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    success: true,
    status: "✅ Server is running", 
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// CSRF token endpoint
app.get("/api/csrf-token", getCsrfToken);


app.use("/api", authRoutes);
app.use("/api", authRoutesExample); // Phase 2 example routes
app.use("/api", testcaseRoutes);
app.use("/api", bugRoutes);
app.use("/api", executionRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", projectsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", commentRoutes);
app.use("/api", csvRoutes);
app.use("/api", lifecycleRoutes);
app.use("/api", commitRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", testSuiteRoutes);
app.use("/api", notificationRoutes);
app.use("/api", reportExportRoutes);
app.use("/api", attachmentRoutes);
app.use("/api", retestRoutes);

logger.info("All routes loaded successfully");
console.log("📝 Comment routes available at:");
console.log("   POST   /api/comments");
console.log("   GET    /api/bugs/:bugId/comments");
console.log("   GET    /api/testcases/:testcaseId/comments");
console.log("   PUT    /api/comments/:id");
console.log("   DELETE /api/comments/:id");
console.log("📋 Lifecycle routes available at:");
console.log("   PUT    /api/testcase/:id/lifecycle");
console.log("   GET    /api/testcase/:id/lifecycle-history");
console.log("🔓 Reopen routes available at:");
console.log("   POST   /api/testcase/:id/reopen");
console.log("🔗 Commit routes available at:");
console.log("   POST   /api/testcase/:id/commits");
console.log("   GET    /api/testcase/:id/commits");
console.log("   DELETE /api/testcase/:id/commits/:commitSha");

// Ensure projects table and project_id columns exist (simple migration)
function ensureSchema() {
  // Create base tables first (users, testcases, bugs)
  const createUsers = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    ) ENGINE=InnoDB;
  `;
  db.query(createUsers, err => { if (err) console.log('Create users error', err); else console.log('Users table ready'); });

  const createTestcases = `
    CREATE TABLE IF NOT EXISTS testcases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      expected_result TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_title (title)
    ) ENGINE=InnoDB;
  `;
  db.query(createTestcases, err => { if (err) console.log('Create testcases error', err); else console.log('Testcases table ready'); });

  const createBugs = `
    CREATE TABLE IF NOT EXISTS bugs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_title (title)
    ) ENGINE=InnoDB;
  `;
  db.query(createBugs, err => { if (err) console.log('Create bugs error', err); else console.log('Bugs table ready'); });

  // create projects table if not exists
  const createProjects = `
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL
    ) ENGINE=InnoDB;
  `;
  db.query(createProjects, err => { if (err) console.log('Create projects error', err); });

  // Create executions table if not exists
  const createExecutions = `
    CREATE TABLE IF NOT EXISTS executions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testcase_id INT NOT NULL,
      status ENUM('pass', 'fail', 'pending') DEFAULT 'pending',
      notes TEXT NULL,
      project_id INT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_testcase_id (testcase_id)
    ) ENGINE=InnoDB;
  `;
  db.query(createExecutions, err => { if (err) console.log('Create executions error', err); else console.log('Executions table ready'); });

  // Create attachment tables if not exists
  const createTestcaseAttachments = `
    CREATE TABLE IF NOT EXISTS testcase_attachments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testcase_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100) NULL,
      uploaded_by INT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_testcase_id (testcase_id),
      INDEX idx_uploaded_by (uploaded_by)
    ) ENGINE=InnoDB;
  `;

  const createBugAttachments = `
    CREATE TABLE IF NOT EXISTS bug_attachments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bug_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100) NULL,
      uploaded_by INT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_bug_id (bug_id),
      INDEX idx_uploaded_by (uploaded_by)
    ) ENGINE=InnoDB;
  `;

  db.query(createTestcaseAttachments, err => { if (err) console.log('Create testcase_attachments error', err); });
  db.query(createBugAttachments, err => { if (err) console.log('Create bug_attachments error', err); });

  // helper to add column if missing
  const addColumnIfMissing = (table, column, definition) => {
    const checkSql = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='${table}' AND COLUMN_NAME='${column}'`;
    db.query(checkSql, (err, results) => {
      if (err) return console.log('Schema check error', err);
      if (results && results[0] && results[0].cnt === 0) {
        db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (e) => { if (e) console.log(`Add column ${column} error`, e); });
      }
    });
  };

  // Test Case Columns
  addColumnIfMissing('testcases', 'test_case_id', 'VARCHAR(50) UNIQUE');
  addColumnIfMissing('testcases', 'preconditions', 'TEXT NULL');
  addColumnIfMissing('testcases', 'postconditions', 'TEXT NULL');
  addColumnIfMissing('testcases', 'test_steps', 'LONGTEXT NULL');
  addColumnIfMissing('testcases', 'environment_requirements', 'TEXT NULL');
  addColumnIfMissing('testcases', 'estimated_duration', 'INT NULL');
  addColumnIfMissing('testcases', 'tags', 'JSON NULL');
  addColumnIfMissing('testcases', 'automation_status', "ENUM('Not Automated', 'In Progress', 'Automated', 'Cannot Automate') DEFAULT 'Not Automated'");
  addColumnIfMissing('testcases', 'automation_script_link', 'VARCHAR(500) NULL');
  addColumnIfMissing('testcases', 'version', 'INT DEFAULT 1');
  addColumnIfMissing('testcases', 'created_by', 'INT NULL');
  addColumnIfMissing('testcases', 'created_date', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  addColumnIfMissing('testcases', 'last_modified_by', 'INT NULL');
  addColumnIfMissing('testcases', 'last_modified_date', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  addColumnIfMissing('testcases', 'is_deleted', 'BOOLEAN DEFAULT FALSE');
  addColumnIfMissing('testcases', 'deleted_at', 'TIMESTAMP NULL');
  addColumnIfMissing('testcases', 'deleted_by', 'INT NULL');
  
  // Bug Columns
  addColumnIfMissing('bugs', 'bug_id', 'VARCHAR(50) UNIQUE');
  addColumnIfMissing('bugs', 'environment_affected', 'VARCHAR(255) NULL');
  addColumnIfMissing('bugs', 'version', 'VARCHAR(50) NULL');
  addColumnIfMissing('bugs', 'steps_to_reproduce', 'LONGTEXT NULL');
  addColumnIfMissing('bugs', 'expected_behavior', 'TEXT NULL');
  addColumnIfMissing('bugs', 'actual_behavior', 'TEXT NULL');
  addColumnIfMissing('bugs', 'fix_notes', 'TEXT NULL');
  addColumnIfMissing('bugs', 'linked_commit', 'VARCHAR(500) NULL');
  addColumnIfMissing('bugs', 'created_by', 'INT NULL');
  addColumnIfMissing('bugs', 'reported_by', 'INT NULL');
  
  // Shared Project Columns
  addColumnIfMissing('testcases', 'project_id', 'INT NULL');
  addColumnIfMissing('bugs', 'project_id', 'INT NULL');
  addColumnIfMissing('executions', 'testcase_id', 'INT NOT NULL');
  addColumnIfMissing('executions', 'status', "ENUM('pass', 'fail', 'pending') DEFAULT 'pending'");
  addColumnIfMissing('executions', 'notes', 'TEXT NULL');
  addColumnIfMissing('executions', 'project_id', 'INT NULL');
  addColumnIfMissing('projects', 'description', 'TEXT NULL');
  addColumnIfMissing('executions', 'executed_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  addColumnIfMissing('bugs', 'assigned_to', 'INT NULL');
  addColumnIfMissing('bugs', 'due_date', 'DATE NULL');
  addColumnIfMissing('testcases', 'priority', "ENUM('low', 'medium', 'high') DEFAULT 'medium'");
  addColumnIfMissing('testcases', 'assigned_to', 'INT NULL');

  // User Authentication Columns
  addColumnIfMissing('users', 'email_verified', 'BOOLEAN DEFAULT FALSE');
  addColumnIfMissing('users', 'email_verification_token', 'VARCHAR(255) NULL');
  addColumnIfMissing('users', 'password_reset_token', 'VARCHAR(255) NULL');
  addColumnIfMissing('users', 'password_reset_expires', 'DATETIME NULL');
  addColumnIfMissing('users', 'refresh_token', 'TEXT NULL');

  // Execution Runs Table Columns
  addColumnIfMissing('execution_runs', 'execution_id', 'INT NOT NULL');
  addColumnIfMissing('execution_runs', 'testcase_id', 'INT NOT NULL');
  addColumnIfMissing('execution_runs', 'status', "ENUM('pass', 'fail', 'pending') DEFAULT 'pending'");
  addColumnIfMissing('execution_runs', 'start_time', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  addColumnIfMissing('execution_runs', 'end_time', 'TIMESTAMP NULL');
  addColumnIfMissing('execution_runs', 'duration_seconds', 'INT NULL');
  addColumnIfMissing('execution_runs', 'notes', 'TEXT NULL');
  addColumnIfMissing('execution_runs', 'tester_id', 'INT NULL');
  addColumnIfMissing('execution_runs', 'project_id', 'INT NULL');
  addColumnIfMissing('execution_runs', 'run_number', 'INT DEFAULT 1');
  addColumnIfMissing('execution_runs', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  // Execution Steps Table Columns
  addColumnIfMissing('execution_steps', 'execution_run_id', 'INT NOT NULL');
  addColumnIfMissing('execution_steps', 'step_number', 'INT NOT NULL');
  addColumnIfMissing('execution_steps', 'step_action', 'TEXT NOT NULL');
  addColumnIfMissing('execution_steps', 'step_expected', 'TEXT NULL');
  addColumnIfMissing('execution_steps', 'status', "ENUM('pass', 'fail', 'pending', 'skipped') DEFAULT 'pending'");
  addColumnIfMissing('execution_steps', 'actual_result', 'TEXT NULL');
  addColumnIfMissing('execution_steps', 'notes', 'TEXT NULL');
  addColumnIfMissing('execution_steps', 'start_time', 'TIMESTAMP NULL');
  addColumnIfMissing('execution_steps', 'end_time', 'TIMESTAMP NULL');
  addColumnIfMissing('execution_steps', 'duration_seconds', 'INT NULL');
  addColumnIfMissing('execution_steps', 'screenshot_url', 'VARCHAR(500) NULL');
  addColumnIfMissing('execution_steps', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  // Create comments table if not exists (without foreign keys first)
  const createComments = `
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bug_id INT NULL,
      testcase_id INT NULL,
      user_id INT NOT NULL,
      comment_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_bug_id (bug_id),
      INDEX idx_testcase_id (testcase_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB;
  `;
  db.query(createComments, err => { 
    if (err) console.log('Create comments table error:', err);
    else console.log('Comments table ready');
  });

  // Create testcase_history table for version tracking
  const createHistory = `
    CREATE TABLE IF NOT EXISTS testcase_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testcase_id INT NOT NULL,
      title VARCHAR(255),
      description TEXT,
      expected_result TEXT,
      priority ENUM('low', 'medium', 'high'),
      test_steps LONGTEXT,
      automation_status ENUM('Not Automated', 'In Progress', 'Automated', 'Cannot Automate'),
      version INT,
      modified_by INT,
      modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      change_description VARCHAR(500),
      INDEX idx_testcase_id (testcase_id)
    ) ENGINE=InnoDB;
  `;
  db.query(createHistory, err => { 
    if (err) console.log('Create history table error:', err);
    else console.log('Version history table ready');
  });

  // ================ EXECUTION RUNS TABLE ================
  const createExecutionRuns = `
    CREATE TABLE IF NOT EXISTS execution_runs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      execution_id INT NULL,
      testcase_id INT NOT NULL,
      status ENUM('pass', 'fail', 'pending') DEFAULT 'pending',
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP NULL,
      duration_seconds INT NULL,
      notes TEXT NULL,
      tester_id INT NULL,
      project_id INT NULL,
      run_number INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_testcase_id (testcase_id),
      INDEX idx_execution_id (execution_id)
    ) ENGINE=InnoDB;
  `;
  db.query(createExecutionRuns, err => {
    if (err) console.log('Create execution_runs table error:', err);
    else console.log('Execution runs table ready');
    
    // Migrate existing execution_id column to NULL if it exists and is NOT NULL
    db.query("ALTER TABLE execution_runs MODIFY COLUMN execution_id INT NULL", migrationErr => {
      if (migrationErr && migrationErr.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
        // Ignore error if column doesn't exist or is already nullable
        if (migrationErr) console.log('Migration note: Could not modify execution_id column', migrationErr.code);
      }
    });
  });

  // ================ EXECUTION STEPS TABLE ================
  const createExecutionSteps = `
    CREATE TABLE IF NOT EXISTS execution_steps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      execution_run_id INT NOT NULL,
      step_number INT NOT NULL,
      step_action TEXT NOT NULL,
      step_expected TEXT NULL,
      status ENUM('pass', 'fail', 'pending', 'skipped') DEFAULT 'pending',
      actual_result TEXT NULL,
      notes TEXT NULL,
      start_time TIMESTAMP NULL,
      end_time TIMESTAMP NULL,
      duration_seconds INT NULL,
      screenshot_url VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_execution_run_id (execution_run_id),
      FOREIGN KEY (execution_run_id) REFERENCES execution_runs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;
  db.query(createExecutionSteps, err => {
    if (err) console.log('Create execution_steps table error:', err);
    else console.log('Execution steps table ready');
  });

  // ================ LIFECYCLE STATE TABLE ================
  const createLifecycleStates = `
    CREATE TABLE IF NOT EXISTS testcase_lifecycle (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testcase_id INT NOT NULL,
      state ENUM('Draft', 'Ready', 'In Execution', 'Completed', 'Closed', 'Reopened') DEFAULT 'Draft',
      reason VARCHAR(500) NULL,
      changed_by INT NOT NULL,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_testcase_id (testcase_id),
      FOREIGN KEY (testcase_id) REFERENCES testcases(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;
  db.query(createLifecycleStates, err => {
    if (err) console.log('Create testcase_lifecycle table error:', err);
    else console.log('Lifecycle state table ready');
  });

  // Add lifecycle columns to testcases table
  addColumnIfMissing('testcases', 'lifecycle_state', "ENUM('Draft', 'Ready', 'In Execution', 'Completed', 'Closed', 'Reopened') DEFAULT 'Draft'");
  addColumnIfMissing('testcases', 'reopen_count', 'INT DEFAULT 0');
  addColumnIfMissing('testcases', 'closed_at', 'TIMESTAMP NULL');
  addColumnIfMissing('testcases', 'closed_by', 'INT NULL');

  // ================ TESTCASE REOPEN HISTORY TABLE ================
  const createReopenHistory = `
    CREATE TABLE IF NOT EXISTS testcase_reopen_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testcase_id INT NOT NULL,
      reopened_by INT NOT NULL,
      reopened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reason VARCHAR(500) NOT NULL,
      previous_state VARCHAR(100),
      new_state VARCHAR(100),
      INDEX idx_testcase_id (testcase_id),
      FOREIGN KEY (testcase_id) REFERENCES testcases(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;
  db.query(createReopenHistory, err => {
    if (err) console.log('Create testcase_reopen_history table error:', err);
    else console.log('Reopen history table ready');
  });

  // ================ TESTCASE COMMITS TABLE ================
  const createTestcaseCommits = `
    CREATE TABLE IF NOT EXISTS testcase_commits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testcase_id INT NOT NULL,
      commit_sha VARCHAR(40) NOT NULL,
      commit_message TEXT NULL,
      commit_author VARCHAR(255) NULL,
      commit_date TIMESTAMP NULL,
      repository_url VARCHAR(500) NULL,
      linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      linked_by INT NOT NULL,
      UNIQUE KEY unique_link (testcase_id, commit_sha),
      INDEX idx_testcase_id (testcase_id),
      INDEX idx_commit_sha (commit_sha),
      FOREIGN KEY (testcase_id) REFERENCES testcases(id) ON DELETE CASCADE,
      FOREIGN KEY (linked_by) REFERENCES users(id)
    ) ENGINE=InnoDB;
  `;
  db.query(createTestcaseCommits, err => {
    if (err) console.log('Create testcase_commits table error:', err);
    else console.log('Testcase commits table ready');
  });

  // ================ ENHANCED COMMENTS TABLE ================
  // Add columns to existing comments table for threading & mentions
  addColumnIfMissing('comments', 'parent_comment_id', 'INT NULL');
  addColumnIfMissing('comments', 'is_pinned', 'BOOLEAN DEFAULT FALSE');
  addColumnIfMissing('comments', 'execution_id', 'INT NULL');

  // Create comment mentions table for @mentions
  const createCommentMentions = `
    CREATE TABLE IF NOT EXISTS comment_mentions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      comment_id INT NOT NULL,
      mentioned_user_id INT NOT NULL,
      notified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_comment_id (comment_id),
      INDEX idx_mentioned_user_id (mentioned_user_id),
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (mentioned_user_id) REFERENCES users(id)
    ) ENGINE=InnoDB;
  `;
  db.query(createCommentMentions, err => {
    if (err) console.log('Create comment_mentions table error:', err);
    else console.log('Comment mentions table ready');
  });

  // Create comment reactions table
  const createCommentReactions = `
    CREATE TABLE IF NOT EXISTS comment_reactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      comment_id INT NOT NULL,
      user_id INT NOT NULL,
      reaction VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_reaction (comment_id, user_id, reaction),
      INDEX idx_comment_id (comment_id),
      INDEX idx_user_id (user_id),
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB;
  `;
  db.query(createCommentReactions, err => {
    if (err) console.log('Create comment_reactions table error:', err);
    else console.log('Comment reactions table ready');
  });

  // Add execution commits table
  const createExecutionCommits = `
    CREATE TABLE IF NOT EXISTS execution_commits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      execution_id INT NOT NULL,
      commit_sha VARCHAR(40) NOT NULL,
      commit_message TEXT NULL,
      linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_execution_id (execution_id),
      INDEX idx_commit_sha (commit_sha),
      FOREIGN KEY (execution_id) REFERENCES execution_runs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;
  db.query(createExecutionCommits, err => {
    if (err) console.log('Create execution_commits table error:', err);
    else console.log('Execution commits table ready');
  });

  // Create retest_requests table
  const createRetestRequests = `
    CREATE TABLE IF NOT EXISTS retest_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bug_id INT NOT NULL,
      requested_by INT NOT NULL,
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
      notes TEXT NULL,
      completed_at TIMESTAMP NULL,
      completed_by INT NULL,
      INDEX idx_bug_id (bug_id),
      INDEX idx_requested_by (requested_by),
      INDEX idx_status (status),
      FOREIGN KEY (bug_id) REFERENCES bugs(id) ON DELETE CASCADE,
      FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `;
  db.query(createRetestRequests, err => {
    if (err) console.log('Create retest_requests table error:', err);
    else console.log('Retest requests table ready');
  });
}

ensureSchema();

// ============================================================================
// Error Handling Middleware (Must be after all routes)
// ============================================================================

// 404 Handler - catch requests to undefined routes
app.use(notFoundHandler);

// Global Error Handler - catch all errors
app.use(errorHandler);

// ============================================================================
// Start Server
// ============================================================================

const PORT = config.port;
logger.info("\n🚀 Starting TestTrack Pro Backend Server...");
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Database: ${config.database.name}@${config.database.host}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`CORS allowed origins: ${config.cors.origin}`);
  logger.info("Ready to accept requests!\n");
});
