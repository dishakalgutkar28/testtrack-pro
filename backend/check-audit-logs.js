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

  // Show audit_logs table structure
  db.query("DESCRIBE audit_logs", (err, structure) => {
    if (err) {
      console.error("Error:", err);
      db.end();
      process.exit(1);
    }

    console.log("\n📋 AUDIT_LOGS TABLE STRUCTURE:");
    console.table(structure);

    // Count current audit logs
    db.query("SELECT COUNT(*) as count FROM audit_logs", (err, countResult) => {
      if (err) {
        console.error("Error counting:", err);
      } else {
        console.log("\n📊 Current audit logs count:", countResult[0].count);
      }

      // Show sample if any exist
      db.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5", (err, logs) => {
        if (err) {
          console.error("Error fetching logs:", err);
        } else if (logs.length > 0) {
          console.log("\n🔍 RECENT AUDIT LOGS:");
          console.table(logs);
        } else {
          console.log("\n✅ Audit logs table exists but is empty (no admin actions yet)");
        }

        db.end();
      });
    });
  });
});
