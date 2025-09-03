import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../components/context/AuthContext'; 
import { useTheme } from '../components/context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiDownload, 
  FiActivity, 
  FiClock,
  FiInbox,
  FiZap,
  FiTarget
} from 'react-icons/fi';
import './PopularCharts.css';

const PopularCharts = ({ charts: propCharts, maxCharts = 12 }) => {
  const { token } = useAuth();
  const { darkMode } = useTheme();
  const [charts, setCharts] = useState(propCharts || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharts = async () => {
      if (!token) {
        setError('Authentication token missing.');
        setIsLoading(false);
        return;
      }
      try {
        const response = await axios.get('http://localhost:5000/api/v1/charts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status === 'success') {
          // Limit the number of charts displayed to prevent UI overflow
          const chartsData = response.data.data.charts || [];
          setCharts(chartsData.slice(0, maxCharts));
        } else {
          setError('Failed to load charts.');
        }
      } catch (err) {
        setError(`Error: ${err.response?.data?.message || err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!propCharts) {
      fetchCharts();
    } else {
      setCharts(propCharts.slice(0, maxCharts));
      setIsLoading(false);
    }
  }, [token, propCharts, maxCharts]);

  // Enhanced chart icon mapping with only available Feather icons
  const getChartIcon = (type) => {
    const iconMap = {
      'bar': <FiBarChart2 className="chart-type-icon" />,
      'column': <FiBarChart2 className="chart-type-icon" />, // Using FiBarChart2 instead of FiBarChart3
      'pie': <FiPieChart className="chart-type-icon" />,
      'line': <FiTrendingUp className="chart-type-icon" />,
      'area': <FiActivity className="chart-type-icon" />,
      'scatter': <FiTarget className="chart-type-icon" />,
      'doughnut': <FiPieChart className="chart-type-icon" />,
      'radar': <FiZap className="chart-type-icon" />,
      'bubble': <FiTarget className="chart-type-icon" />,
      'default': <FiBarChart2 className="chart-type-icon" />
    };
    
    return iconMap[type?.toLowerCase()] || iconMap['default'];
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'Never';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now - date;
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
      return `${Math.floor(diffInDays / 30)}m ago`;
    } catch {
      return 'Unknown';
    }
  };

  // Format views count
  const formatViews = (count) => {
    if (!count || count === 0) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  // Handle view all action
  const handleViewAll = () => {
    navigate('/chartfiles');
  };

  // Handle chart download
  const handleDownload = (chart, event) => {
    event.stopPropagation();
    console.log('Download chart:', chart);
    
    // Example download logic - you can customize this based on your backend
    try {
      // Create a downloadable link (replace with your actual download endpoint)
      const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/v1/charts/${chart.id}/download`;
      
      // Create temporary link element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${chart.name || 'chart'}.${chart.format || 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      // You could show a toast notification here
    }
  };

  // Handle chart click
  const handleChartClick = (chart) => {
    console.log('Chart clicked:', chart);
    // Navigate to chart detail or open chart
    if (chart.id) {
      navigate(`/charts/${chart.id}`);
    }
  };

  // Enhanced loading state with skeleton
  if (isLoading) {
    return (
      <div className={`popular-charts loading ${darkMode ? 'dark' : ''}`}>
        <div className="section-header">
          <div className="loading-skeleton title-skeleton"></div>
          <div className="loading-skeleton button-skeleton"></div>
        </div>
        <div className="charts-list">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="chart-card skeleton">
              <div className="chart-info">
                <div className="loading-skeleton icon-skeleton"></div>
                <div className="chart-details">
                  <div className="loading-skeleton name-skeleton"></div>
                  <div className="loading-skeleton type-skeleton"></div>
                </div>
              </div>
              <div className="chart-stats">
                <div className="loading-skeleton stat-skeleton"></div>
                <div className="loading-skeleton stat-skeleton"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <div className={`popular-charts error ${darkMode ? 'dark' : ''}`}>
        <div className="error-message">
          <FiBarChart2 className="error-icon" />
          <h3>Failed to load charts</h3>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!charts || charts.length === 0) {
    return (
      <div className={`popular-charts ${darkMode ? 'dark' : ''}`}>
        <div className="section-header">
          <h2 className="section-title" id="popular-charts-title">Popular Charts</h2>
          <button 
            className="view-all" 
            onClick={handleViewAll}
            aria-label="View all charts"
          >
            View All
          </button>
        </div>
        <div className="charts-empty">
          <FiInbox className="charts-empty-icon" />
          <h3>No charts available</h3>
          <p>Start creating charts to see them here</p>
          <button 
            className="create-chart-btn"
            onClick={() => navigate('/create-chart')}
          >
            Create Your First Chart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`popular-charts ${darkMode ? 'dark' : ''}`}>
      <div className="section-header">
        <h2 className="section-title" id="popular-charts-title">
          Popular Charts
          {charts.length > 0 && (
            <span className="chart-count">({charts.length})</span>
          )}
        </h2>
        <button 
          className="view-all" 
          onClick={handleViewAll}
          aria-label="View all charts"
        >
          View All
        </button>
      </div>
      
      <div className="charts-list" role="list" aria-labelledby="popular-charts-title">
        {charts.map((chart, index) => (
          <div 
            className="chart-card" 
            key={chart.id || index}
            role="listitem"
            onClick={() => handleChartClick(chart)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleChartClick(chart);
              }
            }}
            tabIndex={0}
            aria-label={`${chart.name || 'Untitled Chart'} - ${chart.type || 'Unknown'} chart`}
          >
            <div className="chart-info">
              <div className="chart-icon" aria-hidden="true">
                {getChartIcon(chart.type)}
              </div>
              <div className="chart-details">
                <h3 className="chart-name" title={chart.name || 'Untitled Chart'}>
                  {chart.name || 'Untitled Chart'}
                </h3>
                <p className="chart-type">
                  {chart.type ? chart.type.charAt(0).toUpperCase() + chart.type.slice(1) : 'Unknown'} Chart
                </p>
              </div>
            </div>
            
            <div className="chart-stats">
              <div className="stat-item" role="text">
                <FiActivity className="stat-icon" aria-hidden="true" />
                <span>{formatViews(chart.views)} views</span>
              </div>
              <div className="stat-item" role="text">
                <FiClock className="stat-icon" aria-hidden="true" />
                <span>{formatTimeAgo(chart.lastViewed)}</span>
              </div>
            </div>
            
            <div className="chart-actions">
              <button 
                className="chart-action" 
                onClick={(e) => handleDownload(chart, e)}
                aria-label={`Download ${chart.name || 'chart'}`}
                title="Download chart"
              >
                <FiDownload />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {charts.length === maxCharts && (
        <div className="load-more-section">
          <p className="load-more-text">
            Showing {charts.length} of many charts
          </p>
          <button 
            className="load-more-btn" 
            onClick={handleViewAll}
          >
            View All Charts
          </button>
        </div>
      )}
    </div>
  );
};

PopularCharts.propTypes = {
  charts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      type: PropTypes.string,
      views: PropTypes.number,
      lastViewed: PropTypes.string,
      format: PropTypes.string
    })
  ),
  maxCharts: PropTypes.number
};

export default PopularCharts;