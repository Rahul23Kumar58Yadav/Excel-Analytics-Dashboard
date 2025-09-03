const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const { protect } = require('../middlewares/authMiddleware');
const catchAsync = require('../utils/catchAsync');

router.post('/', protect, catchAsync(async (req, res, next) => {
  const { action, file, chartType, dimensions, metadata } = req.body;

  if (!action) {
    return next(new AppError('Action is required', 400));
  }

  const analytics = await Analytics.create({
    action,
    user: req.user.id,
    file,
    chartType,
    dimensions,
    metadata,
  });

  res.status(201).json({
    success: true,
    data: analytics,
  });
}));

module.exports = router;