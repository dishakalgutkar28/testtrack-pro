require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const http = require('http');

const unique = Date.now();
const payload = JSON.stringify({
  email: `autotest_${unique}@gmail.com`,
  password: 'TestPass@123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});

req.on('error', (err) => {
  console.error('REQUEST ERROR:', err.message);
});

req.write(payload);
req.end();
