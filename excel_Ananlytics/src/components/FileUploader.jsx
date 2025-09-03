import React, { useState, useCallback, useEffect } from 'react';
import { FiUpload, FiX, FiFile, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_CONFIG from '../config';
import './FileUploader.css';

const FileUploader = ({ onUploadSuccess }) => {
  const { token } = useAuth();
  const { darkMode } = useTheme();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Theme:', darkMode ? 'Dark' : 'Light');
  }, [darkMode]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.API_BASE_URL}/api/v1/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedFiles = response.data.data.files || [];
      const validFiles = fetchedFiles.filter(file => {
        if (!file || !file._id || !file.originalname || !file.size || !file.createdAt) {
          console.warn('Invalid file data:', file);
          return false;
        }
        return true;
      }).map(file => ({
        ...file,
        id: file._id,
      }));
      setFiles(validFiles);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setError('Failed to fetch uploaded files. Please try again.');
    }
  };

  useEffect(() => {
    if (token) {
      fetchFiles();
    } else {
      setError('Please log in to view files');
      navigate('/login');
    }
  }, [token, navigate]);

  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };

    if (file.size > 25 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 25MB limit' };
    }

    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'gif', 'csv', 'xlsx', 'xls', 'json'];
    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Invalid file extension. Supported formats: ${allowedExtensions.join(', ')}`,
      };
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/csv',
      'application/csv',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
    ];

    if (ext === 'csv') {
      const csvMimeTypes = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'];
      if (!csvMimeTypes.some(type => file.type === type || file.type.includes('csv'))) {
        console.warn(`CSV file has unexpected MIME type: ${file.type}, but allowing based on extension`);
      }
      return { valid: true };
    }

    if (ext === 'json') {
      const jsonMimeTypes = ['application/json', 'text/json', 'text/plain'];
      if (!jsonMimeTypes.some(type => file.type === type || file.type.includes('json'))) {
        console.warn(`JSON file has unexpected MIME type: ${file.type}, but allowing based on extension`);
      }
      return { valid: true };
    }

    if (!file.type || !allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type || 'unknown'}. Please ensure your file is in the correct format.`,
      };
    }

    return { valid: true };
  };

  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    setError(null);
    setUploadStatus(null);
    setUploadedFile(null);
    setShowSuccessActions(false);

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
    });

    setSelectedFile(file);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    setUploadStatus(null);
    setUploadedFile(null);
    setShowSuccessActions(false);

    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    const url = `${API_CONFIG.API_BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`;

    try {
      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.status !== 201) {
        throw new Error(response.data.message || 'Upload failed');
      }

      setUploadStatus('success');
      setUploadedFile(response.data.data.file);
      setShowSuccessActions(true);

      // Emit custom event for dashboard to listen
      const event = new CustomEvent('fileUploaded', {
        detail: {
          file: response.data.data.file,
          timestamp: new Date()
        }
      });
      window.dispatchEvent(event);

      if (onUploadSuccess) {
        onUploadSuccess({
          fileInfo: response.data.data.file,
        });
      }

      // Refresh files list
      await fetchFiles();

      // Auto-clear success message after 10 seconds
      setTimeout(() => {
        setUploadStatus(null);
        setShowSuccessActions(false);
        setUploadProgress(0);
      }, 10000);

    } catch (error) {
      console.error('Upload error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        timeout: error.code === 'ECONNABORTED',
        file: {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
        },
      });

      let errorMessage = 'Upload failed. Please try again.';

      if (error.response) {
        const { status, data } = error.response;
        switch (status) {
          case 400:
            errorMessage = data?.message || 'Invalid file or request. Please check your file and try again.';
            break;
          case 401:
            errorMessage = 'Session expired. Please log in again.';
            navigate('/login');
            break;
          case 413:
            errorMessage = 'File too large. Maximum size is 25MB.';
            break;
          case 415:
            errorMessage = 'Unsupported file type. Please check the allowed formats.';
            break;
          case 422:
            errorMessage = data?.message || 'File processing failed. Please check your file format.';
            break;
          case 500:
            errorMessage = data?.message || 'Server error. Please try again or contact support.';
            break;
          default:
            errorMessage = data?.message || `Upload failed with status ${status}. Please try again.`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. The file might be large or your connection is slow.';
      } else if (error.code === 'ERR_NETWORK' || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and ensure the server is running.';
      } else if (error.code === 'ERR_CONTENT_LENGTH_MISMATCH') {
        errorMessage = 'Connection interrupted. Please try uploading again.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on localhost:5000.';
      }

      setError(errorMessage);
      setUploadStatus('error');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const navigateToDashboard = () => {
    navigate('/dashboard', { 
      state: { 
        refresh: true, 
        fileUploaded: true,
        uploadedFile: uploadedFile 
      } 
    });
  };

  const createChart = () => {
    if (uploadedFile) {
      navigate('/chart-creation', { 
        state: { 
          fileId: uploadedFile._id || uploadedFile.id,
          fileName: uploadedFile.originalname || uploadedFile.name
        } 
      });
    }
  };

  const uploadAnother = () => {
    removeFile();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (mimetype) => {
    if (!mimetype || typeof mimetype !== 'string') {
      console.warn('Invalid mimetype:', mimetype);
      return '📄';
    }

    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.includes('csv')) return '📊';
    if (mimetype.includes('excel') || mimetype.includes('sheet')) return '📈';
    if (mimetype.includes('json')) return '📋';
    return '📄';
  };

  return (
    <div className={`file-uploader-container ${darkMode ? 'dark' : ''}`}>
      <h2 className="uploader-title">
        <FiUpload className="icon" /> Upload Your File
      </h2>

      <div
        className={`dropzone ${isDragging ? 'dragging' : ''} ${error ? 'error' : ''} ${isUploading ? 'uploading' : ''} ${uploadStatus === 'success' ? 'success' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && !showSuccessActions && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,text/csv,application/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/json"
          onChange={handleFileChange}
          className="hidden-input"
          disabled={isUploading || showSuccessActions}
        />

        {!selectedFile && !uploadStatus ? (
          <div className="dropzone-content">
            <FiUpload className="dropzone-icon" />
            <p>Drag & drop your file here or click to browse</p>
            <p className="file-size-hint">
              Supported: Images (JPEG, PNG, GIF), CSV, Excel (XLSX, XLS), JSON
            </p>
            <p className="file-size-hint">Maximum size: 25MB</p>
          </div>
        ) : uploadStatus === 'success' && showSuccessActions ? (
          <div className="success-content">
            <FiCheckCircle className="success-icon-large" />
            <h3>Upload Successful!</h3>
            <p className="success-file-name">
              {uploadedFile?.originalname || selectedFile.name}
            </p>
            <p className="success-details">
              Size: {formatFileSize(selectedFile.size)} • 
              Type: {selectedFile.type || 'Unknown'} • 
              Uploaded: {new Date().toLocaleTimeString()}
            </p>
            
            <div className="success-actions">
              <button onClick={navigateToDashboard} className="action-btn primary">
                <FiArrowRight /> View Dashboard
              </button>
              <button onClick={createChart} className="action-btn secondary">
                Create Chart
              </button>
              <button onClick={uploadAnother} className="action-btn tertiary">
                Upload Another
              </button>
            </div>
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-info">
              <div className="file-icon-wrapper">
                <span className="file-type-emoji">{getFileTypeIcon(selectedFile.type)}</span>
                <FiFile className="file-icon" />
              </div>
              <div className="file-details">
                <p className="file-name" title={selectedFile.name}>{selectedFile.name}</p>
                <p className="file-size">{formatFileSize(selectedFile.size)}</p>
                <p className="file-type">{selectedFile.type || 'Unknown'}</p>
              </div>
              {!isUploading && uploadStatus !== 'success' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="remove-button"
                  disabled={isUploading}
                  aria-label="Remove file"
                  title="Remove file"
                >
                  <FiX />
                </button>
              )}
            </div>

            {isUploading && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{uploadProgress}%</span>
                <p className="upload-status-text">Uploading file...</p>
              </div>
            )}

            {uploadStatus === 'success' && !showSuccessActions && (
              <div className="success-indicator">
                <FiCheckCircle className="success-icon" />
                <span>Upload completed successfully!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <FiAlertCircle className="error-icon" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-dismiss">
            ×
          </button>
        </div>
      )}

      {selectedFile && !isUploading && uploadStatus !== 'success' && (
        <button
          onClick={uploadFile}
          className="upload-button"
          disabled={isUploading || !selectedFile}
        >
          {isUploading ? (
            <>
              <span className="loading-spinner"></span>
              Uploading... {uploadProgress}%
            </>
          ) : (
            <>
              <FiUpload className="button-icon" />
              Upload File
            </>
          )}
        </button>
      )}

      {files.length > 0 && (
        <div className="uploaded-files">
          <h3>Recent Files ({files.length})</h3>
          <div className="files-grid">
            {files.slice(0, 6).map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-card-icon">
                  <span className="file-type-emoji">{getFileTypeIcon(file.mimetype)}</span>
                </div>
                <div className="file-card-details">
                  <p className="file-card-name" title={file.originalname}>
                    {file.originalname.length > 20 
                      ? `${file.originalname.substring(0, 20)}...` 
                      : file.originalname
                    }
                  </p>
                  <p className="file-card-info">
                    {formatFileSize(file.size)}
                  </p>
                  <p className="file-card-date">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {file.status && (
                  <span className={`status status-${file.status}`}>
                    {file.status}
                  </span>
                )}
              </div>
            ))}
          </div>
          {files.length > 6 && (
            <div className="more-files-indicator">
              <p>... and {files.length - 6} more files</p>
              <button onClick={navigateToDashboard} className="view-all-btn">
                View All Files
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;


  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

 
