const File = require('../models/File');
const catchAsync = require('../utils/catchAsync');
const sharp = require('sharp');
const csv = require('csv-parser');
const stream = require('stream');

exports.uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded',
    });
  }

  console.log('Received file:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    userId: req.user.userId,
  });

  try {
    let fileData = req.file.buffer;

    if (req.file.mimetype.startsWith('image')) {
      fileData = await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();
      console.log('Processed image with sharp, new size:', fileData.length);
    } else if (req.file.mimetype.includes('csv')) {
      const results = [];
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);
      await new Promise((resolve, reject) => {
        bufferStream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
      fileData = Buffer.from(JSON.stringify(results));
      console.log('Processed CSV file, rows:', results.length, 'new size:', fileData.length);
    } else if (
      req.file.mimetype.includes('vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      req.file.mimetype.includes('vnd.ms-excel')
    ) {
      fileData = req.file.buffer;
      console.log('Detected Excel file, size:', fileData.length);
    } else if (req.file.mimetype.includes('application/json')) {
      try {
        fileData = Buffer.from(JSON.stringify(JSON.parse(req.file.buffer.toString())));
        console.log('Processed JSON file, size:', fileData.length);
      } catch (err) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid JSON file: ${err.message}`,
        });
      }
    } else {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported file type: ${req.file.mimetype}`,
      });
    }

    console.log('Saving file to MongoDB, user:', req.user.userId);
    const newFile = await File.create({
      originalname: req.file.originalname,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: fileData.length,
      data: fileData,
      user: req.user.userId,
    });

    console.log('File saved to MongoDB with ID:', newFile._id, 'data length:', newFile.data.length);
    res.status(201).json({
      status: 'success',
      data: {
        file: {
          id: newFile._id,
          name: newFile.originalname,
          type: newFile.mimetype,
          size: newFile.size,
          uploadedAt: newFile.createdAt,
        },
      },
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({
      status: 'error',
      message: `Failed to process and store file: ${err.message}`,
    });
  }
});

exports.getFiles = catchAsync(async (req, res, next) => {
  console.log('Fetching files for user:', req.user.userId);
  if (!req.user.userId) {
    return res.status(401).json({
      status: 'error',
      message: 'User ID not found in request',
    });
  }
  const files = await File.find({ user: req.user.userId });
  console.log('Found files:', files.length, 'files:', JSON.stringify(files));
  res.status(200).json({
    status: 'success',
    results: files.length,
    data: { files },
  });
});

// Add the missing getFile function
exports.getFile = catchAsync(async (req, res, next) => {
  console.log('Fetching file with ID:', req.params.id, 'for user:', req.user.userId);
  const file = await File.findOne({ _id: req.params.id, user: req.user.userId });
  
  if (!file) {
    return res.status(404).json({
      status: 'error',
      message: `File not found or you do not have permission (ID: ${req.params.id})`,
    });
  }

  console.log('Found file:', file.originalname);
  res.status(200).json({
    status: 'success',
    data: {
      file: {
        id: file._id,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        uploadedAt: file.createdAt,
      },
    },
  });
});

exports.downloadFile = catchAsync(async (req, res, next) => {
  console.log('Downloading file with ID:', req.params.id, 'for user:', req.user.userId);
  const file = await File.findOne({ _id: req.params.id, user: req.user.userId });
  if (!file) {
    return res.status(404).json({
      status: 'error',
      message: `File not found or you do not have permission (ID: ${req.params.id})`,
    });
  }

  res.set({
    'Content-Type': file.mimetype,
    'Content-Disposition': `attachment; filename="${file.originalname}"`,
    'Content-Length': file.size,
  });
  res.send(file.data);
  console.log('Sent file:', file.originalname);
});

exports.updateFile = catchAsync(async (req, res, next) => {
  console.log('Updating file with ID:', req.params.id, 'for user:', req.user.userId);
  const file = await File.findOne({ _id: req.params.id, user: req.user.userId });
  if (!file) {
    return res.status(404).json({
      status: 'error',
      message: `File not found or you do not have permission (ID: ${req.params.id})`,
    });
  }

  const { originalname } = req.body;
  if (!originalname) {
    return res.status(400).json({
      status: 'error',
      message: 'New file name is required',
    });
  }

  file.originalname = originalname;
  await file.save();

  res.status(200).json({
    status: 'success',
    data: {
      file: {
        id: file._id,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        uploadedAt: file.createdAt,
      },
    },
  });
});

exports.deleteFile = catchAsync(async (req, res, next) => {
  console.log('Deleting file with ID:', req.params.id, 'for user:', req.user.userId);
  const file = await File.findOne({ _id: req.params.id, user: req.user.userId});
  if (!file) {
    return res.status(404).json({
      status: 'error',
      message: `File not found or you do not have permission (ID: ${req.params.id})`,
    });
  }
  await File.findByIdAndDelete(req.params.id);
  res.status(200).json({ status: 'success', message: 'File deleted' });
});