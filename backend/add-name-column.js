require('dotenv').config();
const db = require('./config/db');

const checkColumnQuery = `
  SELECT COUNT(*) AS cnt
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'name'
`;

db.query(checkColumnQuery, (checkErr, rows) => {
  if (checkErr) {
    console.error('Check error:', checkErr.message);
    db.end();
    process.exit(1);
  }

  if (rows[0].cnt > 0) {
    console.log('users.name column already exists');
    db.end();
    process.exit(0);
  }

  db.query('ALTER TABLE users ADD COLUMN name VARCHAR(100) NULL AFTER id', (alterErr) => {
    if (alterErr) {
      console.error('Migration error:', alterErr.message);
      db.end();
      process.exit(1);
    }

    console.log('users.name column added');
    db.end();
    process.exit(0);
  });
});
