/**
 * Delete specific user by email
 */

require('dotenv').config();
const db = require('./config/db');

const emailToDelete = 'prateekgaonkar55@gmail.com';

console.log(`\n🗑️  Deleting user: ${emailToDelete}\n`);

const query = 'DELETE FROM users WHERE email = ?';

db.query(query, [emailToDelete], (err, result) => {
  if (err) {
    console.error('❌ Error deleting user:', err.message);
    db.end();
    process.exit(1);
  }

  if (result.affectedRows === 0) {
    console.log('⚠️  User not found in database.');
  } else {
    console.log(`✅ Successfully deleted user: ${emailToDelete}`);
    console.log(`   Rows deleted: ${result.affectedRows}\n`);
  }

  db.end();
  process.exit(0);
});
