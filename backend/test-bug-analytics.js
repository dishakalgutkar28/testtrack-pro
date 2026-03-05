// Test bug analytics query for project 1
const db = require('./config/db');

const projectId = 1; // student registration system

const sql = `
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
  WHERE project_id = ?
`;

db.query(sql, [projectId], (err, results) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('\n📊 Bug Analytics for Project 1 (student registration system):');
    console.log('='.repeat(60));
    const data = results[0];
    console.log('Total Bugs:', data.total_bugs);
    console.log('\nBy Status:');
    console.log('  - Open:', data.open_count);
    console.log('  - In Progress:', data.progress_count);
    console.log('  - Closed:', data.closed_count);
    console.log('\nBy Severity:');
    console.log('  - Critical:', data.critical_count);
    console.log('  - High:', data.high_count);
    console.log('  - Medium:', data.medium_count);
    console.log('  - Low/Minor:', data.low_count);
  }
  db.end();
});
