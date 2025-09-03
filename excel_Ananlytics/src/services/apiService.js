// src/services/apiService.js
import axios from 'axios';
import API_CONFIG from '../config';

// Create axios instance for API calls
const api = axios.create({
  baseURL: API_CONFIG.API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Token management functions
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.Authorization;
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const clearAuthToken = () => {
  delete api.defaults.headers.Authorization;
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};

// Initialize token on import if exists
const existingToken = getAuthToken();
if (existingToken) {
  setAuthToken(existingToken);
}

// Utility to generate dynamic mock users
const generateMockUsers = (count = 10) => {
  const names = ['Rina', 'Deva', 'P21', 'P12', 'John', 'Jane', 'Alice', 'Bob'];
  const emails = names.map(name => `${name.toLowerCase()}@gmail.com`);
  const roles = ['admin', 'user'];
  const statuses = ['active', 'inactive'];

  return Array.from({ length: count }, (_, index) => ({
    id: (index + 1).toString(),
    _id: (index + 1).toString(),
    name: names[Math.floor(Math.random() * names.length)],
    email: emails[Math.floor(Math.random() * emails.length)],
    role: roles[Math.floor(Math.random() * roles.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: Math.random() > 0.5 ? new Date(Date.now() - Math.floor(Math.random() * 24) * 60 * 60 * 1000).toISOString() : null,
    avatar: null,
    fileCount: Math.floor(Math.random() * 5),
  }));
};

// Retry logic for failed requests
const withRetry = async (requestFn, maxRetries = 2, delayMs = 1000) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries) throw error;
      console.warn(`Retry ${i + 1}/${maxRetries} for ${error.config?.url} due to ${error.message}. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });

    if (error.response?.status === API_CONFIG.STATUS_CODES.UNAUTHORIZED && error.config.url.includes(API_CONFIG.ENDPOINTS.USER)) {
      console.warn('Authentication failed, clearing token and redirecting to login');
      clearAuthToken();
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = API_CONFIG.ENDPOINTS.LOGIN;
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor to ensure token is included
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added Authorization header:', config.headers.Authorization.substring(0, 50) + '...');
    } else if (!token) {
      console.warn('No token available for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// User Management API Functions
export const fetchUsers = async (params = {}) => {
  const fetchWithRetry = () => api.get(API_CONFIG.ENDPOINTS.ADMIN_USERS, { params });
  try {
    const response = await withRetry(fetchWithRetry);
    const userData = response.data.data || response.data;
    if (!userData.users || !Array.isArray(userData.users)) {
      throw new Error('Invalid users response format');
    }
    return {
      users: userData.users.map(user => ({
        ...user,
        id: user.id || user._id,
        role: user.role?.toLowerCase() || 'user',
        status: user.status || 'inactive',
      })),
      totalCount: userData.totalCount || userData.total || userData.users.length,
      currentPage: userData.currentPage || params.page || 1,
      itemsPerPage: userData.itemsPerPage || params.limit || 10,
    };
  } catch (error) {
    console.warn(`Users API failed with 404 or other error: ${error.message}. Falling back to mock data.`);
    return {
      users: generateMockUsers(params.limit || 10),
      totalCount: 50, // Dynamic total for mock data
      currentPage: params.page || 1,
      itemsPerPage: params.limit || 10,
    };
  }
};

export const getUserById = async (userId) => {
  const fetchWithRetry = () => api.get(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/${userId}`);
  try {
    const response = await withRetry(fetchWithRetry);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user by ID ${userId}: ${error.message}`);
    throw error;
  }
};

export const createUser = async (userData) => {
  const createWithRetry = () => api.post(API_CONFIG.ENDPOINTS.ADMIN_USERS, userData);
  try {
    const response = await withRetry(createWithRetry);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  const updateWithRetry = () => api.patch(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/${userId}`, userData);
  try {
    const response = await withRetry(updateWithRetry);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  const deleteWithRetry = () => api.delete(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/${userId}`);
  try {
    const response = await withRetry(deleteWithRetry);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const bulkUpdateUsers = async (userIds, updateData) => {
  const bulkUpdateWithRetry = () => api.put(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/bulk-update`, { userIds, updateData });
  try {
    const response = await withRetry(bulkUpdateWithRetry);
    return response.data;
  } catch (error) {
    console.error('Error bulk updating users:', error);
    throw error;
  }
};

export const exportUsers = async (filters = {}) => {
  const exportWithRetry = () => api.get(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/export`, {
    params: filters,
    responseType: 'blob',
  });
  try {
    const response = await withRetry(exportWithRetry);
    return response.data;
  } catch (error) {
    console.error('Error exporting users:', error);
    throw error;
  }
};

// File Management API Functions
export const fetchFiles = async (params = {}) => {
  try {
    console.log('Fetching files with params:', params);
    const response = await api.get(API_CONFIG.ENDPOINTS.ADMIN_FILES, { params });
    console.log('Files response:', response.data);
    const fileData = response.data.data || response.data;
    return {
      files: fileData.files || fileData.data || fileData,
      total: fileData.totalCount || fileData.total || fileData.length,
      page: fileData.currentPage || params.page || 1,
      pageSize: fileData.itemsPerPage || params.pageSize || 10,
    };
  } catch (error) {
    console.warn('Files API not available, using mock data:', error);
    return {
      files: [
        {
          id: 1,
          fileName: 'sales_report_2024.xlsx',
          fileType: 'xlsx',
          fileSize: '2.5 MB',
          uploadDate: new Date().toISOString(),
          status: 'processed',
          user: { name: 'John Doe', avatar: null },
          description: 'Q4 Sales Analysis Report',
        },
        {
          id: 2,
          fileName: 'customer_data.csv',
          fileType: 'csv',
          fileSize: '1.8 MB',
          uploadDate: new Date(Date.now() - 86400000).toISOString(),
          status: 'processed',
          user: { name: 'Jane Smith', avatar: null },
          description: 'Customer Database Export',
        },
      ],
      total: 2,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    };
  }
};

export const uploadFile = async (fileData, onUploadProgress) => {
  try {
    console.log('Uploading file...');
    const formData = new FormData();
    
    if (fileData instanceof File) {
      formData.append('file', fileData);
    } else if (fileData.file && fileData.file instanceof File) {
      formData.append('file', fileData.file);
      if (fileData.category) formData.append('category', fileData.category);
      if (fileData.description) formData.append('description', fileData.description);
      if (fileData.tags) formData.append('tags', JSON.stringify(fileData.tags));
    } else {
      throw new Error('Invalid file data provided');
    }

    const config = {
      headers: API_CONFIG.UPLOAD_HEADERS,
      onUploadProgress: onUploadProgress
        ? (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percentCompleted);
          }
        : undefined,
    };

    const response = await api.post(API_CONFIG.ENDPOINTS.UPLOAD, formData, config);
    console.log('File upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteFile = async (fileId) => {
  try {
    const response = await api.delete(`${API_CONFIG.ENDPOINTS.ADMIN_FILES}/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const downloadFile = async (fileId) => {
  try {
    const response = await api.get(`${API_CONFIG.ENDPOINTS.ADMIN_FILES}/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const getFileById = async (fileId) => {
  try {
    const response = await api.get(`${API_CONFIG.ENDPOINTS.ADMIN_FILES}/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching file by ID:', error);
    throw error;
  }
};

export const updateFile = async (fileId, fileData) => {
  try {
    const response = await api.patch(`${API_CONFIG.ENDPOINTS.ADMIN_FILES}/${fileId}`, fileData);
    return response.data;
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
};

// System Health API Function
export const getSystemHealth = async () => {
  try {
    const response = await api.get(API_CONFIG.ENDPOINTS.HEALTHCHECK);
    return response.data;
  } catch (error) {
    console.error('Error checking system health:', error);
    throw error;
  }
};

// Authentication check function
export const checkAuthStatus = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No auth token found');
    }
    const response = await api.get(API_CONFIG.ENDPOINTS.USER);
    return {
      isValid: true,
      user: response.data.admin || response.data,
      token,
    };
  } catch (error) {
    console.error('Auth status check failed:', error);
    clearAuthToken();
    return {
      isValid: false,
      user: null,
      token: null,
    };
  }
};

// Utility function to test API connectivity
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await api.get(API_CONFIG.ENDPOINTS.HEALTHCHECK);
    console.log('API connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('API connection failed:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
};
// Export default object with all functions
export default {
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  checkAuthStatus,
  fetchUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers,
  exportUsers,
  fetchFiles,
  uploadFile,
  deleteFile,
  downloadFile,
  getFileById,
  updateFile,
  getSystemHealth,
  testApiConnection,
};