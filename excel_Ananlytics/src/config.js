const API_CONFIG = {
  // Use environment variable with fallback
  API_BASE_URL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000',
  
  // Unified endpoint structure
  ENDPOINTS: {
    // Auth endpoints (for regular users)
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    VERIFY: '/api/v1/auth/verify',
    USER: '/api/v1/auth/user',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    
    // Admin endpoints (consistent with admin service)
    ADMIN_BASE: '/api/admin',
    ADMIN_USERS: '/api/admin/users',
    ADMIN_FILES: '/api/admin/files',
    ADMIN_NOTIFICATIONS: '/api/admin/notifications',
    ADMIN_DASHBOARD: '/api/admin/dashboard',
    ADMIN_PROFILE: '/api/admin/profile',
    ADMIN_SETTINGS: '/api/admin/settings',
    //ADMIN_TEST_CONNECTION: '/api/v1/admin/test-connection', // Added for testMongoDBConnection
    
    // Regular user endpoints
    FILES: '/api/v1/files',
    UPLOAD: '/api/v1/files/upload',
    CHARTS: '/api/v1/charts',
    GENERATE_CHART: '/api/v1/charts/generate',
    
    // Utility endpoints
    HEALTHCHECK: '/healthcheck',
    
    // Chatbot endpoints
    CHATBOT_UPLOAD: '/api/v1/chatbot/upload',
    CHATBOT_CHAT: '/api/v1/chatbot/chat',
    
  },
  
  TIMEOUT: 10000,
  
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // File upload headers
  UPLOAD_HEADERS: {
    'Accept': 'application/json',
    // Content-Type will be set automatically for FormData
  },
  
  // Error messages
  ERROR_MESSAGES: {
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'Session expired. Please login again.',
    FORBIDDEN: 'Access denied. Insufficient permissions.',
    NOT_FOUND: 'Resource not found.',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Invalid input data.',
    UPLOAD_ERROR: 'File upload failed.',
  },
  
  // HTTP status codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 422,
    SERVER_ERROR: 500,
  }
};

export default API_CONFIG;