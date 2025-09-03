// middleware/fileUpload.js

const multer = require('multer');
const path = require('path');

// Store file in memory (buffer)
const storage = multer.memoryStorage();

// Allowed MIME types by extension
const mimeTypeMap = {
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.xls': ['application/vnd.ms-excel'],
  '.csv': ['text/csv'],
  '.jpeg': ['image/jpeg'],
  '.jpg': ['image/jpeg'],
  '.png': ['image/png'],
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  const allowedMimeTypes = mimeTypeMap[ext] || [];

  if (!allowedMimeTypes.includes(mimetype)) {
    return cb(new Error(
      `Invalid file type for ${file.originalname}. Allowed types: Excel, CSV, JPEG, PNG.`
    ));
  }

  cb(null, true); // Accept the file
};

// Wrapper to allow custom config
const configureUpload = (options = {}) => {
  const { fileSizeLimit = 25 * 1024 * 1024, fieldName = 'file' } = options;

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: fileSizeLimit },
  });

  // Post-upload size check middleware (optional)
  const validateFileNotEmpty = (req, res, next) => {
    const file = req.file || (req.files && req.files[fieldName]?.[0]);
    if (!file || !file.buffer || file.buffer.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Uploaded file is empty or invalid.',
      });
    }
    next();
  };

  return {
    upload,
    single: [upload.single(fieldName), validateFileNotEmpty],
    array: [upload.array(fieldName), validateFileNotEmpty],
    fields: (fieldsConfig) => [
      upload.fields(fieldsConfig),
      validateFileNotEmpty,
    ],
  };
};

// Default config
const uploadConfig = configureUpload();
const { upload, single: uploadSingle } = uploadConfig;

module.exports = {
  upload,
  uploadSingle,
  configureUpload,
};
