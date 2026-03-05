const normalizeApiUrl = (url) => {
  if (!url) return 'http://localhost:5000/api';

  const trimmed = url.trim().replace(/\/+$/, '');

  // Keep existing /api suffix if already provided
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  return `${trimmed}/api`;
};

const config = {
  // API Configuration
  API_URL: normalizeApiUrl(process.env.REACT_APP_API_URL || 'http://localhost:5000/api'),
  
  // Environment
  ENV: process.env.REACT_APP_ENV || 'development',
  IS_PRODUCTION: process.env.REACT_APP_ENV === 'production',
  IS_DEVELOPMENT: process.env.REACT_APP_ENV === 'development',
  
  // Logging
  LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL || 'info',
  
  // Feature Flags
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG: process.env.REACT_APP_ENABLE_DEBUG === 'true',
  
  // App Info
  APP_NAME: 'TestTrack Pro',
  APP_VERSION: '1.0.0'
};

// Validation
if (!config.API_URL) {
  console.warn('⚠️ REACT_APP_API_URL is not defined. Using default:', config.API_URL);
}

// Log configuration in development
if (config.IS_DEVELOPMENT && config.ENABLE_DEBUG) {
  console.log('🔧 App Configuration:', config);
}

export default config;
