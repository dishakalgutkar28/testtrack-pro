/**
 * IMPORTANT: Run this if admin user doesn't exist in Vercel at all
 * 1. Update DB credentials below
 * 2. This will CREATE a new admin user with the credentials below
 */

const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// ⚠️  REPLACE WITH YOUR VERCEL DATABASE CREDENTIALS
const connection = mysql.createConnection({
  host: 'your-vercel-db-host.railway.app',  // CHANGE THIS
  user: 'root',                              // CHANGE THIS
  password: 'your-password',                 // CHANGE THIS
  database: 'testtrack',                     // CHANGE THIS
  port: 3306                                 // CHANGE THIS
});

const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'Admin@12345'; // Change this

connection.connect((err) => {
  if (err) {
    console.error('❌ Cannot connect to Vercel database!');
    console.error('Error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to Vercel database\n');

  // Check if admin already exists
  connection.query(
    "SELECT id FROM users WHERE email = ?",
    [ADMIN_EMAIL],
    async (err, results) => {
      if (err) {
        console.error('❌ Error:', err.message);
        connection.end();
        process.exit(1);
      }

      if (results.length > 0) {
        console.log(`⚠️  Admin user "${ADMIN_EMAIL}" already exists!`);
        console.log('Run this instead: node reset-vercel-admin-password.js');
        connection.end();
        process.exit(0);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

      // Create admin user
      connection.query(
        "INSERT INTO users (name, email, password, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?)",
        ['Admin', ADMIN_EMAIL, hashedPassword, 'admin', 1, 1],
        (insertErr) => {
          if (insertErr) {
            console.error('❌ Failed to create admin:', insertErr.message);
            connection.end();
            process.exit(1);
          }

          console.log('✅ Admin user created successfully!');
          console.log('\n📝 Login credentials for Vercel:');
          console.log(`   Email: ${ADMIN_EMAIL}`);
          console.log(`   Password: ${ADMIN_PASSWORD}`);
          console.log('\n🔒 Security tip: Change password after first login');
          
          connection.end();
          process.exit(0);
        }
      );
    }
  );
});
