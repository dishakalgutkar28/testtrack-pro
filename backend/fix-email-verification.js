const db = require('./config/db');

console.log('🔍 Checking email verification setup...\n');

// Check if column exists and user states
db.query(`
  SELECT 
    email,
    role,
    email_verified,
    email_verification_token IS NOT NULL as has_token
  FROM users
  ORDER BY id
`, (err, results) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.end();
    return;
  }

  console.log('📊 Current User States:');
  console.log('='.repeat(80));
  results.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Verified: ${user.email_verified} (${typeof user.email_verified})`);
    console.log(`  Has Token: ${user.has_token ? 'Yes' : 'No'}`);
    console.log('-'.repeat(80));
  });

  console.log('\n📝 Recommendations:');
  console.log('='.repeat(80));

  const nullVerified = results.filter(u => u.email_verified === null);
  if (nullVerified.length > 0) {
    console.log(`⚠️  ${nullVerified.length} users have NULL email_verified status`);
    console.log('   These are existing users from before email verification was added.');
    console.log('   They can login normally (NULL is treated as verified).\n');
    console.log('   To require verification, run:');
    console.log('   UPDATE users SET email_verified=FALSE WHERE email_verified IS NULL;\n');
  }

  const unverified = results.filter(u => u.email_verified === 0 || u.email_verified === false);
  if (unverified.length > 0) {
    console.log(`🔒 ${unverified.length} users need email verification:`);
    unverified.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
      if (!u.has_token) {
        console.log(`     ⚠️  No verification token! Need to regenerate.`);
      }
    });
    console.log();
  }

  const verified = results.filter(u => u.email_verified === 1 || u.email_verified === true);
  if (verified.length > 0) {
    console.log(`✅ ${verified.length} users are verified and can login.\n`);
  }

  db.end();
});
