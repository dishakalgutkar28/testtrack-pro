require('dotenv').config({ path: '.env' });
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306)
});

db.query(
  "SELECT id, name, email, password, role, is_active, email_verified FROM users WHERE email = ?",
  ['admin@test.com'],
  (err, rows) => {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }

    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  }
);