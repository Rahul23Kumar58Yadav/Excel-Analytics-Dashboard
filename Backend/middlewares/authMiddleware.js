// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader || 'None');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.',
      });
    }

    const token = authHeader.substring(7);
    console.log('Token:', token ? `${token.substring(0, 20)}...` : 'No token');

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);

    const user = await User.findById(decoded.userId).select('-password');
    console.log('User from DB:', user ? user._id : 'Not found');

    if (!user) {
      console.log('User not found for userId:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Token is invalid. User not found.',
      });
    }

    if (user.status && user.status !== 'active') {
      console.log('Account inactive for userId:', decoded.userId);
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.',
      });
    }

    req.user = {
      _id: user._id,
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message, error.stack);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please sign in again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please sign in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: `Authentication error: ${error.message}`,
    });
  }
};


// Admin auth middleware
const requireAdminAuth = (req, res, next) => {
  console.log('🔒 Checking admin access for user:', req.user);
  
  // Ensure protect middleware has run and req.user exists
  if (!req.user) {
    console.log('❌ No user in request - authentication required');
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    console.log('❌ Access denied - user role:', req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  console.log('✅ Admin access granted for:', req.user.email);
  next();
};

// Optional: User auth middleware (for user-only routes)
const requireUserAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!['user', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Valid user account required.',
    });
  }

  next();
};

module.exports = { 
  protect, 
  requireAdminAuth, 
  requireUserAuth 
};