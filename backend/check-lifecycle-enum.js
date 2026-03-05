const db = require('./config/db');

const query = `SHOW COLUMNS FROM testcases LIKE 'lifecycle_state'`;

db.query(query, (err, results) => {
  if (err) {
    console.error('Error:', err);
    db.end();
    return;
  }

  console.log('\n=== LIFECYCLE_STATE COLUMN INFO ===\n');
  console.log(results);
  
  if (results[0] && results[0].Type) {
    console.log('\nColumn Type:', results[0].Type);
    console.log('Default:', results[0].Default);
  }

  db.end();
});
