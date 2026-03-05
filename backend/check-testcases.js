const db = require('./config/db');

const query = `
  SELECT 
    id,
    title,
    project_id,
    lifecycle_state,
    priority,
    (SELECT name FROM projects WHERE id = testcases.project_id) as project_name
  FROM testcases
  ORDER BY project_id, id
`;

db.query(query, (err, results) => {
  if (err) {
    console.error('Error:', err);
    db.end();
    return;
  }

  console.log('\n=== ALL TESTCASES ===\n');
  results.forEach(tc => {
    console.log(`TC-${tc.id}: ${tc.title}`);
    console.log(`  Project: ${tc.project_name} (ID: ${tc.project_id})`);
    console.log(`  Lifecycle State: ${tc.lifecycle_state}`);
    console.log(`  Priority: ${tc.priority}`);
    console.log('');
  });

  console.log(`\nTotal testcases: ${results.length}`);

  // Count by project
  const byProject = results.reduce((acc, tc) => {
    const projectKey = tc.project_name || 'No Project';
    if (!acc[projectKey]) acc[projectKey] = [];
    acc[projectKey].push(tc);
    return acc;
  }, {});

  console.log('\n=== BREAKDOWN BY PROJECT ===');
  Object.keys(byProject).forEach(project => {
    console.log(`\n${project}: ${byProject[project].length} testcases`);
    const lifecycles = byProject[project].reduce((acc, tc) => {
      acc[tc.lifecycle_state] = (acc[tc.lifecycle_state] || 0) + 1;
      return acc;
    }, {});
    console.log('  Lifecycle states:', lifecycles);
  });

  db.end();
});
