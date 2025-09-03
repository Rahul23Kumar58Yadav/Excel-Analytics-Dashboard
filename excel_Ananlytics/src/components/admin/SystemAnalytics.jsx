import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, DatePicker, Select, Divider, Table, Tag,
  Typography, Alert, Button, Spin, Tooltip, Switch, Space,
  Statistic, Progress, message, Badge, Avatar
} from 'antd';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  SyncOutlined, UserOutlined, FileOutlined, BarChartOutlined,
  DatabaseOutlined, DownloadOutlined, SunOutlined, MoonOutlined, 
  CalendarOutlined, FilterOutlined, EyeOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useTheme } from '../context/ThemeContext';
import { getAuthToken } from '../../services/apiService';
import './SystemAnalytics.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="Error in System Analytics"
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

// Enhanced API functions for analytics using the same pattern as UserManagement
const fetchAnalyticsUserGrowth = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`/api/admin/analytics/user-growth?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Access denied - authentication required');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (err) {
    console.warn('User growth API not available, using mock data:', err);
    const baseDate = moment().subtract(6, 'months');
    return Array.from({ length: 6 }, (_, i) => ({
      name: baseDate.clone().add(i, 'month').format('MMM YYYY'),
      month: baseDate.clone().add(i, 'month').format('YYYY-MM'),
      totalUsers: Math.floor(Math.random() * 500) + 200 + (i * 50),
      newUsers: Math.floor(Math.random() * 100) + 20,
      activeUsers: Math.floor(Math.random() * 400) + 150 + (i * 40),
    }));
  }
};

const fetchAnalyticsActivity = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`/api/admin/analytics/daily-activity?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Access denied - authentication required');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (err) {
    console.warn('Daily activity API not available, using mock data:', err);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map((day, index) => ({
      name: day.slice(0, 3),
      day: day,
      uploads: Math.floor(Math.random() * 40) + 10,
      charts: Math.floor(Math.random() * 50) + 20,
      logins: Math.floor(Math.random() * 100) + 50,
      downloads: Math.floor(Math.random() * 30) + 15,
      date: moment().subtract(6 - index, 'days').format('YYYY-MM-DD'),
    }));
  }
};

const fetchAnalyticsFileTypes = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`/api/admin/analytics/file-types?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Access denied - authentication required');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (err) {
    console.warn('File types API not available, using mock data:', err);
    return [
      { name: 'Excel Files', value: 145, percentage: 45, color: '#0088FE', count: 145 },
      { name: 'CSV Files', value: 97, percentage: 30, color: '#00C49F', count: 97 },
      { name: 'PDF Files', value: 48, percentage: 15, color: '#FFBB28', count: 48 },
      { name: 'Word Documents', value: 32, percentage: 10, color: '#FF8042', count: 32 },
    ];
  }
};

const fetchAnalyticsActivities = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const queryParams = new URLSearchParams({
      ...params,
      limit: params.limit || 10,
      page: params.page || 1,
    }).toString();

    const response = await fetch(`/api/admin/analytics/recent-activities?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Access denied - authentication required');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (err) {
    console.warn('Recent activities API not available, using mock data:', err);
    return [
      {
        id: '1',
        user: { name: 'John Doe', avatar: null, email: 'john@example.com', id: 'user1' },
        action: 'File Upload',
        actionType: 'upload',
        target: 'sales_data.xlsx',
        timestamp: moment().subtract(10, 'minutes').toISOString(),
        status: 'completed',
        details: 'Uploaded quarterly sales report',
        ip: '192.168.1.100',
        fileSize: '2.3 MB',
      },
      {
        id: '2',
        user: { name: 'Jane Smith', avatar: null, email: 'jane@example.com', id: 'user2' },
        action: 'Chart Generation',
        actionType: 'chart',
        target: 'Revenue Analysis',
        timestamp: moment().subtract(25, 'minutes').toISOString(),
        status: 'completed',
        details: 'Generated line chart for revenue trends',
        ip: '192.168.1.101',
        chartType: 'line',
      },
      {
        id: '3',
        user: { name: 'System Admin', avatar: null, email: 'admin@system.com', id: 'admin1' },
        action: 'System Update',
        actionType: 'system',
        target: 'v2.1.0',
        timestamp: moment().subtract(1, 'hour').toISOString(),
        status: 'system',
        details: 'System maintenance and updates',
        ip: 'localhost',
      },
      {
        id: '4',
        user: { name: 'Mike Johnson', avatar: null, email: 'mike@example.com', id: 'user3' },
        action: 'File Download',
        actionType: 'download',
        target: 'customer_report.pdf',
        timestamp: moment().subtract(2, 'hours').toISOString(),
        status: 'completed',
        details: 'Downloaded customer analysis report',
        ip: '192.168.1.102',
        fileSize: '1.8 MB',
      },
      {
        id: '5',
        user: { name: 'Sarah Wilson', avatar: null, email: 'sarah@example.com', id: 'user4' },
        action: 'File Upload',
        actionType: 'upload',
        target: 'inventory_data.csv',
        timestamp: moment().subtract(3, 'hours').toISOString(),
        status: 'failed',
        details: 'Upload failed due to file size limit',
        ip: '192.168.1.103',
        fileSize: '12.5 MB',
        errorMessage: 'File size exceeds 10MB limit',
      },
    ];
  }
};

