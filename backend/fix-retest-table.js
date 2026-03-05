const db = require('./config/db');

console.log('Dropping and recreating retest_requests table...');

db.query('DROP TABLE IF EXISTS retest_requests', (err) => {
  if (err) {
    console.error('Error dropping table:', err);
    process.exit(1);
  }
  
  console.log('✓ Table dropped successfully');
  console.log('Server will create it with correct constraints on next startup');
  process.exit(0);
});
