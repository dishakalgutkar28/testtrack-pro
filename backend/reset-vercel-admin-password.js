/**
 * IMPORTANT: Before running this:
 * 1. Update the DB credentials below with your VERCEL database credentials
 * 2. Make sure you have the correct database host (likely from railway.app or vercel.com)
 * 3. You can find these in your Vercel environment variables or Railway dashboard
 */

const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// ⚠️  REPLACE WITH YOUR VERCEL DATABASE CREDENTIALS
const connection = mysql.createConnection({
  host: 'mysql-ijzv.railway.internal',  // CHANGE THIS
  user: 'root',                              // CHANGE THIS
  password: 'ABaULCOiLMPuJKkGOzxkjiHZyNjgqFTE',                 // CHANGE THIS
  database: 'railway',                     // CHANGE THIS
  port: 3306                                 // CHANGE THIS
});

const ADMIN_EMAIL = 'admin@test.com';
const NEW_PASSWORD = 'Admin@12345'; // Change this to your desired password

connection.connect((err) => {
  if (err) {
    console.error('❌ Cannot connect to Vercel database!');
    console.error('Error:', err.message);
    console.error('\n📋 Make sure you update the credentials above:');
    console.error('   - host: Your Vercel database host');
    console.error('   - user: Database username');
    console.error('   - password: Database password');
    process.exit(1);
  }
  console.log('✅ Connected to Vercel database\n');

  // First check if admin exists
  connection.query(
    "SELECT id, email, role FROM users WHERE email = ?",
    [ADMIN_EMAIL],
    async (err, results) => {
      if (err) {
        console.error('❌ Error:', err.message);
        connection.end();
        process.exit(1);
      }

      if (results.length === 0) {
        console.log(`❌ Admin user "${ADMIN_EMAIL}" not found!`);
        console.log('\n📌 You need to:');
        console.log('   1. Register a new account at your Vercel URL');
        console.log('   2. Then run: node add-admin-to-vercel.js');
        connection.end();
        process.exit(0);
      }

      const admin = results[0];
      console.log(`Found admin: ${admin.email} (ID: ${admin.id})\n`);

      // Hash new password
      const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

      // Update password
      connection.query(
        "UPDATE users SET password = ?, role = 'admin', is_active = 1, email_verified = 1 WHERE email = ?",
        [hashedPassword, ADMIN_EMAIL],
        (updateErr) => {
          if (updateErr) {
            console.error('❌ Failed to update:', updateErr.message);
            connection.end();
            process.exit(1);
          }

          console.log('✅ Admin password reset successfully!');
          console.log('\n📝 Login credentials for Vercel:');
          console.log(`   Email: ${ADMIN_EMAIL}`);
          console.log(`   Password: ${NEW_PASSWORD}`);
          console.log('\n🔒 Remember to:');
          console.log('   1. Save these credentials securely');
          console.log('   2. Change password after first login');
          
          connection.end();
          process.exit(0);
        }
      );
    }
  );
});
