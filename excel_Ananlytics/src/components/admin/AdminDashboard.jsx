import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Statistic, Row, Col, Table, Progress, Divider, Alert, DatePicker, Select,
  Button, Space, message, Spin, Badge, Tooltip
} from 'antd';
import {
  UserOutlined, FileExcelOutlined, BarChartOutlined, CloudUploadOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined, SyncOutlined,
  BellOutlined, ExclamationCircleOutlined, DatabaseOutlined
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_CONFIG from '../../config';
import "./AdminDashboard.css"

const { RangePicker } = DatePicker;
const { Option } = Select;

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="Error in Admin Dashboard"
          description={this.state.error?.message || 'An unexpected error occurred'}
          type="error"
          showIcon
          action={<Button onClick={() => window.location.reload()}>Reload</Button>}
        />
      );
    }
    return this.props.children;
  }
}

// Enhanced MongoDB API functions with better error handling
const createApiRequest = async (endpoint, params = {}, options = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const url = new URL(`${API_CONFIG.API_BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });

  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    timeout: options.timeout || API_CONFIG.TIMEOUT,
    ...options,
  };

  console.log(`Making MongoDB API request to: ${url.toString()}`);
  const response = await axios.get(url.toString(), config);

  if (response.status !== API_CONFIG.STATUS_CODES.OK) {
    if (response.status === API_CONFIG.STATUS_CODES.UNAUTHORIZED) {
      throw new Error(API_CONFIG.ERROR_MESSAGES.UNAUTHORIZED);
    }
    if (response.status === API_CONFIG.STATUS_CODES.NOT_FOUND) {
      throw new Error(`Endpoint not found: ${endpoint}`);
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.data?.data || response.data;
};

// Enhanced API functions for MongoDB data fetching
const fetchDashboardStats = async (params) => {
  try {
    const data = await createApiRequest(`${API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD}/stats`, params);
    
    // Validate the structure of returned data
    const validatedData = {
      totalUsers: data.totalUsers || 0,
      activeUsers: data.activeUsers || 0,
      totalFiles: data.totalFiles || 0,
      chartsGenerated: data.chartsGenerated || 0,
      storageUsage: data.storageUsage || 0,
      storageUsed: data.storageUsed || 0,
      storageTotal: data.storageTotal || 100,
      userChange: data.userChange || 0,
      fileChange: data.fileChange || 0,
      activeUsersPercentage: data.activeUsersPercentage || 0,
      chartsPerUser: data.chartsPerUser || 0,
      fileTypes: Array.isArray(data.fileTypes) ? data.fileTypes : [],
      recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
      userGrowth: Array.isArray(data.userGrowth) ? data.userGrowth : [],
    };

    console.log('Validated dashboard stats from MongoDB:', validatedData);
    return validatedData;
  } catch (error) {
    console.error('MongoDB dashboard stats fetch failed:', error);
    throw error;
  }
};

const fetchNotifications = async () => {
  try {
    const data = await createApiRequest(API_CONFIG.ENDPOINTS.ADMIN_NOTIFICATIONS);
    return {
      notifications: Array.isArray(data.notifications) ? data.notifications : Array.isArray(data) ? data : []
    };
  } catch (error) {
    console.warn('MongoDB notifications fetch failed (non-critical):', error.message);
    return { notifications: [] };
  }
};

const fetchAdminProfile = async () => {
  try {
    const data = await createApiRequest(API_CONFIG.ENDPOINTS.ADMIN_PROFILE);
    return {
      name: data.name || 'Admin User',
      email: data.email || 'admin@example.com',
      role: data.role || 'admin',
      lastLogin: data.lastLogin,
      permissions: data.permissions || [],
    };
  } catch (error) {
    console.warn('MongoDB profile fetch failed, using fallback:', error.message);
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    return {
      name: user.name || 'Admin User',
      email: user.email || 'admin@example.com',
      role: user.role || 'admin'
    };
  }
};

const fetchSystemHealth = async () => {
  try {
    const data = await createApiRequest(`${API_CONFIG.ENDPOINTS.ADMIN_BASE}/health`);
    return {
      status: data.status || 'unknown',
      uptime: data.uptime || 'N/A',
      responseTime: data.responseTime || 0,
      memoryUsage: data.memoryUsage || 0,
      diskUsage: data.diskUsage || 0,
      mongodbStatus: data.mongodbStatus || 'unknown',
      apiStatus: data.apiStatus || 'unknown',
      lastHealthCheck: data.lastHealthCheck || new Date().toISOString(),
    };
  } catch (error) {
    console.warn('MongoDB system health fetch failed (non-critical):', error.message);
    return {
      status: 'unknown',
      uptime: 'N/A',
      responseTime: 0,
      memoryUsage: 0,
      diskUsage: 0,
      mongodbStatus: 'disconnected',
      apiStatus: 'unknown'
    };
  }
};

// Enhanced connection test for MongoDB
const testMongoDBConnection = async () => {
  try {
    const data = await createApiRequest(`${API_CONFIG.ENDPOINTS.ADMIN_BASE}/test-connection`);
    return {
      connected: data.connected || false,
      latency: data.latency || 0,
      database: data.database || 'unknown',
      collections: data.collections || 0,
    };
  } catch (error) {
    console.warn('MongoDB connection test failed:', error.message);
    return {
      connected: false,
      latency: 0,
      database: 'unknown',
      collections: 0,
    };
  }
};

const AdminDashboard = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);
  const refreshButtonRef = useRef(null);

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [mongoConnection, setMongoConnection] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [dateRange, setDateRange] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Enhanced data loading function with retry logic
  const loadAdminData = useCallback(async (showRefreshSpinner = false, isRetry = false) => {
    console.log('LoadAdminData called - Auth status:', { isAuthenticated, isAdmin, user });
    
    if (!isAuthenticated || !isAdmin || !mountedRef.current) {
      console.log('LoadAdminData aborted - Auth failed:', { isAuthenticated, isAdmin, mounted: mountedRef.current });
      return;
    }

    try {
      console.log('Starting enhanced MongoDB data fetch...');
      
      if (showRefreshSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const params = {
        range: timeRange,
        ...(dateRange && dateRange[0] && dateRange[1] && {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        })
      };

      console.log('Enhanced API parameters:', params);

      // Test MongoDB connection first
      const connectionTest = await testMongoDBConnection();
      setMongoConnection(connectionTest);
      console.log('MongoDB connection test result:', connectionTest);

      if (!connectionTest.connected && !isRetry) {
        console.warn('MongoDB connection failed, but continuing with API calls...');
      }

      // Fetch all data with enhanced error handling
      const dataPromises = [
        fetchDashboardStats(params).catch(err => ({ error: err.message, type: 'stats' })),
        fetchNotifications().catch(err => ({ error: err.message, type: 'notifications' })),
        fetchAdminProfile().catch(err => ({ error: err.message, type: 'profile' })),
        fetchSystemHealth().catch(err => ({ error: err.message, type: 'health' }))
      ];

      const [statsResult, notifResult, profileResult, healthResult] = await Promise.all(dataPromises);

      // Process results and handle partial failures
      let hasAnyError = false;
      const errorMessages = [];

      if (statsResult.error) {
        console.error('Dashboard stats failed:', statsResult.error);
        errorMessages.push(`Stats: ${statsResult.error}`);
        hasAnyError = true;
        
        if (statsResult.error.includes('Access denied') || statsResult.error.includes('authentication')) {
          setError(API_CONFIG.ERROR_MESSAGES.UNAUTHORIZED);
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          localStorage.removeItem('token');
          navigate('/auth/login');
          return;
        }
      } else {
        setStats(statsResult);
        console.log('Dashboard stats loaded successfully from MongoDB');
      }

      if (notifResult.error) {
        console.warn('Notifications failed (non-critical):', notifResult.error);
        errorMessages.push(`Notifications: ${notifResult.error}`);
        hasAnyError = true;
        setNotifications([]);
      } else {
        setNotifications(notifResult.notifications || []);
        console.log('Notifications loaded from MongoDB:', notifResult.notifications?.length || 0);
      }

      if (profileResult.error) {
        console.warn('Profile failed, using fallback:', profileResult.error);
        errorMessages.push(`Profile: ${profileResult.error}`);
        hasAnyError = true;
        setProfile({
          name: user?.name || 'Admin User',
          email: user?.email || 'admin@example.com',
          role: user?.role || 'admin'
        });
      } else {
        setProfile(profileResult);
        console.log('Profile loaded from MongoDB:', profileResult);
      }

      if (healthResult.error) {
        console.warn('System health failed (non-critical):', healthResult.error);
        errorMessages.push(`System Health: ${healthResult.error}`);
        hasAnyError = true;
        setSystemHealth({
          status: 'unknown',
          uptime: 'N/A',
          responseTime: 0,
          memoryUsage: 0,
          diskUsage: 0,
          mongodbStatus: 'disconnected'
        });
      } else {
        setSystemHealth(healthResult);
        console.log('System health loaded from MongoDB:', healthResult);
      }

      setLastUpdated(new Date());
      setRetryCount(0);

      // Show partial error message if some APIs failed
      if (hasAnyError && errorMessages.length > 0) {
        const partialErrorMsg = `Some MongoDB endpoints failed: ${errorMessages.join(', ')}`;
        setError(partialErrorMsg);
        if (!showRefreshSpinner) {
          message.warning('Some data could not be loaded from MongoDB');
        }
      } else {
        console.log('All MongoDB data loading completed successfully');
        if (!showRefreshSpinner) {
          message.success('MongoDB data refreshed successfully');
        }
      }
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      console.error('Critical error in loadAdminData:', err);
      
      const errorMessage = err.message || API_CONFIG.ERROR_MESSAGES.SERVER_ERROR;
      setError(`MongoDB connection failed: ${errorMessage}`);
      
      // Implement retry logic for network errors
      if (retryCount < 3 && (err.message.includes('Network') || err.message.includes('timeout'))) {
        console.log(`Retrying MongoDB connection (attempt ${retryCount + 1}/3)...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          if (mountedRef.current) {
            loadAdminData(showRefreshSpinner, true);
          }
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      if (!showRefreshSpinner) {
        message.error(`MongoDB error: ${errorMessage}`);
      }
      
    } finally {
      console.log('Setting loading states to false');
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [timeRange, dateRange, isAuthenticated, isAdmin, user, navigate, retryCount]);

  // Auth check effect
  useEffect(() => {
    console.log('Auth check - isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin);
    
    if (!isAuthenticated || !isAdmin) {
      console.log('Auth failed - redirecting to login');
      setError('Please ensure you are logged in with admin privileges');
      setLoading(false);
      return;
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Initial data load effect
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAdminData();
    }
  }, [timeRange, dateRange, isAuthenticated, isAdmin, loadAdminData]);

  // Enhanced auto-refresh with connection monitoring
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !isAdmin) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(async () => {
      console.log('Auto-refreshing dashboard data from MongoDB...');
      
      // Test connection before refresh
      const connectionTest = await testMongoDBConnection();
      if (connectionTest.connected) {
        loadAdminData(true);
      } else {
        console.warn('Auto-refresh skipped - MongoDB connection lost');
        message.warning('MongoDB connection lost - auto-refresh paused');
        setAutoRefresh(false);
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, isAuthenticated, isAdmin, loadAdminData]);

  // Event handlers
  const handleRefresh = useCallback(() => {
    console.log('Manual refresh triggered');
    setRetryCount(0);
    loadAdminData(true);
  }, [loadAdminData]);

  const handleTimeRangeChange = useCallback((value) => {
    console.log('Time range changed to:', value);
    setTimeRange(value);
    if (value !== 'custom') {
      setDateRange(null);
    }
  }, []);

  const handleDateRangeChange = useCallback((dates) => {
    console.log('Date range changed to:', dates);
    setDateRange(dates);
    if (dates && dates.length === 2) {
      setTimeRange('custom');
    }
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => {
      const newValue = !prev;
      if (newValue) {
        message.success('Auto-refresh enabled (30s intervals) - Live MongoDB data');
      } else {
        message.info('Auto-refresh disabled');
      }
      return newValue;
    });
  }, []);

  // Enhanced table columns with better data handling
  const columns = React.useMemo(() => [
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <span style={{ color: '#1890ff', fontWeight: 500 }}>
            {typeof user === 'string' ? user : user?.name || user?.username || 'Unknown User'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{action}</div>
          {record.target && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Target: {record.target}
            </div>
          )}
          {record.details && (
            <div style={{ fontSize: '11px', color: '#999' }}>
              {record.details}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => {
        if (!text) return 'N/A';
        const date = new Date(text);
        return (
          <Tooltip title={date.toLocaleString()}>
            <div>
              <div>{date.toLocaleDateString()}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {date.toLocaleTimeString()}
              </div>
            </div>
          </Tooltip>
        );
      },
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={
            status === 'completed' || status === 'success' ? 'success' :
            status === 'failed' || status === 'error' ? 'error' :
            status === 'processing' || status === 'pending' ? 'processing' : 'default'
          }
          text={status?.toUpperCase() || 'UNKNOWN'}
        />
      ),
    },
  ], []);

  // Show loading spinner
  if (loading && !stats) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        gap: '16px'
      }}>
        <Spin size="large" />
        <span style={{ fontSize: '16px', color: '#666' }}>Loading admin dashboard...</span>
        <span style={{ fontSize: '14px', color: '#999' }}>Connecting to MongoDB Atlas</span>
        {retryCount > 0 && (
          <span style={{ fontSize: '12px', color: '#ff4d4f' }}>
            Retry attempt {retryCount}/3
          </span>
        )}
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Access Denied"
          description="Please ensure you are logged in with admin privileges"
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/auth/login')}>
              Go to Login
            </Button>
          }
        />
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <ErrorBoundary>
      <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        {/* Profile Welcome Section */}
        {profile && (
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ margin: 0, color: 'white', fontSize: '28px' }}>
              Welcome back, {profile.name}!
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
              {profile.email} • {profile.role}
            </p>
            {lastUpdated && (
              <div style={{ position: 'absolute', top: '16px', right: '24px', opacity: 0.8 }}>
                <small>Last updated: {lastUpdated.toLocaleTimeString()}</small>
              </div>
            )}
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              {systemHealth && (
                <Badge 
                  status={systemHealth.status === 'healthy' ? 'success' : 'error'} 
                  text={`System: ${systemHealth.status || 'Unknown'}`} 
                  style={{ color: 'white' }}
                />
              )}
              {mongoConnection && (
                <Badge 
                  status={mongoConnection.connected ? 'success' : 'error'} 
                  text={`MongoDB: ${mongoConnection.connected ? 'Connected' : 'Disconnected'}`} 
                  style={{ color: 'white' }}
                />
              )}
              {systemHealth?.uptime && (
                <span style={{ opacity: 0.8 }}>Uptime: {systemHealth.uptime}</span>
              )}
              {mongoConnection?.latency > 0 && (
                <span style={{ opacity: 0.8 }}>Latency: {mongoConnection.latency}ms</span>
              )}
            </div>
          </div>
        )}

        {/* Enhanced MongoDB Connection Status */}
        {mongoConnection && !mongoConnection.connected && (
          <Alert
            message="MongoDB Connection Issue"
            description={
              <div>
                <p>Unable to connect to MongoDB Atlas. Some features may be limited.</p>
                <p><strong>Database:</strong> {mongoConnection.database}</p>
                <p><strong>Collections:</strong> {mongoConnection.collections}</p>
              </div>
            }
            type="warning"
            showIcon
            closable
            style={{ marginBottom: '24px' }}
            action={
              <Button size="small" onClick={handleRefresh}>
                Test Connection
              </Button>
            }
          />
        )}

        {/* Enhanced Notifications Alert */}
        {notifications.length > 0 && unreadNotifications > 0 && (
          <Alert
            message={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BellOutlined />
                <span>You have {unreadNotifications} unread notifications</span>
              </div>
            }
            description={
              <div style={{ marginTop: '8px' }}>
                {notifications.slice(0, 3).map((n, index) => (
                  <div key={n.id || index} style={{ marginBottom: '4px' }}>
                    <Badge dot={!n.read} offset={[0, 0]}>
                      <strong>{n.title}:</strong> {n.message}
                    </Badge>
                  </div>
                ))}
                {notifications.length > 3 && (
                  <div style={{ marginTop: '8px' }}>
                    <Button type="link" size="small">
                      View all {notifications.length} notifications
                    </Button>
                  </div>
                )}
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Enhanced Dashboard Header with Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#262626' }}>
              Admin Dashboard Overview 
            </h2>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              <DatabaseOutlined style={{ marginRight: '4px' }} />
              Live MongoDB Data
              {mongoConnection?.connected && (
                <span style={{ color: '#52c41a', marginLeft: '8px' }}>
                  • {mongoConnection.collections} collections
                </span>
              )}
            </div>
          </div>
          <Space wrap>
            <Tooltip title={autoRefresh ? 'Auto-refresh enabled (30s)' : 'Auto-refresh disabled'}>
              <div ref={refreshButtonRef}>
                <Button
                  icon={autoRefresh ? <SyncOutlined spin={refreshing} /> : <SyncOutlined />}
                  onClick={toggleAutoRefresh}
                  type={autoRefresh ? 'primary' : 'default'}
                  size="small"
                >
                  {autoRefresh ? 'Auto' : 'Manual'}
                </Button>
              </div>
            </Tooltip>
            <Select
              value={timeRange}
              style={{ width: 120 }}
              onChange={handleTimeRangeChange}
            >
              <Option value="day">Today</Option>
              <Option value="week">This Week</Option>
              <Option value="month">This Month</Option>
              <Option value="year">This Year</Option>
              <Option value="custom">Custom</Option>
            </Select>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              disabled={timeRange !== 'custom'}
              placeholder={['Start date', 'End date']}
              style={{ minWidth: '200px' }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
              type="primary"
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Enhanced Error Alert */}
        {error && (
          <Alert
            message="Dashboard Loading Issues"
            description={error}
            type="warning"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: '24px' }}
            action={
              <Space>
                <Button size="small" onClick={handleRefresh}>
                  Retry Connection
                </Button>
                {retryCount > 0 && (
                  <span style={{ fontSize: '12px' }}>
                    Attempted {retryCount} retries
                  </span>
                )}
              </Space>
            }
          />
        )}

        {/* Enhanced Statistics Cards with MongoDB Data Validation */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: '8px' }}>
              <Statistic 
                title="Total Users" 
                value={stats?.totalUsers || 0} 
                prefix={<UserOutlined />} 
                loading={refreshing}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <span style={{
                  color: (stats?.userChange || 0) >= 0 ? '#52c41a' : '#ff4d4f'
                }}>
                  {(stats?.userChange || 0) >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(stats?.userChange || 0)}% from last period
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                Source: MongoDB
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: '8px' }}>
              <Statistic 
                title="Active Users" 
                value={stats?.activeUsers || 0} 
                prefix={<UserOutlined />} 
                loading={refreshing}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Progress 
                  percent={stats?.activeUsersPercentage || 0} 
                  size="small" 
                  status="active" 
                  showInfo={false}
                  strokeColor="#52c41a"
                />
                <span style={{ fontSize: '12px' }}>
                  {stats?.activeUsersPercentage || 0}% of total
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                Source: MongoDB
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: '8px' }}>
              <Statistic 
                title="Files Uploaded" 
                value={stats?.totalFiles || 0} 
                prefix={<FileExcelOutlined />} 
                loading={refreshing}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <span style={{
                  color: (stats?.fileChange || 0) >= 0 ? '#52c41a' : '#ff4d4f'
                }}>
                  {(stats?.fileChange || 0) >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(stats?.fileChange || 0)}% from last period
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                Source: MongoDB
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: '8px' }}>
              <Statistic 
                title="Charts Generated" 
                value={stats?.chartsGenerated || 0} 
                prefix={<BarChartOutlined />} 
                loading={refreshing}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <span>Avg. {stats?.chartsPerUser || 0} per user</span>
              </div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                Source: MongoDB
              </div>
            </Card>
          </Col>
        </Row>

        {/* Enhanced Storage Usage Card with MongoDB Data */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: '8px' }}>
              <Statistic 
                title="Storage Used" 
                value={`${stats?.storageUsage || 0}%`} 
                prefix={<CloudUploadOutlined />} 
                loading={refreshing}
                valueStyle={{ color: (stats?.storageUsage || 0) > 90 ? '#ff4d4f' : '#13c2c2' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Progress 
                  percent={stats?.storageUsage || 0} 
                  size="small" 
                  status={(stats?.storageUsage || 0) > 90 ? 'exception' : 'normal'}
                  strokeColor={(stats?.storageUsage || 0) > 90 ? '#ff4d4f' : '#13c2c2'}
                />
                <span style={{ fontSize: '12px' }}>
                  {stats?.storageUsed || 0} GB of {stats?.storageTotal || 100} GB
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                Source: MongoDB
              </div>
            </Card>
          </Col>
          
          {/* Enhanced File Types Distribution */}
          <Col xs={24} sm={12} lg={18}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>File Types Distribution</span>
                  <Badge 
                    count={mongoConnection?.connected ? 'Live' : 'Offline'} 
                    style={{ 
                      backgroundColor: mongoConnection?.connected ? '#52c41a' : '#ff4d4f',
                      fontSize: '10px'
                    }} 
                  />
                </div>
              }
              loading={refreshing} 
              style={{ borderRadius: '8px' }}
            >
              <Row gutter={[16, 16]}>
                {(stats?.fileTypes || []).map((fileType, index) => (
                  <Col xs={12} sm={8} md={6} key={index}>
                    <div style={{ textAlign: 'center', padding: '8px' }}>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: ['#1890ff', '#52c41a', '#fa8c16', '#f5222d'][index % 4] 
                      }}>
                        {fileType.count || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {fileType.type}
                      </div>
                      {fileType.percentage && (
                        <div style={{ fontSize: '10px', color: '#999' }}>
                          {fileType.percentage}%
                        </div>
                      )}
                    </div>
                  </Col>
                ))}
                {(!stats?.fileTypes || stats.fileTypes.length === 0) && (
                  <Col span={24}>
                    <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      <DatabaseOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#d9d9d9' }} />
                      <p>No file type data available from MongoDB</p>
                      <Button size="small" onClick={handleRefresh}>
                        Retry MongoDB Connection
                      </Button>
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
          </Col>
        </Row>

        <Divider orientation="left" style={{ fontSize: '18px', fontWeight: 'bold' }}>
          Live Analytics from MongoDB Atlas
        </Divider>

        {/* Enhanced Charts Section with MongoDB Data Visualization */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>User Growth Trend</span>
                  <Badge 
                    status={mongoConnection?.connected ? 'success' : 'error'} 
                    text={mongoConnection?.connected ? 'MongoDB Live' : 'MongoDB Offline'} 
                  />
                </div>
              }
              loading={refreshing} 
              style={{ borderRadius: '8px' }}
            >
              <div style={{ height: '300px' }}>
                {stats?.userGrowth && stats.userGrowth.length > 0 ? (
                  <>
                    <Line 
                      data={stats.userGrowth}
                      xField="period"  // Assuming userGrowth has {period: string, users: number}
                      yField="users"
                      seriesField="growth"
                      smooth
                      lineStyle={{
                        lineWidth: 3,
                      }}
                      point={{
                        size: 5,
                        shape: 'dot',
                      }}
                      meta={{
                        period: { alias: 'Period' },
                        users: { alias: 'Users' },
                      }}
                      color="#1890ff"
                      loading={refreshing}
                    />
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <p style={{ fontSize: '14px', color: '#666' }}>Recent growth: {stats.userGrowth.slice(-1)[0]?.users} users</p>
                      <p style={{ fontSize: '14px', color: '#666' }}>Growth rate: {stats.userGrowth.slice(-1)[0]?.growth || 0}%</p>
                    </div>
                  </>
                ) : (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                    <div style={{ textAlign: 'center' }}>
                      <BarChartOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                      <p style={{ margin: 0, color: '#666' }}>No growth data available</p>
                      <p style={{ fontSize: '12px', color: '#999' }}>Verify MongoDB connection and data collection</p>
                      <Button size="small" onClick={handleRefresh}>
                        Refresh Data
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>System Performance</span>
                  <Badge 
                    status={systemHealth?.mongodbStatus === 'connected' ? 'success' : 'error'} 
                    text={systemHealth?.mongodbStatus === 'connected' ? 'DB Connected' : 'DB Disconnected'} 
                  />
                </div>
              }
              loading={refreshing} 
              style={{ borderRadius: '8px' }}
            >
              <div style={{ height: '300px' }}>
                {systemHealth && systemHealth.memoryUsage > 0 ? (
                  <Row gutter={[16, 16]} justify="center" align="middle" style={{ height: '100%' }}>
                    <Col span={12} style={{ textAlign: 'center' }}>
                      <Progress 
                        percent={systemHealth.memoryUsage} 
                        strokeColor={systemHealth.memoryUsage > 80 ? '#ff4d4f' : '#52c41a'}
                        width={120}
                        height={120}
                      />
                      <p style={{ marginTop: '8px', fontWeight: 'bold' }}>Memory Usage</p>
                      <p>{systemHealth.memoryUsage}%</p>
                    </Col>
                    <Col span={12} style={{ textAlign: 'center' }}>
                      <TinyProgress 
                        percent={systemHealth.diskUsage} 
                        strokeColor={systemHealth.diskUsage > 80 ? '#ff4d4f' : '#52c41a'}
                        width={120}
                        height={120}
                      />
                      <p style={{ marginTop: '8px', fontWeight: 'bold' }}>Disk Usage</p>
                      <p>{systemHealth.diskUsage}%</p>
                    </Col>
                    <Col span={24} style={{ textAlign: 'center', marginTop: '16px' }}>
                      <p style={{ fontSize: '14px' }}>Response Time: {systemHealth.responseTime}ms</p>
                      <p style={{ fontSize: '14px' }}>Uptime: {systemHealth.uptime}</p>
                    </Col>
                  </Row>
                ) : (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                    <div style={{ textAlign: 'center' }}>
                      <FileExcelOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                      <p style={{ margin: 0, color: '#666' }}>No performance data available</p>
                      <p style={{ fontSize: '12px', color: '#999' }}>Check MongoDB connection and health endpoints</p>
                      <Button size="small" onClick={handleRefresh}>
                        Check Health
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <Divider orientation="left" style={{ fontSize: '18px', fontWeight: 'bold' }}>
          Recent System Activity (Live MongoDB Data)
        </Divider>

        {/* Enhanced Recent Activity Table with MongoDB Data */}
        <Card 
          loading={refreshing} 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Latest User Actions</span>
              <Space>
                <Badge 
                  count={stats?.recentActivity?.length || 0} 
                  style={{ backgroundColor: '#1890ff' }} 
                />
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Real-time from MongoDB Atlas
                </span>
              </Space>
            </div>
          }
          style={{ borderRadius: '8px' }}
          extra={
            <Space>
              <Tooltip title="Auto-refresh active">
                {autoRefresh && <SyncOutlined spin style={{ color: '#1890ff' }} />}
              </Tooltip>
              <Button 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
              >
                Refresh
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={stats?.recentActivity || []}
            rowKey={(record) => record.id || record._id || Math.random()}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items from MongoDB`
            }}
            size="middle"
            locale={{
              emptyText: (
                <div style={{ padding: '20px' }}>
                  {refreshing ? (
                    <div>
                      <Spin size="small" />
                      <p style={{ marginTop: '8px', margin: 0 }}>Loading from MongoDB...</p>
                    </div>
                  ) : (
                    <div>
                      <DatabaseOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
                      <p>No recent activity found in MongoDB</p>
                      <Button size="small" onClick={handleRefresh}>
                        Refresh MongoDB Data
                      </Button>
                    </div>
                  )}
                </div>
              )
            }}
            scroll={{ x: true }}
          />
          
          {(!stats?.recentActivity || stats.recentActivity.length === 0) && !refreshing && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666', background: '#fafafa', borderRadius: '8px', marginTop: '16px' }}>
              <ExclamationCircleOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
              <p>No recent activity data found in MongoDB.</p>
              <p>This could indicate:</p>
              <ul style={{ textAlign: 'left', display: 'inline-block', margin: '8px 0' }}>
                <li>MongoDB collection is empty</li>
                <li>Backend API endpoints need configuration</li>
                <li>Database permissions or connectivity issues</li>
              </ul>
              <Space>
                <Button onClick={handleRefresh} type="primary" size="small">
                  Retry MongoDB Connection
                </Button>
                <Button 
                  onClick={() => window.open('https://docs.mongodb.com/atlas/', '_blank')} 
                  size="small"
                >
                  MongoDB Atlas Docs
                </Button>
              </Space>
            </div>
          )}
        </Card>

        {/* Enhanced System Health Footer */}
        <Card 
          size="small" 
          style={{ marginTop: '24px', borderRadius: '8px', background: '#f9f9f9' }}
          title="System Health Monitor"
        >
          <Row gutter={[16, 8]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Space>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: mongoConnection?.connected ? '#52c41a' : '#ff4d4f',
                  animation: mongoConnection?.connected ? 'pulse 2s infinite' : 'none'
                }}></div>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                  MongoDB: {mongoConnection?.connected ? 'Connected' : 'Disconnected'}
                </span>
              </Space>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <span style={{ fontSize: '12px' }}>
                Response: {mongoConnection?.latency || 0}ms
              </span>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <span style={{ fontSize: '12px' }}>
                Collections: {mongoConnection?.collections || 0}
              </span>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <span style={{ fontSize: '12px' }}>
                Last Check: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
              </span>
            </Col>
          </Row>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;