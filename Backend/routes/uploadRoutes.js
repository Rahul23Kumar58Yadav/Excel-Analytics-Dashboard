// uploadRoutes.js - Fixed version
const express = require('express');
const router = express.Router();

// Debug the imports
console.log('Importing file controller...');
const fileController = require('../controllers/fileController');
console.log('File controller imported:', Object.keys(fileController));

// Only destructure functions that actually exist
const { uploadFile, getFiles, downloadFile, updateFile, deleteFile } = fileController;
console.log('Functions extracted:', {
  uploadFile: typeof uploadFile,
  getFiles: typeof getFiles,
  downloadFile: typeof downloadFile,
  updateFile: typeof updateFile,
  deleteFile: typeof deleteFile
});

const { protect } = require('../middlewares/authMiddleware');
console.log('Auth middleware imported:', typeof protect);

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Check if all functions are defined before using them
if (typeof uploadFile !== 'function') {
  console.error('ERROR: uploadFile is not a function!');
  process.exit(1);
}

router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/', protect, getFiles);
// Removed the problematic route: router.get('/:id', protect, getFile);
router.get('/:id/download', protect, downloadFile);
router.patch('/:id', protect, updateFile);
router.delete('/:id', protect, deleteFile);

module.exports = router;