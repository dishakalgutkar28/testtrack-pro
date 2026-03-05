/**
 * Test Notification System
 * Tests automatic notifications on bug assignment, comments, and status changes
 */

const db = require("./config/db");
const NotificationService = require("./services/notificationService");

async function runTests() {
  console.log("\n========================================");
  console.log("   TESTING NOTIFICATION SYSTEM");
  console.log("========================================\n");

  try {
    // Test 1: Check existing notifications
    console.log("TEST 1: Checking existing notifications in database...");
    const checkNotifications = async () => {
      return new Promise((resolve, reject) => {
        db.query("SELECT id, type, user_id, title FROM notifications ORDER BY id DESC LIMIT 5", (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
    };

    const existingNotifications = await checkNotifications();
    console.log(`✓ Found ${existingNotifications.length} notifications:`);
    existingNotifications.forEach((n) => {
      console.log(`  - [${n.type}] ${n.title} (User: ${n.user_id})`);
    });

    // Test 2: Send a test notification
    console.log("\nTEST 2: Sending test notification...");
    try {
      const testNotif = await NotificationService.sendNotification({
        userId: 1,
        senderId: 2,
        type: "system",
        title: "Test Notification",
        message: "This is a test notification from the notification service",
        link: null
      });
      console.log(`✓ Test notification sent: ID ${testNotif.notificationId}`);
    } catch (error) {
      console.log(`✗ Failed to send test notification: ${error.message}`);
    }

    // Test 3: Get unread count
    console.log("\nTEST 3: Getting unread notification count for user 1...");
    try {
      const unreadCount = await NotificationService.getUnreadCount(1);
      console.log(`✓ User 1 has ${unreadCount} unread notifications`);
    } catch (error) {
      console.log(`✗ Failed to get unread count: ${error.message}`);
    }

    // Test 4: Test bug assignment notification
    console.log("\nTEST 4: Testing bug assignment notification...");
    try {
      await NotificationService.notifyBugAssignment(
        1, // bugId
        2, // assigneeId
        1, // assignedBy
        "Login page crash on mobile" // bugTitle
      );
      console.log("✓ Bug assignment notification sent");

      // Verify it was created
      const notif = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM notifications WHERE type = 'bug_assigned' AND user_id = 2 ORDER BY id DESC LIMIT 1",
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
          }
        );
      });

      if (notif) {
        console.log(`✓ Verified: ${notif.title} - ${notif.message}`);
      }
    } catch (error) {
      console.log(`✗ Bug assignment notification test failed: ${error.message}`);
    }

    // Test 5: Test status change notification
    console.log("\nTEST 5: Testing bug status change notification...");
    try {
      await NotificationService.notifyBugStatusChange(
        1, // bugId
        2, // bugOwnerId
        1, // changedBy
        "Login page crash on mobile", // bugTitle
        "open", // oldStatus
        "in_progress" // newStatus
      );
      console.log("✓ Bug status change notification sent");

      const notif = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM notifications WHERE type = 'bug_status_changed' AND user_id = 2 ORDER BY id DESC LIMIT 1",
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
          }
        );
      });

      if (notif) {
        console.log(`✓ Verified: ${notif.title} - ${notif.message}`);
      }
    } catch (error) {
      console.log(`✗ Bug status change notification test failed: ${error.message}`);
    }

    // Test 6: Test comment notification
    console.log("\nTEST 6: Testing comment notification...");
    try {
      await NotificationService.notifyCommentAdded(
        1, // bugId
        1, // commenterId
        2, // targetUserId
        "This looks like a critical issue affecting user authentication. Let me investigate further and provide more details." // commentText
      );
      console.log("✓ Comment notification sent");

      const notif = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM notifications WHERE type = 'comment_added' AND user_id = 2 ORDER BY id DESC LIMIT 1",
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
          }
        );
      });

      if (notif) {
        console.log(`✓ Verified: ${notif.title}`);
        console.log(`  Message: ${notif.message}`);
      }
    } catch (error) {
      console.log(`✗ Comment notification test failed: ${error.message}`);
    }

    // Test 7: Test project assignment notification
    console.log("\nTEST 7: Testing project assignment notification...");
    try {
      await NotificationService.notifyProjectAssignment(
        1, // projectId
        3, // userId
        1, // addedBy
        "Mobile App Testing" // projectName
      );
      console.log("✓ Project assignment notification sent");

      const notif = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM notifications WHERE type = 'testcase_assigned' AND user_id = 3 ORDER BY id DESC LIMIT 1",
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
          }
        );
      });

      if (notif) {
        console.log(`✓ Verified: ${notif.title} - ${notif.message}`);
      }
    } catch (error) {
      console.log(`✗ Project assignment notification test failed: ${error.message}`);
    }

    // Test 8: Test bulk notification
    console.log("\nTEST 8: Testing bulk notification...");
    try {
      await NotificationService.notifyMultiple([1, 2, 3], {
        senderId: 1,
        type: "system",
        title: "System Maintenance",
        message: "System maintenance scheduled for tonight 10 PM - 12 AM",
        link: null
      });
      console.log("✓ Bulk notifications sent to 3 users");

      const count = await new Promise((resolve, reject) => {
        db.query(
          "SELECT COUNT(*) as count FROM notifications WHERE title = 'System Maintenance'",
          (err, results) => {
            if (err) reject(err);
            else resolve(results[0].count);
          }
        );
      });

      console.log(`✓ Verified: ${count} system maintenance notifications created`);
    } catch (error) {
      console.log(`✗ Bulk notification test failed: ${error.message}`);
    }

    // Test 9: List all notification types
    console.log("\nTEST 9: Listing all notification types in system...");
    try {
      const types = await new Promise((resolve, reject) => {
        db.query("SELECT DISTINCT type, COUNT(*) as count FROM notifications GROUP BY type", (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      console.log("✓ Notification types found:");
      types.forEach((t) => {
        console.log(`  - ${t.type}: ${t.count} notifications`);
      });

      const totalCount = types.reduce((sum, t) => sum + t.count, 0);
      console.log(`  Total: ${totalCount} notifications`);
    } catch (error) {
      console.log(`✗ Failed to list types: ${error.message}`);
    }

    // Test 10: Verify notification structure
    console.log("\nTEST 10: Verifying notification table structure...");
    try {
      const oneNotif = await new Promise((resolve, reject) => {
        db.query("SELECT * FROM notifications LIMIT 1", (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      });

      if (oneNotif) {
        console.log("✓ Notification structure verified:");
        Object.keys(oneNotif).forEach((key) => {
          console.log(`  - ${key}: ${oneNotif[key]}`);
        });
      }
    } catch (error) {
      console.log(`✗ Failed to verify structure: ${error.message}`);
    }

    console.log("\n========================================");
    console.log("   TEST SUITE COMPLETE");
    console.log("========================================\n");
  } catch (error) {
    console.error("Test suite error:", error);
  } finally {
    db.end();
  }
}

// Run tests
runTests();
