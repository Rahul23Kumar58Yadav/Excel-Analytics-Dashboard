// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'user', 'file', 'system'],
    default: 'info'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // null means it's for all admins
  },
  read: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date,
    default: null // null means never expires
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Static method to create system notification
notificationSchema.statics.createSystemNotification = async function(title, message, type = 'info', metadata = {}) {
  try {
    const notification = new this({
      title,
      message,
      type,
      metadata,
      recipient: null // System notifications for all admins
    });
    return await notification.save();
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

// Static method to create user-specific notification
notificationSchema.statics.createUserNotification = async function(userId, title, message, type = 'info', metadata = {}) {
  try {
    const notification = new this({
      title,
      message,
      type,
      recipient: userId,
      metadata
    });
    return await notification.save();
  } catch (error) {
    console.error('Error creating user notification:', error);
    throw error;
  }
};

// Instance method to mark as read by user
notificationSchema.methods.markAsReadBy = async function(userId) {
  if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId, readAt: new Date() });
    if (!this.recipient || this.recipient.toString() === userId.toString()) {
      this.read = true;
    }
    return await this.save();
  }
  return this;
};

// Pre-save middleware to handle expiration
notificationSchema.pre('save', function(next) {
  if (this.expiresAt && this.expiresAt < new Date()) {
    this.isActive = false;
  }
  next();
});

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = async function() {
  try {
    const result = await this.deleteMany({
      $or: [
        { expiresAt: { $lte: new Date() } },
        { isActive: false, createdAt: { $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // Delete inactive notifications older than 30 days
      ]
    });
    console.log(`Cleaned up ${result.deletedCount} expired notifications`);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    throw error;
  }
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;