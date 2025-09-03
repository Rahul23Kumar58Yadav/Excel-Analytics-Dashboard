const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Environment file path
const envPath = path.join(__dirname, 'config.env');

// Verify file exists
if (!fs.existsSync(envPath)) {
  console.error(`[FATAL] Missing environment file at: ${envPath}`);
  process.exit(1);
}

// Load environment variables
const envConfig = dotenv.config({ path: envPath });
if (envConfig.error) {
  console.error('[FATAL] Error loading env variables:', envConfig.error);
  process.exit(1);
}

// Validate required variables
const requiredVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'PORT'
];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('[FATAL] Missing required variables:', missingVars.join(', '));
  process.exit(1);
}

module.exports = {
  // Application Config
   NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  
  // MongoDB Config
  mongo: {
    uri: process.env.MONGO_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    }
  },

  // Email Config
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM
  }
};