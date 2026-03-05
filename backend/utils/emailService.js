/**
 * Email Service Utility
 * Supports both development (console logging) and production (SMTP/SendGrid/Gmail)
 */

let nodemailer;
try {
  nodemailer = require('nodemailer');
  console.log('✅ Nodemailer loaded successfully');
} catch (err) {
  console.error('❌ Failed to load nodemailer:', err.message);
  console.error('   Run: npm install nodemailer');
  process.exit(1);
}

const logger = require('./logger');

/**
 * Create email transporter based on environment
 */
const createTransporter = () => {
  console.log('📧 Creating email transporter...');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
  
  // Development mode - use console logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('   Mode: DEVELOPMENT (console logging)');
    return {
      sendMail: async (mailOptions) => {
        console.log('\n========== EMAIL (DEVELOPMENT) ==========');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log('----------------------------');
        console.log(mailOptions.text || mailOptions.html);
        console.log('=========================================\n');
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }

  // Production mode - configure based on email provider
  console.log('   Mode: PRODUCTION (real email)');
  
  try {
    // Gmail specific configuration
    if (process.env.EMAIL_PROVIDER === 'gmail') {
      console.log('   Using Gmail configuration');
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
    }

    // SendGrid configuration
    if (process.env.EMAIL_PROVIDER === 'sendgrid') {
      console.log('   Using SendGrid configuration');
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    }

    // AWS SES configuration
    if (process.env.EMAIL_PROVIDER === 'ses') {
      console.log('   Using AWS SES configuration');
      return nodemailer.createTransport({
        host: process.env.SES_SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SES_SMTP_USER,
          pass: process.env.SES_SMTP_PASS
        }
      });
    }

    // Generic SMTP configuration (default for Brevo, etc.)
    console.log('   Using Generic SMTP configuration');
    console.log('   SMTP_HOST:', process.env.SMTP_HOST);
    console.log('   SMTP_PORT:', process.env.SMTP_PORT);
    
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    return nodemailer.createTransport(emailConfig);
  } catch (error) {
    console.error('❌ Error creating email transporter:', error.message);
    throw error;
  }
};

let transporter = null;

try {
  transporter = createTransporter();
  console.log('✅ Email transporter initialized successfully');
} catch (err) {
  console.error('❌ Failed to initialize email transporter:', err.message);
  console.error('   This is not critical for development mode');
}

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text content
 * @returns {Promise<Object>} - Send result
 */
const sendEmail = async (to, subject, html, text) => {
  try {
    if (!transporter) {
      throw new Error('Email transporter not initialized. Check email configuration.');
    }

    const fallbackFrom = process.env.SMTP_USER
      ? `TestTrack Pro <${process.env.SMTP_USER}>`
      : 'TestTrack Pro <noreply@testtrack.com>';

    const mailOptions = {
      from: process.env.EMAIL_FROM || fallbackFrom,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', { 
      to, 
      subject, 
      messageId: info.messageId,
      environment: process.env.NODE_ENV
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email', { 
      error: error.message, 
      to, 
      subject 
    });
    throw error;
  }
};

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const subject = 'Verify Your Email - TestTrack Pro';
  const text = `
Welcome to TestTrack Pro!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Welcome to TestTrack Pro!</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" 
         style="display: inline-block; padding: 12px 24px; background-color: #6366f1; 
                color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Verify Email
      </a>
      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <code>${verificationUrl}</code>
      </p>
      <p style="color: #666; font-size: 12px;">
        This link will expire in 24 hours.<br>
        If you didn't create an account, please ignore this email.
      </p>
    </div>
  `;

  return sendEmail(email, subject, html, text);
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const subject = 'Password Reset Request - TestTrack Pro';
  const text = `
You requested a password reset for your TestTrack Pro account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Password Reset Request</h2>
      <p>You requested a password reset for your TestTrack Pro account.</p>
      <a href="${resetUrl}" 
         style="display: inline-block; padding: 12px 24px; background-color: #6366f1; 
                color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Reset Password
      </a>
      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <code>${resetUrl}</code>
      </p>
      <p style="color: #666; font-size: 12px;">
        This link will expire in 1 hour.<br>
        If you didn't request this, please ignore this email and your password will remain unchanged.
      </p>
    </div>
  `;

  return sendEmail(email, subject, html, text);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};
