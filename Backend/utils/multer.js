const multer = require('multer');
const File = require('../models/File');
const catchAsync = require('../utils/catchAsync');
const csv = require('csv-parser');
const sharp = require('sharp');
const stream = require('stream');

const upload = multer({ storage: multer.memoryStorage(), fileFilter: (req, file, cb) => cb(null, true) });

exports.upload = upload.single('file');

exports.uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    console.error('No file received in request');
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }

  console.log('Received file:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });

  let fileData;
  try {
    if (req.file.mimetype.includes('image')) {
      fileData = await sharp(req.file.buffer).toBuffer();
    } else if (req.file.mimetype.includes('vnd.openxmlformats-officedocument.spreadsheetml.sheet') || // .xlsx
               req.file.mimetype.includes('vnd.ms-excel')) { // .xls
      fileData = req.file.buffer;
      console.log('Detected Excel file, storing as buffer');
    } else if (req.file.mimetype.includes('csv')) {
      const results = [];
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);
      await new Promise((resolve, reject) => {
        bufferStream.pipe(csv()).on('data', (data) => results.push(data)).on('end', resolve).on('error', reject);
      });
      fileData = results;
    } else if (req.file.mimetype.includes('application/json')) {
      fileData = JSON.parse(req.file.buffer.toString());
    } else {
      fileData = req.file.buffer; // Default to raw buffer
    }

    console.log('Processed file data size:', fileData.length || fileData.byteLength);
    const newFile = await File.create({
      originalname: req.file.originalname,
      data: fileData,
      mimetype: req.file.mimetype,
      size: req.file.size,
      user: req.user.id,
    });

    console.log('File saved to MongoDB with ID:', newFile._id);
    res.status(201).json({ status: 'success', data: { file: newFile } });
  } catch (err) {
    console.error('Error processing file:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to process and store file: ' + err.message });
  }
});