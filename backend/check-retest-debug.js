const db = require('./config/db');

console.log('Checking bug #14 details and notifications...\n');

// Check bug details
db.query('SELECT id, title, status, reported_by, created_by FROM bugs WHERE id = 14', (err, bugs) => {
  if (err) {
    console.error('Error fetching bug:', err);
    process.exit(1);
  }
  
  if (bugs.length === 0) {
    console.log('Bug #14 not found');
    process.exit(0);
  }
  
  const bug = bugs[0];
  console.log('=== BUG #14 DETAILS ===');
  console.log('Title:', bug.title);
  console.log('Status:', bug.status);
  console.log('Reported By (user_id):', bug.reported_by);
  console.log('Created By (user_id):', bug.created_by);
  
  // Get reporter details if exists
  if (bug.reported_by) {
    db.query('SELECT id, email, role FROM users WHERE id = ?', [bug.reported_by], (err, users) => {
      if (!err && users.length > 0) {
        console.log('\n=== REPORTER DETAILS ===');
        console.log('Email:', users[0].email);
        console.log('Role:', users[0].role);
      }
      
      // Check retest requests
      db.query('SELECT * FROM retest_requests WHERE bug_id = 14 ORDER BY requested_at DESC', (err, retests) => {
        console.log('\n=== RETEST REQUESTS ===');
        if (err) {
          console.error('Error:', err);
        } else if (retests.length === 0) {
          console.log('No retest requests found for bug #14');
        } else {
          console.log(`Found ${retests.length} retest request(s):`);
          retests.forEach(r => {
            console.log(`- ID: ${r.id}, Requested by: ${r.requested_by}, Status: ${r.status}, Date: ${r.requested_at}`);
          });
        }
        
        // Check notifications
        db.query('SELECT * FROM notifications WHERE type = "retest_request" ORDER BY created_at DESC LIMIT 5', (err, notifications) => {
          console.log('\n=== RECENT RETEST NOTIFICATIONS ===');
          if (err) {
            console.error('Error:', err);
          } else if (notifications.length === 0) {
            console.log('No retest notifications found in system');
          } else {
            notifications.forEach(n => {
              console.log(`- To User: ${n.user_id}, Title: ${n.title}, Read: ${n.is_read}, Date: ${n.created_at}`);
            });
          }
          
          process.exit(0);
        });
      });
    });
  } else {
    console.log('\nBug has no reporter (reported_by is NULL)');
    
    // Check retest requests anyway
    db.query('SELECT * FROM retest_requests WHERE bug_id = 14', (err, retests) => {
      console.log('\n=== RETEST REQUESTS ===');
      if (retests && retests.length > 0) {
        retests.forEach(r => {
          console.log(`- ID: ${r.id}, Requested by: ${r.requested_by}, Status: ${r.status}`);
        });
      } else {
        console.log('No retest requests found');
      }
      process.exit(0);
    });
  }
});
