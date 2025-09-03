const multer = require('multer');

module.exports = (err, req, res, next) => {
  console.error('Error:', err.message, err.stack);
  
  // Handle multer errors specifically
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      status: 'error',
      message: `File upload error: ${err.message}`
    });
  }

  // Handle other errors
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};