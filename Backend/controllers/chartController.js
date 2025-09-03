const mongoose = require('mongoose');
const Chart = require('../models/Chart');
const File = require('../models/File');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Helper function to process file data (unchanged)
function processFileDataForChart(fileData, config = {}) {
  if (!fileData || (Array.isArray(fileData) && fileData.length === 0)) {
    throw new AppError('Invalid file data: Must be a non-empty array or object', 400);
  }

  const xAxis = config.xAxis || 0;
  const yAxis = config.yAxis || 1;
  const datasetLabel = config.datasetLabel || 'Values';

  const labels = [];
  const data = [];

  fileData.forEach((row, index) => {
    if (!row) return;
    let label, value;
    if (Array.isArray(row)) {
      label = row[xAxis] ?? null;
      value = row[yAxis] ?? null;
    } else if (typeof row === 'object' && row !== null) {
      label = row[Object.keys(row)[xAxis]] ?? null;
      value = row[Object.keys(row)[yAxis]] ?? null;
    } else {
      throw new AppError(`Invalid row data at index ${index}: Must be array or object`, 400);
    }
    if (label !== null && value !== null && !isNaN(value)) {
      labels.push(String(label));
      data.push(Number(value));
    }
  });

  if (labels.length === 0 || data.length === 0) {
    throw new AppError('No valid data points extracted from file', 400);
  }

  return {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data,
        backgroundColor: config.backgroundColor || 'rgba(75, 192, 192, 0.2)',
        borderColor: config.borderColor || 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
}

// @desc    Get all charts for user
// @route   GET /api/v1/charts
// @access  Private
exports.getAllCharts = catchAsync(async (req, res, next) => {
  if (!req.user?._id) {
    return next(new AppError('User authentication failed: Missing user ID', 401));
  }
  const charts = await Chart.find({ user: req.user._id }) // Fixed: req.user._id
    .sort('-createdAt')
    .lean();
  
  const chartsWithImages = charts.map(chart => ({
    ...chart,
    imageUrl: chart.data?.image || null
  }));

  res.status(200).json({
    status: 'success',
    results: chartsWithImages.length,
    data: chartsWithImages,
  });
});

// @desc    Get single chart
// @route   GET /api/v1/charts/:id
// @access  Private
exports.getChart = catchAsync(async (req, res, next) => {
  if (!req.user?._id) {
    return next(new AppError('User authentication failed: Missing user ID', 401));
  }
  const chart = await Chart.findOne({ 
    _id: req.params.id, 
    user: req.user._id  // Fixed: req.user._id
  });

  if (!chart) {
    return next(new AppError('No chart found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      chart,
    },
  });
});

// @desc    Create new chart
// @route   POST /api/v1/charts
// @access  Private
// controllers/chartController.js
exports.createChart = catchAsync(async (req, res, next) => {
  console.log('createChart req.body:', JSON.stringify(req.body, null, 2));
  console.log('req.user:', req.user);

  const { title, chartType, data, options } = req.body;

  // Validate required fields
  if (!title || !title.trim()) {
    return next(new AppError('Chart title is required', 400));
  }

  if (!req.user?._id) {
    console.error('Missing req.user._id');
    return next(new AppError('User authentication failed: Missing user ID', 401));
  }

  if (!chartType || !['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter'].includes(chartType)) {
    return next(new AppError('Invalid chart type', 400));
  }

  if (!data || !data.labels || !Array.isArray(data.labels) || !data.datasets || !Array.isArray(data.datasets)) {
    return next(new AppError('Invalid chart data structure', 400));
  }

  // Validate dataset structure and data types
  for (const dataset of data.datasets) {
    if (!dataset.data || !Array.isArray(dataset.data)) {
      return next(new AppError('Invalid dataset structure: data must be an array', 400));
    }
    if (dataset.data.length !== data.labels.length) {
      return next(new AppError('Labels and data length mismatch', 400));
    }
    // Ensure all data values are numbers
    if (!dataset.data.every(val => typeof val === 'number' && !isNaN(val))) {
      return next(new AppError('Dataset data must contain only valid numbers', 400));
    }
  }

  // Process image data if present
  let imageData = null;
  if (data.image && typeof data.image === 'string') {
    if (data.image.startsWith('data:image/png;base64,')) {
      imageData = data.image;
    } else {
      console.warn('Invalid image format, ignoring');
    }
  }

  // Create the chart with proper defaults
  const chartData = {
    title: title.trim(),
    chartType,
    data: {
      labels: data.labels.map(String), // Ensure labels are strings
      datasets: data.datasets.map(dataset => ({
        label: dataset.label || 'Dataset',
        data: dataset.data.map(Number), // Ensure data is numeric
        backgroundColor: Array.isArray(dataset.backgroundColor) 
          ? dataset.backgroundColor 
          : ['rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(153, 102, 255, 0.6)'],
        borderColor: Array.isArray(dataset.borderColor) 
          ? dataset.borderColor 
          : ['rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(153, 102, 255, 1)'],
        borderWidth: Number(dataset.borderWidth) || 1,
        tension: Number(dataset.tension) || 0,
        fill: typeof dataset.fill === 'boolean' ? dataset.fill : false
      })),
      image: imageData
    },
    options: options || {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: title.trim() }
      }
    },
    user: req.user._id
  };

  try {
    const newChart = await Chart.create(chartData);
    res.status(201).json({
      status: 'success',
      data: { chart: newChart }
    });
  } catch (error) {
    console.error('Chart creation failed:', error.message, error.stack);
    return next(new AppError(`Failed to create chart: ${error.message}`, 500));
  }
});

