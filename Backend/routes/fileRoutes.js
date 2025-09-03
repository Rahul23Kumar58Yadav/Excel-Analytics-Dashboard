// fileRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { uploadSingle } = require('../middlewares/multermiddleware');
const fileController = require('../controllers/fileController');

// Apply authentication middleware
router.use(protect);
console.log('authMiddleware.protect applied');

// File routes
router.post('/upload', uploadSingle, fileController.uploadFile);
console.log('upload route registered');

router.get('/', fileController.getFiles);
console.log('getFiles route registered');

router.get('/:id', fileController.getFile);
console.log('getFile route registered');

router.get('/download/:id', fileController.downloadFile);
console.log('downloadFile route registered');

router.patch('/:id', fileController.updateFile);
console.log('updateFile route registered');

router.delete('/:id', fileController.deleteFile);
console.log('deleteFile route registered');

// Stats route
router.get('/stats', async (req, res, next) => {
  try {
    const File = require('../models/File');
    const User = require('../models/User');
    const Chart = require('../models/Chart');

    const totalFiles = await File.countDocuments({ user: req.user.userId });
    
    const storageUsed = await File.aggregate([
      { $match: { user: req.user.userId } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]);
    
    const totalSizeMB = (storageUsed[0]?.totalSize || 0) / (1024 * 1024);

    const totalFilesChange = '+12%';
    const storageChange = '+5%';
    const chartsGenerated = await Chart.countDocuments({ user: req.user.userId }).catch(() => 0);
    const chartsChange = '+23%';
    const activeUsers = 12;
    const usersChange = '+4%';

    res.status(200).json({
      status: 'success',
      data: {
        stats: [
          { 
            title: "Total Files", 
            value: totalFiles, 
            change: totalFilesChange, 
            trend: "up" 
          },
          { 
            title: "Storage Used", 
            value: `${totalSizeMB.toFixed(1)} MB`, 
            change: storageChange, 
            trend: "up" 
          },
          { 
            title: "Charts Generated", 
            value: chartsGenerated, 
            change: chartsChange, 
            trend: "up" 
          },
          { 
            title: "Active Users", 
            value: activeUsers, 
            change: usersChange, 
            trend: "up" 
          }
        ]
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    next(err);
  }
});

module.exports = router;