const db = require('./config/db');

console.log('Checking notifications...\n');

db.query('SELECT * FROM notifications WHERE type = "retest_request" ORDER BY created_at DESC', (err, notifications) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('=== ALL RETEST NOTIFICATIONS ===');
  if (notifications.length === 0) {
    console.log('❌ No retest notifications found in database!');
    console.log('\nThis means notifications are NOT being created.');
  } else {
    console.log(`✓ Found ${notifications.length} notification(s):`);
    notifications.forEach(n => {
      console.log(`\n- Notification ID: ${n.id}`);
      console.log(`  To User ID: ${n.user_id}`);
      console.log(`  Title: ${n.title}`);
      console.log(`  Message: ${n.message}`);
      console.log(`  Read: ${n.is_read ? 'Yes' : 'No'}`);
      console.log(`  Created: ${n.created_at}`);
    });
  }
  
  // Also check which user is logged in as tester (newuser@test.com)
  db.query('SELECT id, email, role FROM users WHERE email = "newuser@test.com"', (err, users) => {
    if (!err && users.length > 0) {
      console.log(`\n=== CURRENT TESTER ===`);
      console.log(`Email: ${users[0].email}`);
      console.log(`User ID: ${users[0].id}`);
      console.log(`Role: ${users[0].role}`);
      
      // Check if this user has ANY notifications
      db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?', [users[0].id], (err, result) => {
        if (!err) {
          console.log(`Total notifications for this user: ${result[0].count}`);
        }
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});
