require('dotenv').config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const testcaseRoutes = require("./routes/testcaseRoutes");
const bugRoutes = require("./routes/bugRoutes");
const executionRoutes = require("./routes/executionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const projectsRoutes = require("./routes/projectsRoutes");
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
// simple request logger for debugging
app.use((req, res, next) => {
  try { console.log('REQ', req.method, req.url); } catch (e) {}
  next();
});


app.use("/api", authRoutes);
app.use("/api", testcaseRoutes);
app.use("/api", bugRoutes);
app.use("/api", executionRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", projectsRoutes);

// Ensure projects table and project_id columns exist (simple migration)
function ensureSchema() {
  // create projects table if not exists
  const createProjects = `
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB;
  `;
  db.query(createProjects, err => { if (err) console.log('Create projects error', err); });

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

  addColumnIfMissing('testcases', 'project_id', 'INT NULL');
  addColumnIfMissing('bugs', 'project_id', 'INT NULL');
  addColumnIfMissing('executions', 'project_id', 'INT NULL');
}

ensureSchema();

app.listen(5000, () =>
  console.log("Server running on 5000")
);
