const db = require('./config/db');

console.log('Adding "retest_request" to notifications.type ENUM...\n');

const alterQuery = `
  ALTER TABLE notifications 
  MODIFY COLUMN type ENUM(
    'bug_assigned',
    'bug_status_changed',
    'testcase_assigned',
    'comment_added',
    'execution_completed',
    'mention',
    'system',
    'retest_request'
  ) NOT NULL
`;

db.query(alterQuery, (err, result) => {
  if (err) {
    console.error('❌ Error altering table:', err);
    process.exit(1);
  }
  
  console.log('✓ Successfully added "retest_request" to type ENUM');
  console.log('\nNotifications can now be created with type="retest_request"');
  process.exit(0);
});
