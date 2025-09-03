const express = require('express');
const router = express.Router();
const chartController = require('../controllers/chartController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(chartController.getAllCharts)
  .post(chartController.createChart);

router.route('/generate/:fileId')
  .post(chartController.generateChartFromFile);

// Add download route before the :id route to avoid conflicts
router.route('/download/:id')
  .get(chartController.downloadChart);

router.route('/:id')
  .get(chartController.getChart)
  .patch(chartController.updateChart)
  .delete(chartController.deleteChart);

module.exports = router;