// routes/admin/notifications.js - Notification Routes
const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats
} = require('../controllers/notificationController');
// Middleware for admin authentication (you'll need to implement this)
const requireAdminAuth = (req, res, next) => {
  // Add your admin authentication logic here
  // For now, just continue - replace with actual auth
  next();
};

// Apply admin auth middleware to all routes
router.use(requireAdminAuth);

// GET /api/admin/notifications - Get all notifications
router.get('/', getNotifications);

// POST /api/admin/notifications - Create new notification
router.post('/', createNotification);

// PATCH /api/admin/notifications/:id/read - Mark notification as read
router.patch('/:id/read', markAsRead);

// PATCH /api/admin/notifications/mark-all-read - Mark all as read
router.patch('/mark-all-read', markAllAsRead);

// DELETE /api/admin/notifications/:id - Delete notification
router.delete('/:id', deleteNotification);

// GET /api/admin/notifications/stats - Get notification statistics
router.get('/stats', getNotificationStats);

module.exports = router;