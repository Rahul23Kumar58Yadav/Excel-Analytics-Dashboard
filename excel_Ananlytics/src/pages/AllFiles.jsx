import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../components/context/ThemeContext'; 
import { useAuth } from '../components/context/AuthContext';
import axios from 'axios';
import { FiFile, FiDownload, FiEdit, FiTrash2 } from 'react-icons/fi';
import './AllFiles.css';

const AllFiles = () => {
  const { token,user } = useAuth();
  const { darkMode } = useTheme();

  const themeContext = useTheme();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');

    const isDarkMode = themeContext?.darkMode || false;


  const fetchAllFiles = async () => {
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      setLoading(false);
      console.warn('No token available for fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching files with token:', token.substring(0, 5) + '...');
      const response = await axios.get('http://localhost:5000/api/v1/files', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Full API Response:', response.data);
      const data = response.data;
      if (data && typeof data === 'object' && data.status === 'success') {
        if (Array.isArray(data.data)) {
          setFiles(data.data);
        } else if (data.data && Array.isArray(data.data.files)) {
          setFiles(data.data.files);
        } else if (data.data && Array.isArray(data.data.items)) {
          setFiles(data.data.items);
        } else {
          console.warn('Unexpected data format:', data.data);
          setFiles([]);
          setError('Unexpected data format from server.');
        }
      } else {
        console.warn('Non-success status:', data.status, data.message);
        setFiles([]);
        setError(data.message || 'Failed to load files.');
      }
    } catch (err) {
      console.error('Error fetching all files:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(`Failed to load files: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFiles();
  }, [token]);

  const handleDownload = async (file) => {
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      console.error('Download failed: No token available');
      return;
    }

    if (!file._id) {
      setError(`Cannot download ${file.originalname}: Missing file ID. Contact support.`);
      console.error('Download failed: Missing ID for file', file);
      return;
    }

    setDownloading(file._id);
    setError(null);
    try {
      console.log('Attempting to download:', file.originalname, 'with ID:', file._id);
      const response = await axios.get(`http://localhost:5000/api/v1/files/download/${file._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application')) {
        throw new Error('Invalid file type received from server');
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalname || file.name || 'file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log(`Successfully downloaded ${file.originalname}`);
    } catch (err) {
      console.error('Download error:', {
        fileName: file.originalname,
        fileId: file._id,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (err.response?.status === 404) {
        setError(`Failed to download ${file.originalname}: File not found on server. Please verify the file exists or contact support.`);
        // Refresh file list to check for stale data
        await fetchAllFiles();
      } else {
        setError(`Failed to download ${file.originalname}: ${err.response?.data?.message || err.message}. Please try again or contact support.`);
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleEdit = (file) => {
    console.log('Edit button clicked for file:', file._id, file.originalname);
    setEditingFile(file);
    setNewFileName(file.originalname);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      return;
    }

    if (!newFileName) {
      setError('File name cannot be empty.');
      return;
    }

    try {
      setError(null);
      console.log('Updating file name for ID:', editingFile._id, 'to:', newFileName);
      const response = await axios.patch(
        `http://localhost:5000/api/v1/files/${editingFile._id}`,
        { originalname: newFileName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setFiles(files.map(f => (f._id === editingFile._id ? { ...f, originalname: newFileName } : f)));
        setEditingFile(null);
        setNewFileName('');
        console.log('File name updated successfully:', newFileName);
      } else {
        throw new Error(response.data.message || 'Failed to update file name');
      }
    } catch (err) {
      console.error('Edit error:', {
        fileId: editingFile._id,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(`Failed to update file name: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (fileId) => {
    if (!fileId || typeof fileId !== 'string') {
      console.error('Invalid fileId:', fileId);
      setError('Invalid file ID for deletion. Please try again.');
      return;
    }
    const fileExists = files.some(file => file._id === fileId);
    if (!fileExists) {
      console.warn('File ID not found in current list:', fileId);
      setError(`File not found in current list (ID: ${fileId}). Please refresh the page.`);
      return;
    }
    console.log('Deleting file with ID:', fileId);
    try {
      const response = await axios.delete(`http://localhost:5000/api/v1/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Delete Response:', response.data);
      if (response.data.status === 'success') {
        setFiles(files.filter(file => file._id !== fileId));
      } else {
        throw new Error(response.data.message || 'Deletion failed');
      }
    } catch (err) {
      console.error('Error deleting file:', {
        fileId,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMsg = err.response?.status === 404
        ? `Failed to delete file. File not found (ID: ${fileId}).`
        : `Failed to delete file: ${err.response?.data?.message || err.message}`;
      setError(errorMsg);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!Array.isArray(files)) return <div className="error-message">Files data is invalid.</div>;

  return (
    <div className={`all-files-container ${isDarkMode ? 'dark' : 'light'}`}>
      <h2>All Files</h2>
      <div className="files-table">
        <div className="table-header">
          <span>File Name</span>
          <span>Date</span>
          <span>Size</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {files.map((file) => (
          <div className="table-row" key={file._id}>
            <span className="file-name">
              <span className="file-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={darkMode ? 'dark-mode' : 'light-mode'}
                >
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
              </span>
              {file.originalname}
            </span>
            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
            <span>{`${(file.size / 1024).toFixed(1)} MB`}</span>
            <span>{file.status || 'processed'}</span>
            <span className="file-actions">
              <button
                className="action-btn download-btn"
                title="Download file"
                onClick={() => handleDownload(file)}
                disabled={downloading === file._id || (file.status && file.status !== 'processed')}
              >
                {downloading === file._id ? <span className="loading-spinner"></span> : <FiDownload />}
              </button>
              <button
                className="action-btn edit-btn"
                title="Edit file details"
                onClick={() => handleEdit(file)}
                disabled={file.status && file.status !== 'processed'}
              >
                <FiEdit />
              </button>
              <button
                className="action-btn delete-btn"
                title="Delete file"
                onClick={() => handleDelete(file._id)}
              >
                <FiTrash2 />
              </button>
            </span>
          </div>
        ))}
      </div>
      {editingFile && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit File Name</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter new file name"
                required
              />
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingFile(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllFiles;