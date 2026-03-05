require('dotenv').config();
const db = require('./config/db');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node get-verification-link.js <email>');
  process.exit(1);
}

db.query(
  'SELECT id, email, email_verified, email_verification_token FROM users WHERE email=? ORDER BY id DESC LIMIT 1',
  [email],
  (err, rows) => {
    if (err) {
      console.error('DB error:', err.message);
      process.exit(1);
    }

    if (!rows.length) {
      console.log('User not found');
      process.exit(0);
    }

    const user = rows[0];
    console.log('User:', user.email, 'verified=', !!user.email_verified);

    if (user.email_verified) {
      console.log('Already verified.');
      process.exit(0);
    }

    if (!user.email_verification_token) {
      console.log('No token found. Call /api/resend-verification first.');
      process.exit(0);
    }

    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${base}/verify-email?token=${user.email_verification_token}`;
    console.log('Verification link:');
    console.log(link);
    process.exit(0);
  }
);
