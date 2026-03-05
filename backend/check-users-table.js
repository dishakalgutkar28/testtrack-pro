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

  // Check table structure
  db.query("DESCRIBE users", (err, results) => {
    if (err) {
      console.error("Error describing table:", err);
      db.end();
      process.exit(1);
    }

    console.log("\n=== USERS TABLE STRUCTURE ===");
    console.table(results);

    // Check if is_active column exists
    const hasIsActive = results.some(col => col.Field === "is_active");
    console.log("\n✅ is_active column exists:", hasIsActive);

    // Count users
    db.query("SELECT COUNT(*) as count FROM users", (err, countResult) => {
      if (err) {
        console.error("Error counting users:", err);
      } else {
        console.log("📊 Total users in database:", countResult[0].count);
      }

      // Try to select with is_active
      db.query("SELECT id, email, role, is_active FROM users LIMIT 3", (err, users) => {
        if (err) {
          console.error("\n❌ Error selecting users with is_active:", err.message);
        } else {
          console.log("\n=== SAMPLE USERS ===");
          console.table(users);
        }

        db.end();
      });
    });
  });
});
