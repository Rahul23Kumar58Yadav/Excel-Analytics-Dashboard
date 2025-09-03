const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'An action is required'],
    enum: ['upload', 'analyze', 'download', 'delete', 'login', 'logout'],
  },
  user: {
    type: mongoose.Schema.ObjectId, // Fixed: Changed XSchema to mongoose.Schema
    ref: 'User',
    required: [true, 'A user is required'],
  },
  file: {
    type: mongoose.Schema.ObjectId, // Fixed: Changed XSchema to mongoose.Schema
    ref: 'File',
  },
  chartType: {
    type: String,
    enum: ['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter'],
  },
  dimensions: {
    type: String, // Stores "X vs Y" format like "Revenue vs Month"
  },
  metadata: {
    type: Object,
    validate: {
      validator: value => value === null || typeof value === 'object',
      message: 'Metadata must be an object',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

AnalyticsSchema.index({ user: 1 });
AnalyticsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Analytics', AnalyticsSchema);