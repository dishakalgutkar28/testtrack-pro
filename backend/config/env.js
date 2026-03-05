/**
 * Environment Variables Validation and Configuration
 * 
 * This module validates that all required environment variables are set
 * and provides a centralized configuration object for the application.
 */

const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET'
];

const optionalEnvVars = [
  'NODE_ENV',
  'PORT',
  'DB_PORT',
  'DB_POOL_LIMIT',
  'DB_CONNECTION_TIMEOUT',
  'JWT_EXPIRY',
  'REFRESH_SECRET',
  'REFRESH_EXPIRY',
  'FRONTEND_URL',
  'CORS_ORIGIN',
  'EMAIL_SERVICE',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'LOG_LEVEL'
];

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variable is missing
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ CRITICAL: Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Create a .env file based on .env.example');
    console.error('   Copy: cp .env.example .env\n');
    throw new Error('Missing required environment variables');
  }

  // Check for insecure defaults
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.includes('please_change_this')) {
    warnings.push('JWT_SECRET appears to be using default value - use a strong secret!');
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET is too short - use at least 32 characters');
  }

  if (process.env.REFRESH_SECRET && process.env.REFRESH_SECRET.length < 32) {
    warnings.push('REFRESH_SECRET is too short - use at least 32 characters');
  }

  if (process.env.DB_PASSWORD === 'root' && process.env.NODE_ENV === 'production') {
    warnings.push('Using default DB_PASSWORD in production is INSECURE');
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Security warnings:');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
    console.warn('');
  }

  // Success message
  console.log('✅ Environment variables validated');
  
  // Log configuration (without sensitive data)
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📋 Configuration:');
    console.log(`   Environment: ${config.env}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    console.log(`   Frontend URL: ${config.frontendUrl}`);
    console.log('');
  }
}

/**
 * Centralized configuration object
 * All environment variables are accessed through this object
 */
const config = {
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  
  // Database
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    poolLimit: parseInt(process.env.DB_POOL_LIMIT || '10'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000')
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiry: process.env.JWT_EXPIRY || '24h',
    refreshSecret: process.env.REFRESH_SECRET || process.env.JWT_SECRET,
    refreshExpiry: process.env.REFRESH_EXPIRY || '7d'
  },
  
  // Email
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    fromName: process.env.EMAIL_FROM_NAME || 'TestTrack Pro'
  },
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true' || true
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Helpers
  isDevelopment: () => config.env === 'development',
  isProduction: () => config.env === 'production',
  isTest: () => config.env === 'test'
};

module.exports = {
  validateEnv,
  config
};
