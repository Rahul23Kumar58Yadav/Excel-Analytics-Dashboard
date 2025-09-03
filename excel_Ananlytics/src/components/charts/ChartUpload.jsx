import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ChartUpload = () => {
  const themeContext = useTheme();
  const darkMode = themeContext?.darkMode || false;
  const { token } = useAuth(); // Get token from auth context
  
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('Selected file:', selectedFile.name, selectedFile.type);
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      console.log('Dropped file:', droppedFile.name, droppedFile.type);
      setFile(droppedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!token) {
      setError('Authentication token missing. Please log in again.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    console.log('Uploading file:', file.name, 'Type:', file.type);

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('http://localhost:5000/api/v1/files', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const fileId = response.data.data.file._id;
      console.log('File uploaded to MongoDB with ID:', fileId);
      setSuccess(`File "${file.name}" uploaded successfully!`);
      setFile(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Failed to upload file: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className={`chart-upload ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <h2>Upload File</h2>
      
      {/* Drag and Drop Area */}
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!file ? (
          <>
            <div className="upload-icon">📁</div>
            <p>Drag and drop your file here, or</p>
            <input 
              type="file" 
              onChange={handleFileChange} 
              name="file"
              id="file-input"
              className="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              Choose File
            </label>
          </>
        ) : (
          <div className="file-preview">
            <div className="file-info">
              <span className="file-icon">📄</span>
              <div className="file-details">
                <p className="file-name">{file.name}</p>
                <p className="file-size">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button 
              onClick={removeFile} 
              className="remove-file"
              type="button"
              aria-label="Remove file"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        className="upload-btn"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {/* Messages */}
      {error && (
        <div className="message error" role="alert">
          <span>⚠️ {error}</span>
          <button onClick={clearMessages} className="message-close">×</button>
        </div>
      )}
      
      {success && (
        <div className="message success" role="status">
          <span>✅ {success}</span>
          <button onClick={clearMessages} className="message-close">×</button>
        </div>
      )}

      {uploading && (
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      )}
    </div>
  );
};

export default ChartUpload;