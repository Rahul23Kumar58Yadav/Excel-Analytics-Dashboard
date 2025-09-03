import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import {
  FiHome, FiPieChart, FiFile, FiUpload, FiSettings,
  FiUser, FiLogOut, FiBarChart2, FiDollarSign,
  FiDatabase, FiTrendingUp, FiDownload, FiShare2,
  FiChevronLeft, FiMoon, FiSun, FiActivity, FiAlertCircle
} from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import RecentFiles from '../../pages/RecentFiles';
import PopularCharts from '../../pages/PopularCharts';
import SystemAlert from '../../pages/SystemAlert';
import { StatsGrid } from '../../pages/StatsGrid';

import './DashBoard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const { user, token, logout, isAuthenticated } = useAuth();
  
  // Refs for chart cleanup
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);

  const [stats, setStats] = useState([
    { icon: <FiDatabase />, title: "Total Files", value: 0, change: "+0%", trend: "up" },
    { icon: <FiBarChart2 />, title: "Storage Used", value: "0 MB", change: "+0%", trend: "up" },
    { icon: <FiPieChart />, title: "Charts Generated", value: 0, change: "+0%", trend: "up" },
    { icon: <FiTrendingUp />, title: "Active Users", value: 0, change: "+0%", trend: "up" }
  ]);

  const [dashboardData, setDashboardData] = useState({
    popularCharts: [],
    charts: {
      uploadActivity: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Files Uploaded',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: 'rgba(67, 97, 238, 0.2)',
          borderColor: 'rgba(67, 97, 238, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgba(67, 97, 238, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      storageUsage: {
        labels: ['Excel Files', 'Charts', 'Reports', 'Other'],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: ['#4361ee', '#4895ef', '#3f37c9', '#4cc9f0'],
          borderColor: ['#4361ee', '#4895ef', '#3f37c9', '#4cc9f0'],
          borderWidth: 2,
          hoverOffset: 4
        }]
      }
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      if (lineChartRef.current) {
        try {
          lineChartRef.current.destroy();
        } catch (e) {
          console.log('Line chart cleanup error:', e);
        }
      }
      if (barChartRef.current) {
        try {
          barChartRef.current.destroy();
        } catch (e) {
          console.log('Bar chart cleanup error:', e);
        }
      }
    };
  }, []);

  // Helper function to get auth token with multiple fallback methods
  const getAuthToken = () => {
    if (token) {
      console.log('Token from useAuth:', token.substring(0, 20) + '...');
      return token;
    }
    
    const localToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (localToken) {
      console.log('Token from localStorage:', localToken.substring(0, 20) + '...');
      return localToken;
    }
    
    const sessionToken = sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
    if (sessionToken) {
      console.log('Token from sessionStorage:', sessionToken.substring(0, 20) + '...');
      return sessionToken;
    }
    
    console.log('No token found in any storage method');
    return null;
  };

  // Fetch dashboard data (excluding recent files since they're fetched by RecentFiles component)
  useEffect(() => {
    const fetchDashboardData = async () => {
      const authToken = getAuthToken();
      
      if (!authToken) {
        console.log('No authentication token available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching dashboard data with token...');

        // Fetch files for stats calculation
        let allFiles = [];
        try {
          const filesResponse = await axios.get('http://localhost:5000/api/v1/files', {
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: 10000
          });
          
          console.log('Files API Response:', filesResponse.data);
          
          if (filesResponse.data?.status === 'success') {
            allFiles = Array.isArray(filesResponse.data.data) ? filesResponse.data.data :
              filesResponse.data.data?.files || filesResponse.data.data?.items || [];
          }
        } catch (filesError) {
          console.error('Files API Error:', filesError);
          if (filesError.response?.status === 401) {
            console.log('Token expired or invalid, redirecting to login...');
            logout();
            navigate('/auth/login');
            return;
          }
        }

        // Fetch saved charts
        let savedCharts = [];
        try {
          const chartsResponse = await axios.get('http://localhost:5000/api/v1/charts', {
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: 10000
          });
          
          console.log('Charts API Response:', chartsResponse.data);
          
          if (chartsResponse.data?.status === 'success') {
            savedCharts = Array.isArray(chartsResponse.data.data) ? chartsResponse.data.data :
              chartsResponse.data.data?.charts || [];
          }
        } catch (chartsError) {
          console.warn('Charts API Error:', chartsError);
        }

        // Calculate stats from files
        const fileStats = calculateFileStats(allFiles);
        
        // Process upload activity data
        const uploadDates = allFiles.map(file => new Date(file.createdAt || Date.now()).toLocaleString('default', { month: 'short' }));
        const uniqueMonths = [...new Set(uploadDates)];
        const uploadCounts = uniqueMonths.map(month => 
          allFiles.filter(f => new Date(f.createdAt || Date.now()).toLocaleString('default', { month: 'short' }) === month).length
        );
        const storageBreakdown = calculateStorageBreakdown(allFiles);

        const popularCharts = savedCharts.map(chart => ({
          name: chart.title || 'Untitled Chart',
          type: chart.chartType ? `${chart.chartType.charAt(0).toUpperCase() + chart.chartType.slice(1)} Chart` : 'Unknown Chart',
          views: chart.views || 0,
          lastViewed: chart.createdAt ? new Date(chart.createdAt).toLocaleDateString() : 'N/A'
        }));

        // Update dashboard data
        setDashboardData(prev => ({
          ...prev,
          popularCharts,
          charts: {
            uploadActivity: {
              ...prev.charts.uploadActivity,
              labels: uniqueMonths.length > 0 ? uniqueMonths : ['Jan', 'Feb', 'Mar'],
              datasets: [{
                ...prev.charts.uploadActivity.datasets[0],
                data: uploadCounts.length > 0 ? uploadCounts : [0, 0, 0]
              }]
            },
            storageUsage: {
              ...prev.charts.storageUsage,
              datasets: [{
                ...prev.charts.storageUsage.datasets[0],
                data: storageBreakdown
              }]
            }
          }
        }));

        // Update stats
        setStats([
          { icon: <FiDatabase />, title: "Total Files", value: fileStats.totalFiles, change: "+12%", trend: "up" },
          { icon: <FiBarChart2 />, title: "Storage Used", value: fileStats.totalSize, change: "+5%", trend: "up" },
          { icon: <FiPieChart />, title: "Charts Generated", value: savedCharts.length, change: "+23%", trend: "up" },
          { icon: <FiTrendingUp />, title: "Active Users", value: 12, change: "+4%", trend: "up" }
        ]);

        console.log('Dashboard data loaded successfully');

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        
        if (err.response?.status === 401) {
          console.log('Authentication failed, redirecting to login...');
          logout();
          navigate('/auth/login');
          return;
        }
        
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard';
        console.log('Setting error message:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 100);

    return () => clearTimeout(timer);
  }, [token, navigate, logout, refreshKey]);

  // Listen for file upload events to refresh dashboard data
  useEffect(() => {
    const handleFileUploaded = () => {
      console.log('File uploaded event received, refreshing dashboard...');
      setRefreshKey(prev => prev + 1); // This will trigger a re-fetch
    };

    window.addEventListener('fileUploaded', handleFileUploaded);
    return () => window.removeEventListener('fileUploaded', handleFileUploaded);
  }, []);

  const calculateFileStats = (files) => {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + ((file.size || 0) / 1024), 0);
    return { 
      totalFiles, 
      totalSize: `${totalSize.toFixed(1)} MB`, 
      processedFiles: files.filter(f => f.status === 'processed').length 
    };
  };

  const calculateStorageBreakdown = (files) => {
    const excelFiles = files.filter(f => f.mimetype?.includes('spreadsheet') || f.mimetype?.includes('excel')).length;
    const csvFiles = files.filter(f => f.mimetype?.includes('csv')).length;
    const jsonFiles = files.filter(f => f.mimetype?.includes('json')).length;
    const other = files.length - excelFiles - csvFiles - jsonFiles;
    return [excelFiles, csvFiles, jsonFiles, other]; // [Excel, CSV, JSON, Other]
  };

  const quickActions = useMemo(() => [
    {
      icon: <FiUpload />,
      title: 'Upload New File',
      action: () => navigate('/upload')
    },
    {
      icon: <FiPieChart />,
      title: 'Create Chart',
      action: () => navigate('/chart-creation')
    },
    {
      icon: <FiDollarSign />,
      title: 'Generate Report',
      action: () => navigate('/report-generation')
    },
    {
      icon: <FiShare2 />,
      title: 'Share Analysis',
      action: () => navigate('/analysis')
    },
  ], [navigate]);

  const chartOptions = {
    line: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
      },
      plugins: { 
        legend: { 
          position: 'top',
          display: true,
          labels: { 
            color: darkMode ? '#f8fafc' : '#1e293b',
            font: { family: 'Inter', size: 12 },
            usePointStyle: true,
            pointStyle: 'circle'
          } 
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          titleColor: darkMode ? '#f8fafc' : '#1e293b',
          bodyColor: darkMode ? '#94a3b8' : '#64748b',
          borderColor: darkMode ? '#334155' : '#e5e7eb',
          borderWidth: 1
        }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          display: true,
          grid: { 
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: { 
            color: darkMode ? '#94a3b8' : '#64748b',
            font: { size: 11 }
          }
        }, 
        x: { 
          display: true,
          grid: { display: false },
          ticks: { 
            color: darkMode ? '#94a3b8' : '#64748b',
            font: { size: 11 }
          }
        } 
      },
    },
    bar: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          titleColor: darkMode ? '#f8fafc' : '#1e293b',
          bodyColor: darkMode ? '#94a3b8' : '#64748b',
          borderColor: darkMode ? '#334155' : '#e5e7eb',
          borderWidth: 1
        }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          display: true,
          grid: { 
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: { 
            color: darkMode ? '#94a3b8' : '#64748b',
            font: { size: 11 }
          }
        }, 
        x: { 
          display: true,
          grid: { display: false },
          ticks: { 
            color: darkMode ? '#94a3b8' : '#64748b',
            font: { size: 11 }
          }
        } 
      },
    }
  };

  const handleRefreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Show authentication message if not logged in
  if (!isAuthenticated && !loading) {
    return (
      <div className={`dashboard-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="auth-required-message">
          <div className="auth-card">
            <FiUser size={48} />
            <h2>Authentication Required</h2>
            <p>Please log in to view your dashboard</p>
            <Link to="/auth/login" className="login-btn">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`dashboard-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dashboard-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="error-container">
          <FiAlertCircle size={48} />
          <h2>Dashboard Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="main-content">
        <Header 
          user={user} 
          isAuthenticated={isAuthenticated} 
          logout={logout} 
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />
        
        <div className="content">
          <StatsGrid stats={stats} darkMode={darkMode} />
          
          <QuickActions actions={quickActions} />
          
          <div className="charts-section">
            <ChartContainer 
              title="Upload Activity" 
              darkMode={darkMode}
              chart={
                <Line 
                  ref={lineChartRef}
                  data={dashboardData.charts.uploadActivity} 
                  options={chartOptions.line} 
                />
              } 
            />
            <ChartContainer 
              title="Storage Breakdown" 
              darkMode={darkMode}
              chart={
                <Bar 
                  ref={barChartRef}
                  data={dashboardData.charts.storageUsage} 
                  options={chartOptions.bar} 
                />
              } 
            />
          </div>
          
          <div className="data-section">
            <RecentFiles 
              darkMode={darkMode}
              onRefresh={handleRefreshDashboard}
            />
            <PopularCharts 
              charts={dashboardData.popularCharts} 
              darkMode={darkMode}
            />
          </div>
          
          <SystemAlert 
            message="Welcome to your dashboard!" 
            details="Your analytics platform is ready to use."
            action="Get Started"
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  );
};

// Header Component
const Header = ({ user, darkMode, toggleTheme }) => {
  const navigate = useNavigate();

  const handleProfileClick = () => navigate('/profile');

  const displayName = user?.name || user?.username || 'User';

  return (
    <header className={`topbar ${darkMode ? 'dark' : 'light'}`}>
      <h1>Dashboard Overview</h1>
      <div className="profile">
        <div className="user-menu">
          <span>Hello, {displayName}</span>
        </div>
        <button className="profile-btn" onClick={handleProfileClick}>
          Profile
        </button>
      </div>
    </header>
  );
};

// Quick Actions Component
const QuickActions = ({ actions }) => {
  return (
    <div className="quick-actions">
      <h2 className="section-title">Quick Actions</h2>
      <div className="actions-grid">
        {actions.map((action, index) => (
          <button
            key={index}
            className="action-card"
            onClick={action.action}
          >
            <div className="action-icon">{action.icon}</div>
            <span className="action-title">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Chart Container Component
const ChartContainer = ({ title, chart, darkMode }) => {
  const [chartError, setChartError] = useState(null);
  
  const downloadChart = () => {
    try {
      const chartCanvas = document.querySelector('.chart-wrapper canvas');
      if (chartCanvas) {
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '_')}_chart.png`;
        link.href = chartCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Chart download failed:', error);
    }
  };

  useEffect(() => {
    const handleChartError = (error) => {
      console.error('Chart rendering error:', error);
      setChartError(error.message);
    };

    window.addEventListener('error', handleChartError);
    return () => window.removeEventListener('error', handleChartError);
  }, []);

  if (chartError) {
    return (
      <div className={`chart-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
        </div>
        <div className="chart-error">
          <p>Chart failed to load</p>
          <button onClick={() => setChartError(null)}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`chart-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <button 
          onClick={downloadChart} 
          className="download-btn"
          aria-label={`Download ${title} chart`}
        >
          <FiDownload />
        </button>
      </div>
      <div className="chart-wrapper">
        {chart}
      </div>
    </div>
  );
};

export default Dashboard;