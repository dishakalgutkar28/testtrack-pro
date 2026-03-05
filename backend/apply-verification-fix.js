const db = require('./config/db');

console.log('🔧 Fixing email verification status...\n');

// Mark all old accounts (without tokens) as verified
// This allows existing users to continue working normally
db.query(`
  UPDATE users 
  SET email_verified = TRUE 
  WHERE email_verification_token IS NULL 
  AND email_verified = FALSE
`, (err, result) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.end();
    return;
  }

  console.log(`✅ Updated ${result.affectedRows} existing accounts to verified status`);
  console.log('   These users can now login normally.\n');

  // Show remaining unverified accounts
  db.query(`
    SELECT email, role, email_verification_token IS NOT NULL as has_token
    FROM users
    WHERE email_verified = FALSE
  `, (err2, unverified) => {
    if (err2) {
      console.error('❌ Error:', err2.message);
    } else if (unverified.length > 0) {
      console.log('🔒 Accounts still requiring email verification:');
      unverified.forEach(u => {
        console.log(`   - ${u.email} (${u.role}) - Token: ${u.has_token ? 'Yes' : 'Missing!'}`);
      });
      console.log('\nThese users must verify their email before logging in.\n');
    } else {
      console.log('✅ All accounts are now verified!\n');
    }
    
    db.end();
  });
});