// @desc    Generate chart from file data
// @route   POST /api/v1/charts/generate/:fileId
// @access  Private
exports.generateChartFromFile = catchAsync(async (req, res, next) => {
  if (!req.user?._id) {
    return next(new AppError('User authentication failed: Missing user ID', 401));
  }
  const file = await File.findOne({
    _id: req.params.fileId,
    user: req.user._id  // Fixed: req.user._id
  });

  if (!file) {
    return next(new AppError('No file found with that ID', 404));
  }

  let fileData = file.data;
  if (Buffer.isBuffer(file.data)) {
    try {
      fileData = JSON.parse(file.data.toString()); // Parse if stored as JSON string
    } catch (err) {
      return next(new AppError('Invalid file data format, cannot parse as JSON', 400));
    }
  }

  if (!fileData || !Array.isArray(fileData)) {
    return next(new AppError('File data is not available or invalid', 400));
  }

  const chartData = processFileDataForChart(fileData, req.body.chartConfig || {});

  const newChart = await Chart.create({
    title: req.body.title || `Chart from ${file.originalname}`,
    chartType: req.body.chartType || 'bar',
    data: chartData,
    user: req.user._id,  // Fixed: req.user._id
    sourceFile: file._id,
  });

  res.status(201).json({
    status: 'success',
    data: {
      chart: newChart,
    },
  });
});

// @desc    Update chart
// @route   PATCH /api/v1/charts/:id
// @access  Private
exports.updateChart = catchAsync(async (req, res, next) => {
  if (!req.user?._id) {
    return next(new AppError('User authentication failed: Missing user ID', 401));
  }
  const chart = await Chart.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },  // Fixed: req.user._id
    req.body,
    { new: true, runValidators: true }
  );

  if (!chart) {
    return next(new AppError('No chart found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      chart,
    },
  });
});

// @desc    Delete chart
// @route   DELETE /api/v1/charts/:id
// @access  Private
exports.deleteChart = catchAsync(async (req, res, next) => {
  if (!req.user?._id) {
    return next(new AppError('User authentication failed: Missing user ID', 401));
  }
  const chart = await Chart.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,  // Fixed: req.user._id
  });

  if (!chart) {
    return next(new AppError('No chart found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Download chart as image
// @route   GET /api/v1/charts/download/:id
// @access  Private
exports.downloadChart = catchAsync(async (req, res, next) => {
  if (!req.user?._id) {
    return next(new AppError('User authentication failed: Missing user ID', 401));
  }
  const chart = await Chart.findOne({
    _id: req.params.id,
    user: req.user._id,  // Fixed: req.user._id
  });

  if (!chart) {
    return next(new AppError('No chart found with that ID', 404));
  }

  if (!chart.data?.image) {
    return next(new AppError('No image data available for this chart', 400));
  }

  // Extract base64 data from data URL
  const base64Data = chart.data.image.replace(/^data:image\/png;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  res.set({
    'Content-Type': 'image/png',
    'Content-Disposition': `attachment; filename="${chart.title.replace(/\s+/g, '_')}_chart.png"`,
    'Content-Length': imageBuffer.length
  });

  res.send(imageBuffer);
});