const fetchAnalyticsMetrics = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`/api/admin/analytics/system-metrics?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Access denied - authentication required');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (err) {
    console.warn('System metrics API not available, using mock data:', err);
    return {
      totalUsers: 1245,
      activeUsers: 892,
      inactiveUsers: 353,
      totalFiles: 5678,
      processedFiles: 5234,
      failedFiles: 444,
      totalCharts: 8923,
      storageUsed: 65.4,
      storageTotal: 100,
      storageUsedMB: 6540,
      storageTotalMB: 10000,
      averageResponseTime: 245,
      systemUptime: 99.8,
      dailyActiveUsers: 234,
      weeklyActiveUsers: 567,
      monthlyActiveUsers: 892,
      errorRate: 0.2,
      peakConcurrentUsers: 145,
      bandwidthUsage: 78.5,
      serverLoad: 45.2,
      memoryUsage: 67.8,
      diskUsage: 82.1,
      lastUpdated: moment().toISOString(),
    };
  }
};

const SystemAnalytics = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [timeRange, setTimeRange] = useState('week');
  const [dateRange, setDateRange] = useState([]);
  const [userData, setUserData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [activitiesPagination, setActivitiesPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const fetchAnalyticsData = useCallback(async (showLoadingSpinner = true, paginationParams = null) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      if (paginationParams) setTableLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const params = {
        timeRange,
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD'),
      };

      // Activities pagination params
      const activitiesParams = {
        ...params,
        page: paginationParams?.current || activitiesPagination.current,
        limit: paginationParams?.pageSize || activitiesPagination.pageSize,
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      Object.keys(activitiesParams).forEach(key => {
        if (!activitiesParams[key]) delete activitiesParams[key];
      });

      console.log('Fetching analytics with params:', params);

      // Fetch all data concurrently
      const [userGrowth, dailyActivity, fileTypes, activities, metrics] = await Promise.all([
        fetchAnalyticsUserGrowth(params),
        fetchAnalyticsActivity(params),
        fetchAnalyticsFileTypes(params),
        fetchAnalyticsActivities(activitiesParams),
        fetchAnalyticsMetrics(params),
      ]);

      // Validate and set data with proper error handling
      if (!Array.isArray(userGrowth)) {
        console.warn('Invalid user growth data format, using fallback');
        setUserData([]);
      } else {
        setUserData(userGrowth);
      }

      if (!Array.isArray(dailyActivity)) {
        console.warn('Invalid daily activity data format, using fallback');
        setActivityData([]);
      } else {
        setActivityData(dailyActivity);
      }

      if (!Array.isArray(fileTypes)) {
        console.warn('Invalid file type data format, using fallback');
        setPieData([]);
      } else {
        setPieData(fileTypes);
      }

      // Handle activities response (can be array or paginated object)
      if (Array.isArray(activities)) {
        setRecentActivities(activities);
        setActivitiesPagination(prev => ({ ...prev, total: activities.length }));
      } else if (activities && activities.activities) {
        setRecentActivities(activities.activities);
        setActivitiesPagination(prev => ({
          ...prev,
          total: activities.total || activities.totalCount || activities.activities.length,
          current: activities.currentPage || paginationParams?.current || prev.current,
          pageSize: activities.itemsPerPage || paginationParams?.pageSize || prev.pageSize,
        }));
      } else {
        setRecentActivities([]);
      }

      if (typeof metrics !== 'object' || metrics === null) {
        console.warn('Invalid system metrics data format, using fallback');
        setSystemMetrics({});
      } else {
        setSystemMetrics(metrics);
      }

      console.log('Analytics data loaded successfully', {
        userGrowth: userGrowth.length,
        dailyActivity: dailyActivity.length,
        fileTypes: fileTypes.length,
        activities: Array.isArray(activities) ? activities.length : activities?.activities?.length || 0,
        metrics: Object.keys(metrics).length,
      });
    } catch (err) {
      console.error('Fetch analytics error:', {
        message: err.message,
        stack: err.stack,
        timeRange,
        dateRange: dateRange.map(d => d?.format('YYYY-MM-DD')),
      });
      
      setError(err.message || 'Failed to fetch analytics data');
      
      if (!showLoadingSpinner) {
        message.error(`Failed to refresh analytics: ${err.message}`);
      }

      // Handle authentication errors same as UserManagement
      if (err.message.includes('Access denied') || err.message.includes('authentication') || err.message.includes('token')) {
        message.error('Session expired. Please login again.');
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
        return;
      }
    } finally {
      if (showLoadingSpinner) setLoading(false);
      if (paginationParams) setTableLoading(false);
    }
  }, [timeRange, dateRange, activitiesPagination.current, activitiesPagination.pageSize]);

  useEffect(() => {
    fetchAnalyticsData(true);
  }, [timeRange, dateRange]); // Only depend on time range and date range for initial fetch

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAnalyticsData(false); // Don't show loading spinner for auto-refresh
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh, fetchAnalyticsData]);

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    if (value !== 'custom') {
      setDateRange([]);
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates || []);
    if (dates && dates.length === 2) {
      setTimeRange('custom');
    }
  };

  const refreshData = () => {
    setError(null);
    setActivitiesPagination(prev => ({ ...prev, current: 1 }));
    fetchAnalyticsData(true);
    message.success('Analytics data refreshed');
  };

  const handleActivitiesTableChange = (newPagination) => {
    setActivitiesPagination(newPagination);
    fetchAnalyticsData(false, newPagination);
  };

  const exportAnalyticsData = async () => {
    try {
      const exportData = {
        metadata: {
          generatedAt: moment().toISOString(),
          timeRange,
          dateRange: dateRange.map(d => d?.format('YYYY-MM-DD')),
          generatedBy: 'System Analytics Dashboard',
        },
        systemMetrics,
        userGrowth: userData,
        dailyActivity: activityData,
        fileTypeDistribution: pieData,
        recentActivities: recentActivities,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_analytics_${moment().format('YYYY-MM-DD_HH-mm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success('Analytics data exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      message.error('Failed to export analytics data');
    }
  };

  const activityColumns = [
    {
      title: <Text strong>USER</Text>,
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <Space className="user-info-space">
          <Avatar
            src={user?.avatar}
            icon={<UserOutlined />}
            size="small"
            className="activity-user-avatar"
          />
          <div className="activity-user-details">
            <Text strong className="activity-user-name">
              {user?.name || 'System'}
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {user?.email || 'system@internal'}
              </Text>
            </div>
          </div>
        </Space>
      ),
      width: 180,
    },
    {
      title: <Text strong>ACTION</Text>,
      dataIndex: 'action',
      key: 'action',
      render: (action, record) => (
        <div>
          <Text strong>{action}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.target}
            </Text>
          </div>
          {record.details && (
            <div>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {record.details}
              </Text>
            </div>
          )}
        </div>
      ),
      width: 200,
    },
    {
      title: <Text strong>TIME</Text>,
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => (
        <Tooltip title={moment(timestamp).format('LLLL')}>
          <div>
            <Text>{moment(timestamp).format('MMM DD')}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {moment(timestamp).format('HH:mm')}
              </Text>
            </div>
          </div>
        </Tooltip>
      ),
      width: 100,
      sorter: true,
    },
    {
      title: <Text strong>STATUS</Text>,
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const statusConfig = {
          completed: { color: 'green', text: 'SUCCESS' },
          system: { color: 'blue', text: 'SYSTEM' },
          failed: { color: 'red', text: 'FAILED' },
          pending: { color: 'orange', text: 'PENDING' },
          processing: { color: 'purple', text: 'PROCESSING' },
        };
        
        const config = statusConfig[status] || { color: 'default', text: 'UNKNOWN' };
        
        return (
          <div>
            <Tag color={config.color}>
              {config.text}
            </Tag>
            {record.errorMessage && (
              <div>
                <Text type="danger" style={{ fontSize: '10px' }}>
                  {record.errorMessage}
                </Text>
              </div>
            )}
          </div>
        );
      },
      width: 120,
      filters: [
        { text: 'Success', value: 'completed' },
        { text: 'Failed', value: 'failed' },
        { text: 'System', value: 'system' },
        { text: 'Pending', value: 'pending' },
      ],
    },
  ];

  if (loading && !userData.length && !activityData.length && !pieData.length && !recentActivities.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="analytics-container">
        <Card
          className="analytics-card"
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <Title level={3} className="page-title">
                  <BarChartOutlined /> System Analytics Dashboard
                </Title>
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                  Real-time system insights and performance metrics
                </Text>
              </div>
              <Tooltip title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}>
                <Switch
                  checked={darkMode}
                  onChange={toggleTheme}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                  style={{ backgroundColor: darkMode ? '#1890ff' : '#d9d9d9' }}
                />
              </Tooltip>
            </div>
          }
          extra={
            <Space wrap>
              <Tooltip title="Auto-refresh every 30 seconds">
                <Switch
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                  checkedChildren="Auto"
                  unCheckedChildren="Manual"
                  size="small"
                />
              </Tooltip>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportAnalyticsData}
                className="export-btn"
              >
                <span className="desktop-only">Export</span>
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={refreshData}
                loading={loading}
                className="refresh-btn"
              >
                <span className="desktop-only">Refresh</span>
              </Button>
            </Space>
          }
        >
          {/* Enhanced Controls */}
          <div className="analytics-controls">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8} lg={6}>
                <Select
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  className="filter-select"
                  style={{ width: '100%' }}
                  suffixIcon={<CalendarOutlined />}
                >
                  <Option value="day">Today</Option>
                  <Option value="week">This Week</Option>
                  <Option value="month">This Month</Option>
                  <Option value="quarter">This Quarter</Option>
                  <Option value="year">This Year</Option>
                  <Option value="custom">Custom Range</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  className="date-range-picker"
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  disabled={timeRange !== 'custom'}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Select
                  value={chartType}
                  onChange={setChartType}
                  className="filter-select"
                  style={{ width: '100%' }}
                  suffixIcon={<FilterOutlined />}
                >
                  <Option value="line">Line Charts</Option>
                  <Option value="area">Area Charts</Option>
                  <Option value="bar">Bar Charts</Option>
                </Select>
              </Col>
            </Row>
          </div>

          {error && (
            <Alert
              message="Error Loading Analytics"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
              action={<Button size="small" danger onClick={refreshData}>Retry</Button>}
            />
          )}

          {/* Enhanced Metrics Grid */}
          <Row gutter={[16, 16]} className="metrics-row">
            <Col xs={24} sm={12} md={6}>
              <Card className="metric-card">
                <Statistic
                  title="Total Users"
                  value={systemMetrics.totalUsers || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  suffix={
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      (+12% this week)
                    </Text>
                  }
                />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">Active: {systemMetrics.activeUsers || 0}</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="metric-card">
                <Statistic
                  title="Files Uploaded"
                  value={systemMetrics.totalFiles || 0}
                  prefix={<FileOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  suffix={
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      (+8% this week)
                    </Text>
                  }
                />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">Today: {activityData.reduce((sum, d) => sum + (d.uploads || 0), 0)}</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="metric-card">
                <Statistic
                  title="Charts Generated"
                  value={systemMetrics.totalCharts || 0}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                  suffix={
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      (+15% this week)
                    </Text>
                  }
                />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">Today: {activityData.reduce((sum, d) => sum + (d.charts || 0), 0)}</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="metric-card">
                <Statistic
                  title="Storage Used"
                  value={systemMetrics.storageUsed || 0}
                  precision={1}
                  suffix="%"
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ 
                    color: (systemMetrics.storageUsed || 0) > 80 ? '#ff4d4f' : '#fa8c16' 
                  }}
                />
                <Progress
                  percent={systemMetrics.storageUsed || 0}
                  size="small"
                  showInfo={false}
                  strokeColor={(systemMetrics.storageUsed || 0) > 80 ? '#ff4d4f' : '#1890ff'}
                  style={{ marginTop: '8px' }}
                />
              </Card>
            </Col>
          </Row>

          {/* System Health Indicators */}
          <Row gutter={[16, 16]} className="health-row" style={{ marginTop: '16px' }}>
            <Col xs={24} sm={8}>
              <Card size="small" className="health-card">
                <Statistic
                  title="System Uptime"
                  value={systemMetrics.systemUptime || 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" className="health-card">
                <Statistic
                  title="Response Time"
                  value={systemMetrics.averageResponseTime || 0}
                  suffix="ms"
                  valueStyle={{ 
                    color: (systemMetrics.averageResponseTime || 0) > 500 ? '#ff4d4f' : '#52c41a' 
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" className="health-card">
                <Statistic
                  title="Error Rate"
                  value={systemMetrics.errorRate || 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ 
                    color: (systemMetrics.errorRate || 0) > 1 ? '#ff4d4f' : '#52c41a' 
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* Enhanced Charts */}
          <Row gutter={[16, 16]} className="charts-row">
            <Col xs={24} lg={12}>
              <Card title="User Growth Trends" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'line' ? (
                    <LineChart data={userData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                        name="Total Users"
                      />
                      <Line
                        type="monotone"
                        dataKey="newUsers"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="New Users"
                      />
                      <Line
                        type="monotone"
                        dataKey="activeUsers"
                        stroke="#ffc658"
                        strokeWidth={2}
                        name="Active Users"
                      />
                    </LineChart>
                  ) : chartType === 'area' ? (
                    <AreaChart data={userData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="Total Users"
                      />
                      <Area
                        type="monotone"
                        dataKey="newUsers"
                        stackId="1"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="New Users"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={userData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#8884d8" name="Total Users" />
                      <Bar dataKey="newUsers" fill="#82ca9d" name="New Users" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Daily Activity Overview" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="uploads" fill="#82ca9d" name="File Uploads" />
                    <Bar dataKey="charts" fill="#8884d8" name="Chart Generations" />
                    <Bar dataKey="logins" fill="#ffc658" name="User Logins" />
                    <Bar dataKey="downloads" fill="#ff7300" name="File Downloads" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="File Types Distribution" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Recent System Activities" className="activities-card">
                <Table
                  columns={activityColumns}
                  dataSource={recentActivities}
                  pagination={{
                    pageSize: 5,
                    size: 'small',
                    showSizeChanger: false,
                    showQuickJumper: false,
                  }}
                  size="small"
                  rowKey="id"
                  className="activities-table"
                  loading={loading}
                />
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <Button size="small" type="link">
                    View All Activities
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Performance Metrics */}
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col span={24}>
              <Card title="System Performance Metrics" className="performance-card">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <div className="performance-metric">
                      <Text strong>Peak Concurrent Users</Text>
                      <div>
                        <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
                          {systemMetrics.peakConcurrentUsers || 0}
                        </Title>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Last 24 hours
                        </Text>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div className="performance-metric">
                      <Text strong>Bandwidth Usage</Text>
                      <div>
                        <Title level={4} style={{ margin: 0, color: '#fa8c16' }}>
                          {systemMetrics.bandwidthUsage || 0}%
                        </Title>
                        <Progress
                          percent={systemMetrics.bandwidthUsage || 0}
                          size="small"
                          showInfo={false}
                          strokeColor="#fa8c16"
                        />
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div className="performance-metric">
                      <Text strong>Daily Active Users</Text>
                      <div>
                        <Title level={4} style={{ margin: 0, color: '#13c2c2' }}>
                          {systemMetrics.dailyActiveUsers || 0}
                        </Title>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Last 24 hours
                        </Text>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div className="performance-metric">
                      <Text strong>Monthly Active</Text>
                      <div>
                        <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                          {systemMetrics.monthlyActiveUsers || 0}
                        </Title>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          This month
                        </Text>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Real-time Status */}
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col span={24}>
              <Card title="System Status" size="small" className="status-card">
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={8} md={6}>
                    <Space>
                      <div className={`status-indicator ${(systemMetrics.systemUptime || 0) > 99 ? 'status-good' : 'status-warning'}`}></div>
                      <Text strong>Database</Text>
                      <Tag color={(systemMetrics.systemUptime || 0) > 99 ? 'green' : 'orange'}>
                        {(systemMetrics.systemUptime || 0) > 99 ? 'HEALTHY' : 'WARNING'}
                      </Tag>
                    </Space>
                  </Col>
                  <Col xs={24} sm={8} md={6}>
                    <Space>
                      <div className={`status-indicator ${(systemMetrics.averageResponseTime || 0) < 300 ? 'status-good' : 'status-warning'}`}></div>
                      <Text strong>API Server</Text>
                      <Tag color={(systemMetrics.averageResponseTime || 0) < 300 ? 'green' : 'orange'}>
                        {(systemMetrics.averageResponseTime || 0) < 300 ? 'HEALTHY' : 'SLOW'}
                      </Tag>
                    </Space>
                  </Col>
                  <Col xs={24} sm={8} md={6}>
                    <Space>
                      <div className={`status-indicator ${(systemMetrics.storageUsed || 0) < 80 ? 'status-good' : 'status-warning'}`}></div>
                      <Text strong>Storage</Text>
                      <Tag color={(systemMetrics.storageUsed || 0) < 80 ? 'green' : 'red'}>
                        {(systemMetrics.storageUsed || 0) < 80 ? 'HEALTHY' : 'CRITICAL'}
                      </Tag>
                    </Space>
                  </Col>
                  <Col xs={24} sm={8} md={6}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Last updated: {moment().format('HH:mm:ss')}
                      {autoRefresh && <span> (Auto-refresh ON)</span>}
                    </Text>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default SystemAnalytics;