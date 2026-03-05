const jwt = require('jsonwebtoken');

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.log('Usage: node test-admin-token.js <your_token>');
  console.log('\nTo get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Console tab');
  console.log('3. Type: localStorage.getItem("token")');
  console.log('4. Copy the token (without quotes)');
  console.log('5. Run: node test-admin-token.js YOUR_TOKEN_HERE');
  process.exit(1);
}

console.log('\n=== TOKEN VERIFICATION ===\n');

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ Token is VALID\n');
  console.log('User Details:');
  console.log('  Email:', decoded.email);
  console.log('  Role:', decoded.role);
  console.log('  User ID:', decoded.id);
  console.log('\nExpiration:', new Date(decoded.exp * 1000).toLocaleString());
  
  if (decoded.role === 'admin') {
    console.log('\n✅ User has ADMIN role - should be able to assign test cases');
  } else {
    console.log(`\n❌ User has ${decoded.role} role - NOT ADMIN!`);
    console.log('   You need to login with an admin account');
  }
} catch (err) {
  console.log('❌ Token is INVALID\n');
  console.log('Error:', err.message);
  
  if (err.name === 'TokenExpiredError') {
    console.log('\n⚠️  Your token has EXPIRED');
    console.log('   Please logout and login again');
  } else {
    console.log('\n⚠️  Token verification failed');
    console.log('   Please logout and login again');
  }
}

console.log('\n');
