// app.js
require('express-async-errors');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load environment variables and config
const config = require('./config/config');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const fileRoutes = require('./routes/fileRoutes');
const chartRoutes = require('./routes/chartRoutes');
const analyticRoutes = require('./routes/analyticRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notifications')

// Middleware
const errorHandler = require('./middlewares/errorHandler');
const { protect } = require('./middlewares/authMiddleware');

// Initialize Express app
const app = express();

// 1) GLOBAL MIDDLEWARES

// Enable CORS - FIXED CONFIGURATION
const allowedOrigins = [
  config.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"].concat(allowedOrigins) // Add allowed origins to connect-src
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Development logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting (exclude authenticated requests to /api/v1/files and /api/v1/charts)
const limiter = rateLimit({
  max: 500, // Increased from 200
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour',
  skip: (req) => {
    // Skip rate limiting for authenticated requests to specific endpoints
    const isAuthenticated = !!req.headers.authorization?.startsWith('Bearer ');
    const isExcludedPath = req.path.startsWith('/api/v1/files') || req.path.startsWith('/api/v1/charts');
    return isAuthenticated && isExcludedPath;
  }
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// File upload directory
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// 2) DATABASE CONNECTION
connectDB();

// 3) ROUTES
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/files', protect, fileRoutes);
app.use('/api/v1/charts', protect, chartRoutes);
app.use('/api/v1/analytics', protect, analyticRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// Serve static assets in production
if (config.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// 4) ERROR HANDLING MIDDLEWARE
app.use(errorHandler);

// 5) START SERVER
const server = app.listen(config.PORT, () => {
  console.log(`
  ################################################
  🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}
  ################################################
  `);
  console.log(`CORS configured for origins: ${allowedOrigins.join(', ')}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

module.exports = app;