import React, { memo, useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiFile, FiDownload, FiClock, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../components/context/AuthContext';
import { useTheme } from '../components/context/ThemeContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './RecentFiles.css';

const RecentFiles = ({
  onEdit = null,
  onDelete = null,
  onViewAll = null,
  onRefresh = null,
  darkMode = false
}) => {
  const { token } = useAuth();
  const themeContext = useTheme();
  const navigate = useNavigate();
  
  // Use prop darkMode if provided, otherwise fall back to context
  const isDarkMode = darkMode || themeContext?.darkMode || false;

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');

  // Fetch files directly from the API (same as AllFiles)
  const fetchRecentFiles = useCallback(async () => {
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching recent files with token:', token.substring(0, 5) + '...');
      
      const response = await axios.get('http://localhost:5000/api/v1/files', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Recent Files API Response:', response.data);
      const data = response.data;
      
      if (data && typeof data === 'object' && data.status === 'success') {
        let allFiles = [];
        if (Array.isArray(data.data)) {
          allFiles = data.data;
        } else if (data.data && Array.isArray(data.data.files)) {
          allFiles = data.data.files;
        } else if (data.data && Array.isArray(data.data.items)) {
          allFiles = data.data.items;
        } else {
          console.warn('Unexpected data format:', data.data);
          setFiles([]);
          setError('Unexpected data format from server.');
          return;
        }

        // Transform files to match the expected format and get latest 4
        const transformedFiles = allFiles
          .map(file => ({
            id: file._id,
            name: file.originalname,
            originalname: file.originalname,
            date: file.createdAt,
            size: file.size,
            status: file.status || 'processed',
            type: file.mimetype?.includes('spreadsheet') || file.mimetype?.includes('excel') ? 'Excel' : 'Other',
            mimetype: file.mimetype
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
          .slice(0, 4); // Get only the latest 4 files

        setFiles(transformedFiles);
      } else {
        console.warn('Non-success status:', data.status, data.message);
        setFiles([]);
        setError(data.message || 'Failed to load files.');
      }
    } catch (err) {
      console.error('Error fetching recent files:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(`Failed to load files: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch files on component mount and when token changes
  useEffect(() => {
    fetchRecentFiles();
  }, [fetchRecentFiles]);

  // Listen for file upload events to refresh the list
  useEffect(() => {
    const handleFileUploaded = () => {
      console.log('File uploaded event received, refreshing recent files...');
      fetchRecentFiles();
    };

    window.addEventListener('fileUploaded', handleFileUploaded);
    return () => window.removeEventListener('fileUploaded', handleFileUploaded);
  }, [fetchRecentFiles]);

  const handleViewAll = useCallback(() => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/all-files');
    }
  }, [onViewAll, navigate]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
    fetchRecentFiles();
  }, [onRefresh, fetchRecentFiles]);

  const handleDownload = useCallback(async (file) => {
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      return;
    }

    if (!file.id) {
      setError(`Cannot download ${file.name}: Missing file ID.`);
      return;
    }

    setDownloading(file.id);
    setError(null);
    
    try {
      console.log('Downloading file:', file.name, 'ID:', file.id);
      
      const response = await axios.get(
        `http://localhost:5000/api/v1/files/download/${file.id}`, 
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
          timeout: 30000,
        }
      );

      let contentType = response.headers['content-type'];
      if (!contentType && file.mimetype) {
        contentType = file.mimetype;
      }
      
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let filename = file.name || file.originalname || 'download';
      if (!filename.includes('.') && file.mimetype) {
        if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
          filename += '.xlsx';
        } else if (file.mimetype.includes('csv')) {
          filename += '.csv';
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log(`Successfully downloaded ${filename}`);
      
    } catch (err) {
      console.error('Download error:', {
        fileName: file.name,
        fileId: file.id,
        status: err.response?.status,
        message: err.message,
      });
      
      if (err.response?.status === 404) {
        setError(`File "${file.name}" not found on server. It may have been deleted.`);
        fetchRecentFiles(); // Refresh to update file list
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(`Failed to download "${file.name}": ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setDownloading(null);
    }
  }, [token, fetchRecentFiles]);

  const handleEdit = useCallback((file) => {
    console.log('Edit button clicked for file:', file.id, file.name);
    setEditingFile(file);
    setNewFileName(file.name);
    setError(null);
  }, []);

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      return;
    }

    if (!newFileName.trim()) {
      setError('File name cannot be empty.');
      return;
    }

    if (newFileName.trim() === editingFile.name) {
      setEditingFile(null);
      return;
    }

    try {
      setError(null);
      console.log('Updating file name for ID:', editingFile.id, 'to:', newFileName.trim());
      
      const response = await axios.patch(
        `http://localhost:5000/api/v1/files/${editingFile.id}`,
        { originalname: newFileName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        // Update local state immediately
        setFiles(prev => prev.map(file => 
          file.id === editingFile.id 
            ? { ...file, name: newFileName.trim() }
            : file
        ));
        
        // Call parent callback
        onEdit?.(editingFile.id, newFileName.trim());
        
        setEditingFile(null);
        setNewFileName('');
        console.log('File name updated successfully:', newFileName.trim());
      } else {
        throw new Error(response.data.message || 'Failed to update file name');
      }
    } catch (err) {
      console.error('Edit error:', {
        fileId: editingFile.id,
        status: err.response?.status,
        message: err.message,
      });
      setError(`Failed to update file name: ${err.response?.data?.message || err.message}`);
    }
  }, [token, editingFile, newFileName, onEdit]);

  const handleDelete = useCallback(async (file) => {
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${file.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(file.id);
    setError(null);

    try {
      console.log('Deleting file:', file.name, 'ID:', file.id);
      
      await axios.delete(`http://localhost:5000/api/v1/files/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state immediately
      setFiles(prev => prev.filter(f => f.id !== file.id));
      
      // Call parent callback
      onDelete?.(file.id);
      
      console.log(`Successfully deleted ${file.name}`);
      
    } catch (err) {
      console.error('Delete error:', {
        fileName: file.name,
        fileId: file.id,
        status: err.response?.status,
        message: err.message,
      });
      
      if (err.response?.status === 404) {
        setError(`File "${file.name}" not found. It may have already been deleted.`);
        setFiles(prev => prev.filter(f => f.id !== file.id));
        onDelete?.(file.id);
      } else {
        setError(`Failed to delete "${file.name}": ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setDeleting(null);
    }
  }, [token, onDelete]);

  const getFileIcon = useCallback((file) => {
    const { mimetype, name } = file;
    
    if (mimetype?.includes('spreadsheet') || mimetype?.includes('excel') || name?.endsWith('.xlsx') || name?.endsWith('.xls')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`file-icon excel ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"></path>
          <path d="M9.5 12L11 14.5L12.5 12L14 14.5L15.5 12"></path>
          <path d="M9.5 16L11 13.5L12.5 16L14 13.5L15.5 16"></path>
        </svg>
      );
    }
    
    if (mimetype?.includes('csv') || name?.endsWith('.csv')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`file-icon csv ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13,2 13,9 20,9"></polyline>
          <line x1="8" y1="12" x2="16" y2="12"></line>
          <line x1="8" y1="16" x2="16" y2="16"></line>
          <line x1="8" y1="20" x2="16" y2="20"></line>
        </svg>
      );
    }
    
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`file-icon default ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
        <polyline points="13,2 13,9 20,9"></polyline>
      </svg>
    );
  }, [isDarkMode]);

  const formatFileSize = useCallback((size) => {
    if (typeof size === 'string') return size;
    if (!size || size === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
  }, []);

  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return 'Today';
      } else if (diffDays === 2) {
        return 'Yesterday';
      } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown date';
    }
  }, []);

  const renderFileRows = React.useMemo(() => {
    if (loading) {
      return (
        <div className="loading-message">
          <div className="loading-spinner small"></div>
          <span>Loading recent files...</span>
        </div>
      );
    }
    if (!files || files.length === 0) {
      return (
        <div className="no-files" role="alert">
          <FiFile size={32} />
          <p>No recent files available.</p>
          <small>Upload a file to get started!</small>
        </div>
      );
    }

    return files.map((file, index) => (
      <div className="table-row" key={file.id || `file-${index}`} role="row">
        <span className="file-name" role="cell">
          <span className="file-icon-wrapper">
            {getFileIcon(file)}
          </span>
          <div className="file-details">
            <span className="file-title">{file.name}</span>
            <small className="file-type">{file.type || 'Unknown'}</small>
          </div>
        </span>
        <span className="file-date" role="cell">
          <FiClock className="date-icon" />
          <span>{formatDate(file.date)}</span>
        </span>
        <span className="file-size" role="cell">
          {formatFileSize(file.size)}
        </span>
        <span className={`file-status ${file.status}`} role="cell">
          <span className={`status-badge ${file.status}`}>
            {file.status === 'processed' ? 'Ready' : 'Processing...'}
          </span>
        </span>
        <span className="file-actions" role="cell">
          <button
            className="action-btn download-btn"
            aria-label={`Download ${file.name}`}
            disabled={file.status !== 'processed' || downloading === file.id}
            onClick={() => handleDownload(file)}
            title="Download file"
          >
            {downloading === file.id ? (
              <div className="loading-spinner small"></div>
            ) : (
              <FiDownload />
            )}
          </button>
          <button
            className="action-btn edit-btn"
            aria-label={`Edit ${file.name}`}
            onClick={() => handleEdit(file)}
            title="Edit file details"
            disabled={file.status !== 'processed'}
          >
            <FiEdit />
          </button>
          <button
            className="action-btn delete-btn"
            aria-label={`Delete ${file.name}`}
            onClick={() => handleDelete(file)}
            title="Delete file"
            disabled={deleting === file.id}
          >
            {deleting === file.id ? (
              <div className="loading-spinner small"></div>
            ) : (
              <FiTrash2 />
            )}
          </button>
        </span>
      </div>
    ));
  }, [files, loading, handleDownload, handleEdit, handleDelete, downloading, deleting, getFileIcon, formatDate, formatFileSize]);

  return (
    <div className={`recent-files ${isDarkMode ? 'dark-mode' : ''}`} role="region" aria-label="Recent Files">
      <div className="section-header">
        <h2 className="section-title">Recent Files</h2>
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            title="Refresh files"
            aria-label="Refresh recent files"
          >
            <FiRefreshCw />
          </button>
          <button
            className="view-all"
            aria-label="View all recent files"
            onClick={handleViewAll}
            title="View all files"
          >
            View All
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message" role="alert">
          <FiFile />
          <span>{error}</span>
          <button 
            className="dismiss-error" 
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="files-table" role="table">
        <div className="table-header" role="row">
          <span role="columnheader">File Name</span>
          <span role="columnheader">Date</span>
          <span role="columnheader">Size</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Actions</span>
        </div>
        <div className="table-body">
          {renderFileRows}
        </div>
      </div>
      
      {editingFile && (
        <div className="modal-overlay" onClick={() => setEditingFile(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <h3>Edit File Name</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label htmlFor="fileName">File Name:</label>
                  <input
                    id="fileName"
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Enter new file name"
                    required
                    autoFocus
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setEditingFile(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

RecentFiles.propTypes = {
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onViewAll: PropTypes.func,
  onRefresh: PropTypes.func,
  darkMode: PropTypes.bool,
};

export default memo(RecentFiles);