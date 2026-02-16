const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "testtrack"
});

db.connect(err => {
  if (err) console.log("DB error:", err);
  else console.log("Database connected");
});

module.exports = db;
