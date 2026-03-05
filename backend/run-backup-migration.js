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

  console.log("📝 Adding file_path and file_size columns to backups table...\n");

  // Check if columns already exist first
  db.query("DESCRIBE backups", (err, results) => {
    if (err) {
      console.error("❌ Failed to describe table:", err);
      db.end();
      process.exit(1);
    }

    const columns = results.map(r => r.Field);
    const hasFilePath = columns.includes('file_path');
    const hasFileSize = columns.includes('file_size');

    if (hasFilePath && hasFileSize) {
      console.log("✅ Columns already exist!");
      console.log("\n📋 backups table structure:");
      console.table(results);
      db.end();
      return;
    }

    // Build ALTER TABLE query
    let alterQueries = [];
    if (!hasFilePath) {
      alterQueries.push("ADD COLUMN file_path VARCHAR(255) NULL AFTER name");
    }
    if (!hasFileSize) {
      alterQueries.push("ADD COLUMN file_size BIGINT NULL AFTER " + (hasFilePath ? "file_path" : "name"));
    }

    if (alterQueries.length === 0) {
      console.log("✅ Nothing to add!");
      db.end();
      return;
    }

    const sql = `ALTER TABLE backups ${alterQueries.join(", ")}`;
    
    db.query(sql, (err) => {
      if (err) {
        console.error("❌ Migration failed:", err.message);
        db.end();
        process.exit(1);
      }

      console.log("✅ Columns added successfully!");
      
      // Verify the table structure
      db.query("DESCRIBE backups", (err, results) => {
        if (err) {
          console.error("Error describing table:", err);
        } else {
          console.log("\n📋 Updated backups table structure:");
          console.table(results);
        }
        
        db.end();
      });
    });
  });
});
