// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalname: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  data: { type: Buffer, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: false },
  checksum: { type: String },
  status: { type: String, enum: ['processing', 'processed', 'failed'], default: 'processing' },
  processingProgress: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  errorMessage: { type: String },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);