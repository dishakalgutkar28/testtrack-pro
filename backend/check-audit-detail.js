const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "testtrack",
});

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }

  console.log("📊 CHECKING AUDIT LOGS IN DATABASE...\n");

  // Count audit logs
  db.query("SELECT COUNT(*) as total FROM audit_logs", (err, countResult) => {
    if (err) {
      console.error("❌ Error counting audit logs:", err);
      db.end();
      process.exit(1);
    }

    console.log(`Total audit logs in database: ${countResult[0].total}\n`);

    if (countResult[0].total > 0) {
      // Show all audit logs
      db.query("SELECT * FROM audit_logs ORDER BY created_at DESC", (err, logs) => {
        if (err) {
          console.error("❌ Error fetching audit logs:", err);
        } else {
          console.log("📋 ALL AUDIT LOGS:");
          console.table(logs.map(log => ({
            ID: log.id,
            Action: log.action,
            User_ID: log.user_id,
            Target: `${log.target_type}:${log.target_id}`,
            Details: typeof log.details === 'string' ? 
              (log.details.length > 50 ? log.details.substring(0, 50) + "..." : log.details) : 
              JSON.stringify(log.details),
            Created: new Date(log.created_at).toLocaleString()
          })));
        }

        db.end();
      });
    } else {
      console.log("⚠️ No audit logs found in the database!");
      console.log("\n✅ This could mean:");
      console.log("   1. No admin actions have been performed yet");
      console.log("   2. There's an error inserting audit logs\n");
      
      db.end();
    }
  });
});
