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

  // Check notifications table structure
  db.query("DESCRIBE notifications", (err, results) => {
    if (err) {
      console.error("Error describing notifications table:", err);
      db.end();
      process.exit(1);
    }

    console.log("📋 NOTIFICATIONS TABLE STRUCTURE:");
    console.table(results);
    db.end();
  });
});
