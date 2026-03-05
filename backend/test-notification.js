const db = require('./config/db');
const NotificationService = require('./services/notificationService');

async function testNotification() {
  console.log('Testing notification sending...\n');
  
  try {
    // Get a tester
    const testers = await new Promise((resolve, reject) => {
      db.query("SELECT id, email FROM users WHERE role = 'tester' LIMIT 1", (err, results) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    
    if (testers.length === 0) {
      console.log('❌ No testers found in database');
      process.exit(1);
    }
    
    console.log(`✓ Found tester: ${testers[0].email} (ID: ${testers[0].id})`);
    console.log(`\nSending test notification...`);
    
    const result = await NotificationService.sendNotification({
      userId: testers[0].id,
      type: "retest_request",
      title: "Test: Re-test requested",
      message: "This is a test notification",
      link: "/bugs/14",
      senderId: 13 // developer ID
    });
    
    console.log('\n✓ Notification sent successfully!');
    console.log('Result:', result);
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR sending notification:');
    console.error(error);
    process.exit(1);
  }
}

// Wait for DB connection
setTimeout(testNotification, 1000);
