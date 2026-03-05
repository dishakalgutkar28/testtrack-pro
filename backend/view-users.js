/**
 * View all users in the database
 */

require('dotenv').config();
const db = require('./config/db');

console.log('\n📋 Fetching all users from database...\n');

const query = 'SELECT id, email, role, email_verified, is_active FROM users ORDER BY id';

db.query(query, (err, results) => {
  if (err) {
    console.error('❌ Error fetching users:', err.message);
    process.exit(1);
  }

  if (results.length === 0) {
    console.log('No users found in database.');
    process.exit(0);
  }

  console.log('┌─────┬──────────────────────────────────┬───────────┬──────────────┬───────────┐');
  console.log('│ ID  │ Email                            │ Role      │ Verified     │ Active    │');
  console.log('├─────┼──────────────────────────────────┼───────────┼──────────────┼───────────┤');

  results.forEach(user => {
    const id = String(user.id).padEnd(3);
    const email = String(user.email || '').padEnd(32).substring(0, 32);
    const role = String(user.role || 'tester').padEnd(9);
    const verified = user.email_verified ? 'Yes' : 'No';
    const verifiedPad = verified.padEnd(12);
    const active = user.is_active ? 'Yes' : 'No';
    const activePad = active.padEnd(9);
    
    console.log(`│ ${id} │ ${email} │ ${role} │ ${verifiedPad} │ ${activePad} │`);
  });

  console.log('└─────┴──────────────────────────────────┴───────────┴──────────────┴───────────┘');
  console.log(`\nTotal users: ${results.length}\n`);
  
  db.end();
  process.exit(0);
});
