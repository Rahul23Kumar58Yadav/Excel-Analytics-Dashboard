import React, { useState, useEffect } from 'react';
import FileUploader from '../components/FileUploader';

import './Analyze.css';

const Analyze = () => {
  const [fileData, setFileData] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [chartTitle, setChartTitle] = useState('Data Analysis');
  const [is3D, setIs3D] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [colorScheme, setColorScheme] = useState('default');
  const [sampleData, setSampleData] = useState([]);

  // Sample data for demonstration
  useEffect(() => {
    setSampleData([
      { month: 'January', revenue: 5000, expenses: 3000, profit: 2000 },
      { month: 'February', revenue: 6000, expenses: 3500, profit: 2500 },
      { month: 'March', revenue: 7500, expenses: 4000, profit: 3500 },
      { month: 'April', revenue: 6500, expenses: 3800, profit: 2700 },
      { month: 'May', revenue: 8000, expenses: 4200, profit: 3800 },
      { month: 'June', revenue: 9000, expenses: 4500, profit: 4500 },
    ]);
  }, []);

    const trackAnalysis = async (action, chartType, dimensions) => {
    try {
      await fetch('/api/v1/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action,
          chartType,
          dimensions,
          metadata: {
            is3D,
            colorScheme,
            chartTitle
          }
        })
      });
    } catch (err) {
      console.error('Analytics tracking failed:', err);
    }
  };

  // Track initial analysis
  useEffect(() => {
    if (fileData) {
      trackAnalysis('analyze', chartType, `${xAxis} vs ${yAxis}`);
    }
  }, [fileData, chartType, xAxis, yAxis]);

  // Track chart configuration changes
  useEffect(() => {
    if (fileData) {
      trackAnalysis('chart_config_update', chartType, `${xAxis} vs ${yAxis}`);
    }
  }, [chartType, xAxis, yAxis, is3D, colorScheme]);



  const handleUploadSuccess = (data) => {
    setFileData(data);
    setXAxis(data.columns[0] || '');
    setYAxis(data.columns[1] || '');
  };

  const handleUseSampleData = () => {
    setFileData({
      columns: ['month', 'revenue', 'expenses', 'profit'],
      data: sampleData
    });
    setXAxis('month');
    setYAxis('revenue');
  };

  const handleExportChart = () => {
    alert('Export functionality would be implemented here');
    trackAnalysis('chart_export', chartType, `${xAxis} vs ${yAxis}`);
  };

 const handleSaveAnalysis = () => {
    alert('Analysis saved to your history');
    trackAnalysis('analysis_saved', chartType, `${xAxis} vs ${yAxis}`);
  };

  return (
    <div className="analyze-container">
      <div className="analyze-header">
        <h1 className="analyze-title">
          <i className="icon chart-icon">📊</i> Excel Data Analyzer
        </h1>
        <div className="header-actions">
          <button className="action-button" onClick={handleSaveAnalysis}>
            <i className="icon">💾</i> Save Analysis
          </button>
          <button className="action-button" onClick={handleExportChart}>
            <i className="icon">📤</i> Export Chart
          </button>
        </div>
      </div>
      
      <div className="analyze-content">
        <div className="control-panel">
          <div className="panel-section">
            <h2 className="panel-title">
              <i className="icon">📁</i> Data Source
            </h2>
            <FileUploader onUploadSuccess={handleUploadSuccess} />
            <div className="sample-data-section">
              <p className="or-divider">- OR -</p>
              <button 
                className="sample-data-button"
                onClick={handleUseSampleData}
              >
                Use Sample Financial Data
              </button>
            </div>
          </div>

          {fileData && (
            <>
              <div className="panel-section">
                <h2 className="panel-title">
                  <i className="icon">⚙️</i> Chart Configuration
                </h2>
                
                <div className="form-group">
                  <label>Chart Title</label>
                  <input
                    type="text"
                    value={chartTitle}
                    onChange={(e) => setChartTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Chart Type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    className="form-select"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="scatter">Scatter Plot</option>
                    <option value="area">Area Chart</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>X-Axis</label>
                    <select
                      value={xAxis}
                      onChange={(e) => setXAxis(e.target.value)}
                      className="form-select"
                    >
                      {fileData.columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Y-Axis</label>
                    <select
                      value={yAxis}
                      onChange={(e) => setYAxis(e.target.value)}
                      className="form-select"
                    >
                      {fileData.columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="3d-toggle"
                      checked={is3D}
                      onChange={(e) => setIs3D(e.target.checked)}
                    />
                    <label htmlFor="3d-toggle">3D View</label>
                  </div>

                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="grid-toggle"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                    />
                    <label htmlFor="grid-toggle">Show Grid</label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Color Scheme</label>
                  <select
                    value={colorScheme}
                    onChange={(e) => setColorScheme(e.target.value)}
                    className="form-select"
                  >
                    <option value="default">Default</option>
                    <option value="vibrant">Vibrant</option>
                    <option value="pastel">Pastel</option>
                    <option value="monochrome">Monochrome</option>
                  </select>
                </div>
              </div>

              <div className="panel-section data-preview">
                <h2 className="panel-title">
                  <i className="icon">🔍</i> Data Preview
                </h2>
                <div className="preview-table-container">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {fileData.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fileData.data.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          {fileData.columns.map((col) => (
                            <td key={col}>{row[col] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                      {fileData.data.length > 5 && (
                        <tr>
                          <td colSpan={fileData.columns.length} className="more-rows">
                            + {fileData.data.length - 5} more rows...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="visualization-area">
          {fileData ? (
            <div className="chart-container">
              <Chart2D
                data={fileData.data}
                chartType={chartType}
                xAxis={xAxis}
                yAxis={yAxis}
                title={chartTitle}
                is3D={is3D}
                showGrid={showGrid}
                colorScheme={colorScheme}
              />
              <div className="chart-summary">
                <h3>Chart Summary</h3>
                <p>
                  Showing <strong>{fileData.data.length}</strong> records of{' '}
                  <strong>{fileData.columns.join(', ')}</strong>
                </p>
                <p>
                  Chart type: <strong>{chartType}</strong> | X-Axis:{' '}
                  <strong>{xAxis}</strong> | Y-Axis: <strong>{yAxis}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-content">
                <i className="empty-icon">📊</i>
                <h2>No Data Loaded</h2>
                <p>
                  Upload your Excel file or use our sample data to start
                  visualizing your information
                </p>
                <button
                  className="sample-data-button"
                  onClick={handleUseSampleData}
                >
                  Load Sample Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analyze;