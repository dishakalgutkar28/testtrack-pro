require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { sendEmail } = require('./utils/emailService');

async function main() {
  const to = process.argv[2];

  if (!to) {
    console.error('Usage: node test-email-send.js <recipient-email>');
    process.exit(1);
  }

  try {
    console.log('Sending test email to:', to);
    const result = await sendEmail(
      to,
      'TestTrack Pro SMTP Test',
      '<p>This is a direct SMTP test from TestTrack Pro.</p>',
      'This is a direct SMTP test from TestTrack Pro.'
    );
    console.log('Email sent successfully:', result);
    process.exit(0);
  } catch (error) {
    console.error('SMTP test failed:', error.message);
    if (error.response) {
      console.error('SMTP response:', error.response);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

main();
