// models/Chart.js
const mongoose = require('mongoose');

const chartSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Chart title is required'], trim: true },
  chartType: { 
    type: String, 
    required: [true, 'Chart type is required'], 
    enum: ['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter']
  },
  data: {
    labels: { type: [String], required: [true, 'Labels are required'] },
    datasets: [{
      label: String,
      data: { type: [Number], required: [true, 'Dataset data is required'] },
      backgroundColor: [String],
      borderColor: [String],
      borderWidth: Number,
      tension: Number,
      fill: Boolean
    }],
    image: String
  },
  options: { type: Object, default: {} },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'User is required'] },
  sourceFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chart', chartSchema);