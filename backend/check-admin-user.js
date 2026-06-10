const mysql = require('mysql2');
require('dotenv').config();

// Connect to RAILWAY PRODUCTION DATABASE
const connection = mysql.createConnection({
  host: 'mysql-ijzv.railway.internal',
  user: 'root',
  password: 'ABaULCOiLMPuJKkGOzxkjiHZyNjgqFTE',
  database: 'railway',
  port: 3306
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database Connection Error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database\n');

  // Check all admin users
  connection.query(
    "SELECT id, email, role, is_active, email_verified FROM users WHERE email = 'admin@test.com'",
    (err, results) => {
      if (err) {
        console.error('❌ Query Error:', err.message);
        process.exit(1);
      }

      if (results.length === 0) {
        console.log('❌ NO ADMIN USER FOUND!');
        console.log('\nYou need to create an admin user. Use: node register-test-user.js');
      } else {
        console.log('✅ Admin user found:\n');
        console.table(results);

        // Show why login might fail
        console.log('\n--- Login Troubleshooting ---');
        results.forEach(admin => {
          const reasons = [];
          if (admin.is_active === 0 || admin.is_active === false) reasons.push('❌ Account is INACTIVE (is_active=0)');
          if (admin.email_verified === 0 || admin.email_verified === false) reasons.push('⚠️  Email NOT verified (email_verified=0)');
          
          if (reasons.length === 0) {
            console.log(`✅ ${admin.email} (${admin.role}) - Should be able to login`);
          } else {
            console.log(`\n⚠️  ${admin.email} (${admin.role}) - LOGIN WILL FAIL:`);
            reasons.forEach(r => console.log('   ' + r));
            console.log('\n🔧 FIX: Run this command:');
            console.log('   node fix-admin-account.js');
          }
        });
      }

      connection.end();
      process.exit(0);
    }
  );
});
