const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middlewares/authMiddleware'); // FIXED: destructure protect
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to sensitive routes
router.use('/login', authLimiter);
router.use('/register', authLimiter);

// Health check for auth service
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;
    
    res.json({
      success: true,
      message: 'Auth service is healthy',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Auth service health check failed',
      status: 'unhealthy'
    });
  }
});

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Registration request received');
    console.log('Request body:', { ...req.body, password: '[REDACTED]', passwordConfirm: '[REDACTED]' });

    const { name, username, email, password, passwordConfirm, role = 'user' } = req.body;
    const actualName = name || username;

    // Validation - check all required fields
    if (!actualName || !email || !password || !passwordConfirm) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        missing: {
          name: !actualName,
          email: !email,
          password: !password,
          passwordConfirm: !passwordConfirm
        }
      });
    }

    // Validate password confirmation
    if (password !== passwordConfirm) {
      console.log('❌ Password confirmation mismatch');
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Validate role
    const validRoles = ['user', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'user';

    // Create user
    console.log('👤 Creating user...');
    const user = await User.create({
      name: actualName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: userRole,
      status: 'active',
      createdAt: new Date(),
      lastLogin: null
    });

    console.log('✅ User created successfully:', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    user.password = undefined;

    console.log('✅ Registration successful for:', user.email);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      data: { user }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login request received');
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user and include password for comparison
    console.log('👤 Finding user:', email);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (user.status === 'inactive') {
      console.log('❌ Account inactive:', email);
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    console.log('🔒 Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    user.password = undefined;

    console.log('✅ Login successful for:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: { user }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user endpoint - FIXED: use protect instead of auth
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

// Logout endpoint - FIXED: use protect instead of auth
router.post('/logout', protect, async (req, res) => {
  try {
    // Token blacklisting could be implemented here
    // For now, just send success response
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

module.exports = router;