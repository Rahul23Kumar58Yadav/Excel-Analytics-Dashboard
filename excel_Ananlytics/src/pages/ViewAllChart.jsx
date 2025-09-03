import React, { useState, useEffect } from 'react';
import { useTheme } from '../components/context/ThemeContext'; 
import { useAuth } from '../components/context/AuthContext';
import PopularCharts from './PopularCharts';
import axios from 'axios';
import { 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiActivity,
  FiDownload, 
  FiEdit, 
  FiTrash2,
  FiEye,
  FiShare2,
  FiCopy
} from 'react-icons/fi';
import './ViewAllChart.css';

const ViewAllChart = () => {
  const { token, user } = useAuth();
  const { darkMode } = useTheme();

  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [editingChart, setEditingChart] = useState(null);
  const [newChartTitle, setNewChartTitle] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name', 'type'
  const [filterType, setFilterType] = useState('all'); // 'all', 'bar', 'line', 'pie', 'doughnut'

  const fetchAllCharts = async () => {
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      setLoading(false);
      console.warn('No token available for fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching charts with token:', token.substring(0, 5) + '...');
      const response = await axios.get('http://localhost:5000/api/v1/charts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Full API Response:', response.data);
      const data = response.data;
      
      if (data && typeof data === 'object' && data.status === 'success') {
        // Handle different response formats from backend
        let chartsData = [];
        
        if (Array.isArray(data.data)) {
          chartsData = data.data;
        } else if (data.data && Array.isArray(data.data.charts)) {
          chartsData = data.data.charts;
        } else if (data.data && Array.isArray(data.data.items)) {
          chartsData = data.data.items;
        } else if (data.data && typeof data.data === 'object') {
          // Handle case where data.data is a single chart object (from createChart)
          chartsData = [data.data];
        } else {
          console.warn('Unexpected data format:', data.data);
          chartsData = [];
        }
        
        setCharts(chartsData);
        
        if (chartsData.length === 0) {
          console.log('No charts found for user');
        }
      } else {
        console.warn('Non-success status:', data.status, data.message);
        setCharts([]);
        setError(data.message || 'Failed to load charts.');
      }
    } catch (err) {
      console.error('Error fetching all charts:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(`Failed to load charts: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCharts();
    
    // Listen for chart creation events
    const handleChartCreated = (event) => {
      console.log('Chart created event received:', event.detail);
      fetchAllCharts(); // Refresh the charts list
    };

    window.addEventListener('chartCreated', handleChartCreated);
    
    return () => {
      window.removeEventListener('chartCreated', handleChartCreated);
    };
  }, [token]);

  // Helper function to get the 3 most recent charts for PopularCharts
  const getRecentCharts = () => {
    if (!Array.isArray(charts) || charts.length === 0) return [];
    
    // Sort charts by creation date (newest first) and take the first 3
    const sortedCharts = [...charts].sort((a, b) => 
      new Date(b.createdAt || b.updatedAt || Date.now()) - new Date(a.createdAt || a.updatedAt || Date.now())
    );
    
    // Transform chart data to match PopularCharts component expectations
    return sortedCharts.slice(0, 3).map((chart, index) => ({
      id: chart._id || chart.id,
      name: chart.title || `Chart ${index + 1}`,
      type: chart.chartType || 'bar',
      views: chart.views || Math.floor(Math.random() * 100) + 10, // Mock views if not available
      lastViewed: chart.lastViewed || chart.updatedAt || chart.createdAt 
        ? new Date(chart.lastViewed || chart.updatedAt || chart.createdAt).toLocaleDateString()
        : 'Recently'
    }));
  };

  const getChartIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bar':
        return <FiBarChart2 />;
      case 'pie':
        return <FiPieChart />;
      case 'line':
        return <FiTrendingUp />;
      case 'doughnut':
        return <FiActivity />;
      case 'scatter':
        return <FiActivity />;
      case 'radar':
        return <FiActivity />;
      default:
        return <FiBarChart2 />;
    }
  };

  const handleDownload = async (chart) => {
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      console.error('Download failed: No token available');
      return;
    }

    if (!chart._id && !chart.id) {
      setError(`Cannot download ${chart.title}: Missing chart ID. Contact support.`);
      console.error('Download failed: Missing ID for chart', chart);
      return;
    }

    const chartId = chart._id || chart.id;
    setDownloading(chartId);
    setError(null);
    
    try {
      console.log('Attempting to download chart:', chart.title, 'with ID:', chartId);
      
      // If chart has image data, download directly
      if (chart.data?.image) {
        const link = document.createElement('a');
        link.href = chart.data.image;
        link.download = `${chart.title.replace(/\s+/g, '_')}_chart.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`Successfully downloaded ${chart.title}`);
        return;
      }

      // Otherwise, fetch from server
      const response = await axios.get(`http://localhost:5000/api/v1/charts/download/${chartId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'];
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${chart.title.replace(/\s+/g, '_')}_chart.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log(`Successfully downloaded ${chart.title}`);
    } catch (err) {
      console.error('Download error:', {
        chartTitle: chart.title,
        chartId: chartId,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (err.response?.status === 404) {
        setError(`Failed to download ${chart.title}: Chart not found on server. Please verify the chart exists or contact support.`);
        await fetchAllCharts();
      } else {
        setError(`Failed to download ${chart.title}: ${err.response?.data?.message || err.message}. Please try again or contact support.`);
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleEdit = (chart) => {
    console.log('Edit button clicked for chart:', chart._id || chart.id, chart.title);
    setEditingChart(chart);
    setNewChartTitle(chart.title);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      return;
    }

    if (!newChartTitle) {
      setError('Chart title cannot be empty.');
      return;
    }

    const chartId = editingChart._id || editingChart.id;
    try {
      setError(null);
      console.log('Updating chart title for ID:', chartId, 'to:', newChartTitle);
      const response = await axios.patch(
        `http://localhost:5000/api/v1/charts/${chartId}`,
        { title: newChartTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setCharts(charts.map(c => ((c._id || c.id) === chartId ? { ...c, title: newChartTitle } : c)));
        setEditingChart(null);
        setNewChartTitle('');
        console.log('Chart title updated successfully:', newChartTitle);
      } else {
        throw new Error(response.data.message || 'Failed to update chart title');
      }
    } catch (err) {
      console.error('Edit error:', {
        chartId: chartId,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(`Failed to update chart title: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (chartId) => {
    if (!chartId || typeof chartId !== 'string') {
      console.error('Invalid chartId:', chartId);
      setError('Invalid chart ID for deletion. Please try again.');
      return;
    }

    const chartExists = charts.some(chart => (chart._id || chart.id) === chartId);
    if (!chartExists) {
      console.warn('Chart ID not found in current list:', chartId);
      setError(`Chart not found in current list (ID: ${chartId}). Please refresh the page.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this chart? This action cannot be undone.')) {
      return;
    }

    console.log('Deleting chart with ID:', chartId);
    try {
      const response = await axios.delete(`http://localhost:5000/api/v1/charts/${chartId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Delete Response:', response.data);
      
      if (response.data.status === 'success') {
        setCharts(charts.filter(chart => (chart._id || chart.id) !== chartId));
      } else {
        throw new Error(response.data.message || 'Deletion failed');
      }
    } catch (err) {
      console.error('Error deleting chart:', {
        chartId,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMsg = err.response?.status === 404
        ? `Failed to delete chart. Chart not found (ID: ${chartId}).`
        : `Failed to delete chart: ${err.response?.data?.message || err.message}`;
      setError(errorMsg);
    }
  };

  const handleView = (chart) => {
    // Navigate to chart view or open in modal
    console.log('View chart:', chart);
    // You can implement chart viewing logic here
    // For now, just show chart details in an alert
    alert(`Chart: ${chart.title}\nType: ${chart.chartType}\nCreated: ${new Date(chart.createdAt || Date.now()).toLocaleDateString()}`);
  };

  const handleShare = async (chart) => {
    try {
      const shareUrl = `${window.location.origin}/charts/${chart._id || chart.id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Chart link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy link. Please try again.');
    }
  };

  const handleDuplicate = async (chart) => {
    try {
      const duplicatedChart = {
        title: `${chart.title} (Copy)`,
        chartType: chart.chartType,
        data: { ...chart.data },
        metadata: { ...chart.metadata, createdFrom: 'duplicate' }
      };

      const response = await axios.post('http://localhost:5000/api/v1/charts', duplicatedChart, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        await fetchAllCharts();
        alert('Chart duplicated successfully!');
      }
    } catch (err) {
      console.error('Failed to duplicate chart:', err);
      setError('Failed to duplicate chart. Please try again.');
    }
  };

  const filteredAndSortedCharts = React.useMemo(() => {
    let filtered = charts;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(chart => chart.chartType === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || b.updatedAt || Date.now()) - new Date(a.createdAt || a.updatedAt || Date.now());
        case 'oldest':
          return new Date(a.createdAt || a.updatedAt || Date.now()) - new Date(b.createdAt || b.updatedAt || Date.now());
        case 'name':
          return (a.title || '').localeCompare(b.title || '');
        case 'type':
          return (a.chartType || '').localeCompare(b.chartType || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [charts, filterType, sortBy]);

  if (loading) return <div className="loading-spinner">Loading charts...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!Array.isArray(charts)) return <div className="error-message">Charts data is invalid.</div>;

  return (
    <div className={`all-charts-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Popular Charts Section - Show 3 most recent charts */}
     

      <div className="charts-header">
        <h2>My Charts ({charts.length})</h2>
        <div className="charts-controls">
          <div className="filter-controls">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="bar">Bar Charts</option>
              <option value="line">Line Charts</option>
              <option value="pie">Pie Charts</option>
              <option value="doughnut">Doughnut Charts</option>
              <option value="scatter">Scatter Charts</option>
              <option value="radar">Radar Charts</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="type">Type</option>
            </select>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {filteredAndSortedCharts.length === 0 ? (
        <div className="no-charts">
          <FiBarChart2 size={64} />
          <h3>No charts found</h3>
          <p>Create your first chart to get started!</p>
        </div>
      ) : (
        <div className={`charts-container ${viewMode}-view`}>
          {filteredAndSortedCharts.map((chart) => {
            const chartId = chart._id || chart.id;
            return (
              <div className="chart-card" key={chartId}>
                <div className="chart-preview">
                  {chart.data?.image ? (
                    <img src={chart.data.image} alt={chart.title} className="chart-image" />
                  ) : (
                    <div className="chart-placeholder">
                      {getChartIcon(chart.chartType)}
                    </div>
                  )}
                </div>
                
                <div className="chart-info">
                  <div className="chart-header">
                    <h3 className="chart-title">{chart.title}</h3>
                    <span className="chart-type">
                      {getChartIcon(chart.chartType)}
                      {chart.chartType || 'chart'}
                    </span>
                  </div>
                  
                  <div className="chart-meta">
                    <span className="chart-date">
                      {chart.createdAt 
                        ? new Date(chart.createdAt).toLocaleDateString()
                        : chart.updatedAt 
                          ? new Date(chart.updatedAt).toLocaleDateString()
                          : 'Unknown date'
                      }
                    </span>
                    <span className="chart-size">
                      {chart.data?.labels?.length || 0} data points
                    </span>
                  </div>
                </div>
                
                <div className="chart-actions">
                  <button
                    className="action-btn view-btn"
                    title="View chart"
                    onClick={() => handleView(chart)}
                  >
                    <FiEye />
                  </button>
                  
                  <button
                    className="action-btn download-btn"
                    title="Download chart"
                    onClick={() => handleDownload(chart)}
                    disabled={downloading === chartId}
                  >
                    {downloading === chartId ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <FiDownload />
                    )}
                  </button>
                  
                  <button
                    className="action-btn edit-btn"
                    title="Edit chart"
                    onClick={() => handleEdit(chart)}
                  >
                    <FiEdit />
                  </button>
                  
                  <button
                    className="action-btn share-btn"
                    title="Share chart"
                    onClick={() => handleShare(chart)}
                  >
                    <FiShare2 />
                  </button>
                  
                  <button
                    className="action-btn duplicate-btn"
                    title="Duplicate chart"
                    onClick={() => handleDuplicate(chart)}
                  >
                    <FiCopy />
                  </button>
                  
                  <button
                    className="action-btn delete-btn"
                    title="Delete chart"
                    onClick={() => handleDelete(chartId)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingChart && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Chart Title</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                value={newChartTitle}
                onChange={(e) => setNewChartTitle(e.target.value)}
                placeholder="Enter new chart title"
                required
              />
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingChart(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAllChart;