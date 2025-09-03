import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
const unlinkAsync = promisify(fs.unlink);
import User from '../models/User.js';
import File from '../models/File.js';
import Chart from '../models/Chart.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';

// Helper function to calculate percentage change
const calculateChange = (current, previous) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Dashboard Statistics
export const fetchDashboardStats = async (req, res) => {
  try {
    const { range = 'month', startDate, endDate } = req.query;

    // Date filters
    const dateFilter = {};
    const previousPeriodFilter = {};
    
    // Current period filter
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    
    switch (range) {
      case 'day':
        dateFilter.createdAt = { $gte: startOfDay };
        previousPeriodFilter.createdAt = { 
          $gte: new Date(startOfDay.getTime() - 86400000),
          $lt: startOfDay
        };
        break;
      case 'week':
        dateFilter.createdAt = { $gte: new Date(startOfDay.setDate(startOfDay.getDate() - startOfDay.getDay())) };
        previousPeriodFilter.createdAt = {
          $gte: new Date(startOfDay.setDate(startOfDay.getDate() - startOfDay.getDay() - 7)),
          $lt: new Date(startOfDay.setDate(startOfDay.getDate() - startOfDay.getDay()))
        };
        break;
      case 'month':
        dateFilter.createdAt = { $gte: new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1) };
        previousPeriodFilter.createdAt = {
          $gte: new Date(startOfDay.getFullYear(), startOfDay.getMonth() - 1, 1),
          $lt: new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 0)
        };
        break;
      case 'year':
        dateFilter.createdAt = { $gte: new Date(startOfDay.getFullYear(), 0, 1) };
        previousPeriodFilter.createdAt = {
          $gte: new Date(startOfDay.getFullYear() - 1, 0, 1),
          $lt: new Date(startOfDay.getFullYear(), 0, 0)
        };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter.createdAt = { 
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
          const rangeMs = new Date(endDate) - new Date(startDate);
          previousPeriodFilter.createdAt = {
            $gte: new Date(new Date(startDate) - rangeMs),
            $lt: new Date(startDate)
          };
        }
        break;
    }

    // Execute all queries in parallel
    const [
      totalUsers,
      previousTotalUsers,
      activeUsers,
      totalFiles,
      previousTotalFiles,
      chartsGenerated,
      fileTypes,
      userGrowth,
      recentActivity,
      storageResult,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments(previousPeriodFilter),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      File.countDocuments(dateFilter),
      File.countDocuments(previousPeriodFilter),
      Chart.countDocuments(dateFilter),
      File.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$fileType", count: { $sum: 1 } } },
        { $project: { type: "$_id", count: 1, _id: 0 } }
      ]),
      User.aggregate([
        { 
          $group: {
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            users: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 6 }
      ]),
      ActivityLog.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
      File.aggregate([
        { $group: { _id: null, totalSize: { $sum: "$fileSize" } } }
      ])
    ]);

    // Calculate metrics
    const activeUsersPercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const userChange = calculateChange(totalUsers, previousTotalUsers);
    const fileChange = calculateChange(totalFiles, previousTotalFiles);
    const chartsPerUser = totalUsers > 0 ? (chartsGenerated / totalUsers).toFixed(2) : 0;
    const storageUsed = storageResult[0]?.totalSize || 0;

    // Format user growth data
    const formattedUserGrowth = userGrowth.map(item => ({
      month: new Date(0).setFullYear(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' }),
      users: item.users
    }));

    // Format recent activity
    const formattedRecentActivity = recentActivity.map(activity => ({
      id: activity._id,
      user: activity.user?.name || 'Unknown',
      action: activity.action,
      time: activity.createdAt,
      details: activity.details
    }));

    // Storage stats (example: 100GB total)
    const storageTotalGB = 100;
    const storageUsedGB = Math.round(storageUsed / (1024 * 1024 * 1024));
    const storageUsagePercentage = Math.round((storageUsedGB / storageTotalGB) * 100);

    res.json({
      totalUsers,
      activeUsers,
      activeUsersPercentage,
      userChange,
      totalFiles,
      fileChange,
      chartsGenerated,
      chartsPerUser,
      storageUsage: storageUsagePercentage,
      storageUsed: storageUsedGB,
      storageTotal: storageTotalGB,
      fileTypes,
      userGrowth: formattedUserGrowth,
      recentActivity: formattedRecentActivity,
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// File Management
export const fetchFiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type: fileType, user_id: userId, start_date, end_date } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } }
      ];
    }
    if (fileType) filter.fileType = fileType;
    if (userId) filter.user = userId;
    if (start_date && end_date) {
      filter.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const files = await File.find(filter)
      .populate('user', 'name email avatar')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalCount = await File.countDocuments(filter);

    res.json({
      files,
      totalCount,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
    });

  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ 
      message: 'Failed to fetch files',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = req.user;

    const file = await File.findById(fileId).populate('user');
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Permission check
    if (file.user._id.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this file' });
    }

    // Delete physical file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, '../uploads', file.filePath);
    
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }

    // Delete database record
    await File.deleteOne({ _id: fileId });

    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      message: 'Failed to delete file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = req.user;

    const file = await File.findById(fileId).populate('user');
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Permission check
    if (file.user._id.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to download this file' });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, '../uploads', file.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(filePath, file.fileName);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ 
      message: 'Failed to download file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User Management
export const fetchUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status, start_date, end_date } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (start_date && end_date) {
      filter.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalCount = await User.countDocuments(filter);

    res.json({
      users,
      totalCount,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const userData = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create(userData);
    res.status(201).json(user);

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow changing email
    if (userData.email && userData.email !== user.email) {
      return res.status(400).json({ message: 'Email cannot be changed' });
    }

    // Don't update password if not provided
    if (!userData.password) {
      delete userData.password;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, userData, { new: true });
    res.json(updatedUser);

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is admin
    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }

    // Permission check
    if (user.id !== userId && user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this user' });
    }

    await User.deleteOne({ _id: userId });
    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin Profile
export const fetchAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await User.findById(adminId).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(admin);

  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ 
      message: 'Failed to fetch admin profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;
    const profileData = req.body;

    const admin = await User.findByIdAndUpdate(adminId, profileData, { 
      new: true,
      select: '-password'
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(admin);

  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ 
      message: 'Failed to update admin profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Notifications
export const fetchNotifications = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { markAsRead } = req.query;

    const notifications = await Notification.find({ user: adminId })
      .sort({ createdAt: -1 })
      .limit(20);

    if (markAsRead === 'true') {
      await Notification.updateMany(
        { user: adminId, isRead: false },
        { $set: { isRead: true } }
      );
    }

    const unreadCount = await Notification.countDocuments({ 
      user: adminId, 
      isRead: false 
    });

    res.json({
      data: notifications,
      total: notifications.length,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

