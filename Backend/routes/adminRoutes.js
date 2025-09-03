// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getFiles,
  deleteFile,
  downloadFile,
  uploadFile,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAdminProfile,
  updateAdminProfile,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getSystemHealth,
  uploadMiddleware
} = require('../controllers/adminController');
const { protect, requireAdminAuth } = require('../middlewares/authMiddleware');

// Apply authentication middlewares to all routes
router.use(protect, requireAdminAuth);

// Dashboard Routes
router.get('/dashboard/stats', getDashboardStats);

// File Management Routes
router.get('/files', getFiles);
router.post('/files/upload', uploadMiddleware, uploadFile);
router.get('/files/:id/download', downloadFile);
router.delete('/files/:id', deleteFile);

// User Management Routes
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Admin Profile Routes
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

// Notifications Routes
router.get('/notifications', getNotifications);
router.patch('/notifications/:notificationId/read', markNotificationAsRead);
router.patch('/notifications/mark-all-read', markAllNotificationsAsRead);

// System Health Route
router.get('/health', getSystemHealth);

module.exports = router;