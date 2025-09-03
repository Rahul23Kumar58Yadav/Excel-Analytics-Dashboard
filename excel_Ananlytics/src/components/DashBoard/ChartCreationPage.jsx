import React, { useState, useEffect, useRef } from 'react';
import * as Chart from 'chart.js';
import * as XLSX from 'xlsx'; // Add this import for real Excel parsing (install: npm install xlsx)
import { Upload, FileText, BarChart3, TrendingUp, PieChart, Target, Radar, Activity, Table, Eye, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API_CONFIG from '../../config';
import axios from 'axios';
import "./ChartCreationPage.css";

const ChartCreationPage = () => {
  const { token } = useAuth();
  const { darkMode } = useTheme();
  const [chartType, setChartType] = useState('bar');
  const [chartTitle, setChartTitle] = useState('Interactive Data Visualization');
  const [is3D, setIs3D] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedXAxis, setSelectedXAxis] = useState('');
  const [selectedYAxis, setSelectedYAxis] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [dataStats, setDataStats] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Added for better error UX
  
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const fileInputRef = useRef(null);

  // Default sample data (unchanged)
  const [chartData, setChartData] = useState({
    labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024'],
    datasets: [
      {
        label: 'Revenue ($M)',
        data: [45, 62, 58, 73, 89, 95],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(59, 130, 246, 0.8)', 
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ],
  });

  const chartTypes = [
    { type: 'bar', icon: BarChart3, label: 'Bar Chart', description: 'Compare categories' },
    { type: 'line', icon: TrendingUp, label: 'Line Chart', description: 'Show trends over time' },
    { type: 'pie', icon: PieChart, label: 'Pie Chart', description: 'Show proportions' },
    { type: 'doughnut', icon: Target, label: 'Doughnut', description: 'Hollow pie chart' },
    { type: 'scatter', icon: Activity, label: 'Scatter', description: 'Show correlations' },
    { type: 'radar', icon: Radar, label: 'Radar', description: 'Multi-dimensional data' },
    { type: 'polarArea', icon: Radar, label: 'Polar Area', description: 'Area-based radar' } // Added to align with backend
  ];

  const colorPalettes = [
    ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'],
    ['#0ea5e9', '#22c55e', '#f97316', '#e879f9', '#8b5cf6', '#06b6d4', '#eab308', '#ef4444'],
    ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#1f2937', '#4b5563', '#6b7280', '#9ca3af']
  ];

  // Save chart to backend (improved with options, validation, timeout)
 // In ChartCreationPage.jsx, replace the saveChart function
// In ChartCreationPage.jsx, replace saveChart function
const saveChart = async () => {
  if (!token) {
    setErrorMessage('Please log in to save charts');
    return;
  }

  if (!chartTitle.trim()) {
    setErrorMessage('Please enter a chart title');
    return;
  }

  if (!chartRef.current) {
    setErrorMessage('Chart not rendered yet');
    return;
  }

  setIsSaving(true);
  setSaveSuccess(false);
  setErrorMessage('');

  try {
    // Validate token format
    if (token.length < 20) {
      throw new Error('Invalid token format');
    }

    // Get chart image as base64
    const chartImageData = chartRef.current.toDataURL('image/png');
    
    const chartPayload = {
      title: chartTitle.trim(),
      chartType: chartType,
      data: {
        labels: chartData.labels.map(String),
        datasets: chartData.datasets.map(dataset => ({
          label: dataset.label || 'Dataset',
          data: dataset.data.map(val => Number(val) || 0), // Ensure numeric
          backgroundColor: Array.isArray(dataset.backgroundColor) 
            ? dataset.backgroundColor 
            : colorPalettes[0].map(c => `${c}80`),
          borderColor: Array.isArray(dataset.borderColor) 
            ? dataset.borderColor 
            : colorPalettes[0],
          borderWidth: Number(dataset.borderWidth) || 2,
          tension: Number(dataset.tension) || 0.4,
          fill: typeof dataset.fill === 'boolean' ? dataset.fill : (chartType === 'line' ? false : true)
        })),
        image: chartImageData
      },
      options: getChartOptions(),
      metadata: {
        xAxis: selectedXAxis,
        yAxis: selectedYAxis,
        fileName: uploadedFile?.name,
        is3D: is3D,
        createdFrom: uploadedFile ? 'file' : 'sample'
      }
    };

    console.log('Saving chart with payload:', {
      title: chartPayload.title,
      chartType: chartPayload.chartType,
      hasImage: !!chartPayload.data.image,
      dataPointsCount: chartPayload.data.labels?.length || 0,
      tokenPreview: token.substring(0, 20) + '...'
    });

    const response = await axios.post(
      `${API_CONFIG.API_BASE_URL}${API_CONFIG.ENDPOINTS.CHARTS}`,
      chartPayload,
      {
        headers: { 
          ...API_CONFIG.DEFAULT_HEADERS,
          Authorization: `Bearer ${token}`
        },
        timeout: API_CONFIG.TIMEOUT
      }
    );

    if (response.data.status === 'success') {
      setSaveSuccess(true);
      window.dispatchEvent(new CustomEvent('chartCreated', { 
        detail: response.data.data 
      }));
      setTimeout(() => setSaveSuccess(false), 3000);
      console.log('Chart saved successfully:', response.data.data);
    } else {
      throw new Error(response.data.message || 'Failed to save chart');
    }
  } catch (error) {
    console.error('Error saving chart:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Failed to save chart. Check server logs.';
    setErrorMessage(`Error: ${errorMsg}`);
    if (error.response?.status === 401) {
      setErrorMessage('Session expired. Please log in again.');
      // Optionally redirect: window.location.href = '/login';
    }
  } finally {
    setIsSaving(false);
  }
};

  // Analyze data structure and types (unchanged, but good)
  const analyzeData = (data) => {
    if (!data || data.length === 0) return {};

    const columns = Object.keys(data[0]);
    const stats = {};

    columns.forEach(col => {
      const values = data.map(row => row[col]).filter(val => val !== null && val !== undefined && val !== '');
      const numericValues = values.filter(val => !isNaN(parseFloat(val)) && isFinite(val));
      
      stats[col] = {
        totalRows: data.length,
        nonEmptyRows: values.length,
        dataType: numericValues.length > values.length * 0.7 ? 'numeric' : 'text',
        uniqueValues: [...new Set(values)].length,
        sampleValues: values.slice(0, 5),
        min: numericValues.length > 0 ? Math.min(...numericValues.map(Number)) : null,
        max: numericValues.length > 0 ? Math.max(...numericValues.map(Number)) : null,
        avg: numericValues.length > 0 ? (numericValues.reduce((sum, val) => sum + Number(val), 0) / numericValues.length).toFixed(2) : null
      };
    });

    return stats;
  };

  // File handling functions (improved with real Excel parsing)
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Added: File size validation (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File too large (max 5MB)');
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);
    setErrorMessage('');

    try {
      let data = [];
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        data = await handleCSVFile(file);
      } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
        data = await handleExcelFile(file);
      } else if (file.name.toLowerCase().endsWith('.json')) {
        data = await handleJSONFile(file);
      } else {
        throw new Error('Unsupported file format. Please upload CSV, Excel, or JSON files.');
      }

      if (data && data.length > 0) {
        setOriginalData(data);
        setFileData(data);
        const columns = Object.keys(data[0]);
        setAvailableColumns(columns);
        setChartTitle(`Data from ${file.name}`);
        
        // Analyze data structure
        const stats = analyzeData(data);
        setDataStats(stats);
        
        // Auto-suggest chart configuration
        autoSuggestConfiguration(columns, stats);
        setShowDataPreview(true);
      } else {
        throw new Error('No data found in file');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setErrorMessage(`Error processing file: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.trim().split('\n');
          
          if (lines.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          // Parse headers
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          // Parse data rows
          const rows = lines.slice(1).map(line => {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/"/g, ''));
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim().replace(/"/g, ''));
            
            const row = {};
            headers.forEach((header, index) => {
              const value = values[index] || '';
              // Try to convert to number if it looks numeric
              if (value !== '' && !isNaN(value) && !isNaN(parseFloat(value))) {
                row[header] = parseFloat(value);
              } else {
                row[header] = value;
              }
            });
            return row;
          }).filter(row => Object.values(row).some(val => val !== '' && val !== null && val !== undefined));

          resolve(rows);
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  };

  const handleExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const parsedData = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: null });
          
          // Convert numeric strings to numbers where appropriate
          const processedData = parsedData.map(row => {
            Object.keys(row).forEach(key => {
              const value = row[key];
              if (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value))) {
                row[key] = parseFloat(value);
              }
            });
            return row;
          }).filter(row => Object.values(row).some(val => val !== null && val !== ''));

          if (processedData.length === 0) {
            reject(new Error('No data found in Excel sheet'));
          } else {
            resolve(processedData);
          }
        } catch (error) {
          reject(new Error(`Failed to parse Excel: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleJSONFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          let data = Array.isArray(jsonData) ? jsonData : [jsonData];
          
          // Flatten nested objects if necessary
          data = data.map(item => {
            const flattened = {};
            const flatten = (obj, prefix = '') => {
              for (const key in obj) {
                if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                  flatten(obj[key], prefix + key + '_');
                } else {
                  flattened[prefix + key] = obj[key];
                }
              }
            };
            flatten(item);
            return flattened;
          });
          
          resolve(data);
        } catch (error) {
          reject(new Error(`Invalid JSON format: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const autoSuggestConfiguration = (columns, stats) => {
    // Find text columns (good for X-axis)
    const textColumns = columns.filter(col => stats[col]?.dataType === 'text');
    // Find numeric columns (good for Y-axis)  
    const numericColumns = columns.filter(col => stats[col]?.dataType === 'numeric');

    // Auto-select X-axis (prefer text columns with reasonable unique values)
    if (textColumns.length > 0) {
      const bestXAxis = textColumns.find(col => 
        stats[col].uniqueValues > 1 && stats[col].uniqueValues < stats[col].totalRows * 0.8
      ) || textColumns[0];
      setSelectedXAxis(bestXAxis);
    } else if (columns.length > 0) {
      setSelectedXAxis(columns[0]);
    }

    // Auto-select Y-axis (prefer numeric columns)
    if (numericColumns.length > 0) {
      setSelectedYAxis(numericColumns.slice(0, 3)); // Max 3 series
    }

    // Suggest chart type based on data structure
    if (numericColumns.length === 1 && textColumns.length >= 1) {
      setChartType('pie');
    } else if (numericColumns.length >= 2) {
      setChartType('bar');
    } else {
      setChartType('line');
    }
  };

  const generateChartFromFile = () => {
    if (!fileData || fileData.length === 0) {
      setErrorMessage('No data available. Please upload a file first.');
      return;
    }

    if (!selectedXAxis || selectedYAxis.length === 0) {
      setErrorMessage('Please select X-axis and at least one Y-axis column');
      return;
    }

    setErrorMessage('');

    try {
      // Filter data to remove rows where X-axis value is empty
      const filteredData = fileData.filter(row => 
        row[selectedXAxis] !== null && 
        row[selectedXAxis] !== undefined && 
        row[selectedXAxis] !== ''
      );

      if (filteredData.length === 0) {
        setErrorMessage('No valid data found for the selected X-axis column');
        return;
      }

      const labels = filteredData.map(row => String(row[selectedXAxis]));
      
      const datasets = selectedYAxis.map((yCol, index) => {
        const data = filteredData.map(row => {
          const value = row[yCol];
          return (value !== null && value !== undefined && value !== '') 
            ? (isNaN(Number(value)) ? 0 : Number(value))
            : 0;
        });

        const color = colorPalettes[0][index % colorPalettes[0].length];
        
        return {
          label: yCol,
          data: data,
          backgroundColor: chartType === 'pie' || chartType === 'doughnut' 
            ? colorPalettes[0].map(c => c + '80')
            : color + '80',
          borderColor: chartType === 'pie' || chartType === 'doughnut' 
            ? colorPalettes[0]
            : color,
          borderWidth: 2,
          tension: 0.4,
          fill: chartType === 'line' ? false : true
        };
      });

      setChartData({ labels, datasets });
      
      // Update chart title
      const yAxisNames = selectedYAxis.join(', ');
      setChartTitle(`${yAxisNames} by ${selectedXAxis}`);
      
    } catch (error) {
      console.error('Error generating chart:', error);
      setErrorMessage('Error generating chart. Please check your data and try again.');
    }
  };

  const getChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#f1f5f9' : '#334155',
          font: { 
            family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            size: 12,
            weight: '500'
          },
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: chartTitle,
        color: darkMode ? '#f1f5f9' : '#1e293b',
        font: { 
          family: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          size: 18,
          weight: '600'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f1f5f9' : '#1e293b',
        bodyColor: darkMode ? '#cbd5e1' : '#475569',
        borderColor: darkMode ? '#475569' : '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: { weight: '600' },
        bodyFont: { weight: '500' }
      }
    },
    scales: ['pie', 'doughnut', 'polarArea', 'radar'].includes(chartType) ? {} : {
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(51, 65, 85, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: darkMode ? '#cbd5e1' : '#64748b',
          font: { size: 11, weight: '500' },
          padding: 8
        },
        title: {
          display: true,
          text: selectedYAxis.join(', ') || 'Values',
          color: darkMode ? '#94a3b8' : '#64748b',
          font: { size: 12, weight: '600' }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: darkMode ? '#cbd5e1' : '#64748b',
          font: { size: 11, weight: '500' },
          padding: 8,
          maxRotation: 45
        },
        title: {
          display: true,
          text: selectedXAxis || 'Categories',
          color: darkMode ? '#94a3b8' : '#64748b',
          font: { size: 12, weight: '600' }
        }
      }
    },
    elements: {
      bar: {
        borderRadius: is3D ? 0 : 4,
        borderSkipped: false,
        inflateAmount: is3D ? 2 : 0 // Added: Cosmetic inflate for 3D feel
      },
      line: {
        tension: 0.4
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2
      }
    },
    layout: {
      padding: 10
    }
  });

  const createChart = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      chartInstanceRef.current = new Chart.Chart(ctx, {
        type: chartType,
        data: chartData,
        options: getChartOptions()
      });
    }
  };

  useEffect(() => {
    createChart();
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartType, chartData, chartTitle, darkMode, is3D, selectedXAxis, selectedYAxis]);

  const downloadChart = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `${chartTitle.replace(/\s+/g, '_')}_chart.png`;
      link.href = chartRef.current.toDataURL('image/png');
      link.click();
    } else {
      setErrorMessage('Chart not rendered yet');
    }
  };

  const getColumnTypeIcon = (dataType) => {
    return dataType === 'numeric' ? '🔢' : '📝';
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        
        {/* Enhanced Control Panel */}
        <div className={`control-panel ${darkMode ? 'dark' : 'light'}`}>
          <div className="panel-header">
            <div className="flex items-center gap-3">
              <div className="panel-icon">
                <BarChart3 size={24} />
              </div>
              <h2 className="panel-title">Chart Studio</h2>
            </div>
            <button 
              className="theme-toggle"
              onClick={() => darkMode(!darkMode)} // Assuming setDarkMode is available in ThemeContext
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* File Upload Section */}
          <div className="section-container">
            <div className="section-header">
              <Upload size={18} />
              <h3 className="section-title">Data Source</h3>
            </div>
            
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div 
                className={`upload-dropzone ${uploadedFile ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedFile ? (
                  <div className="uploaded-file">
                    <FileText size={24} />
                    <span className="file-name">{uploadedFile.name}</span>
                    <span className="file-size">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </span>
                    <div className="file-stats">
                      {fileData.length > 0 && (
                        <>
                          <span>{fileData.length} rows</span>
                          <span>{availableColumns.length} columns</span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={32} />
                    <p>Click to upload or drag & drop</p>
                    <span>CSV, Excel, JSON files (max 5MB)</span>
                  </div>
                )}
              </div>
            </div>

            {isProcessing && (
              <div className="processing-indicator">
                <div className="spinner"></div>
                <span>Processing file...</span>
              </div>
            )}

            {fileData.length > 0 && (
              <button 
                className="action-btn secondary full-width"
                onClick={() => setShowDataPreview(!showDataPreview)}
              >
                <Eye size={16} />
                {showDataPreview ? 'Hide Data Preview' : 'Show Data Preview'}
              </button>
            )}
          </div>

          {/* Data Preview */}
          {showDataPreview && fileData.length > 0 && (
            <div className="section-container">
              <div className="section-header">
                <Table size={18} />
                <h3 className="section-title">Data Preview</h3>
              </div>
              
              <div className="data-preview">
                <div className="data-summary">
                  <p><strong>Total Rows:</strong> {fileData.length}</p>
                  <p><strong>Columns:</strong> {availableColumns.length}</p>
                </div>
                
                <div className="columns-info">
                  <h4>Column Information:</h4>
                  <div className="columns-list">
                    {availableColumns.map(col => (
                      <div key={col} className="column-info">
                        <span className="column-icon">
                          {getColumnTypeIcon(dataStats[col]?.dataType)}
                        </span>
                        <div className="column-details">
                          <strong>{col}</strong>
                          <small>
                            {dataStats[col]?.dataType} • {dataStats[col]?.uniqueValues} unique values
                            {dataStats[col]?.dataType === 'numeric' && dataStats[col]?.avg && (
                              <> • avg: {dataStats[col].avg}</>
                            )}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {availableColumns.slice(0, 5).map(col => (
                          <th key={col}>{col}</th>
                        ))}
                        {availableColumns.length > 5 && <th>...</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {fileData.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          {availableColumns.slice(0, 5).map(col => (
                            <td key={col}>
                              {String(row[col] || '').length > 20 
                                ? String(row[col] || '').substring(0, 20) + '...'
                                : String(row[col] || '')
                              }
                            </td>
                          ))}
                          {availableColumns.length > 5 && <td>...</td>}
                        </tr>
                      ))}
                      {fileData.length > 5 && (
                        <tr><td colSpan={Math.min(6, availableColumns.length + 1)}>
                          ... and {fileData.length - 5} more rows
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Chart Configuration */}
          {availableColumns.length > 0 && (
            <div className="section-container">
              <div className="section-header">
                <BarChart3 size={18} />
                <h3 className="section-title">Chart Configuration</h3>
              </div>

              <div className="input-group">
                <label className="input-label">Chart Title</label>
                <input
                  type="text"
                  className="text-input"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  placeholder="Enter chart title"
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  X-Axis (Categories) 
                  {selectedXAxis && dataStats[selectedXAxis] && (
                    <span className="column-type">
                      {getColumnTypeIcon(dataStats[selectedXAxis].dataType)}
                      {dataStats[selectedXAxis].dataType}
                    </span>
                  )}
                </label>
                <select
                  className="select-input"
                  value={selectedXAxis}
                  onChange={(e) => setSelectedXAxis(e.target.value)}
                >
                  <option value="">Select X-axis column</option>
                  {availableColumns.map(col => (
                    <option key={col} value={col}>
                      {col} ({dataStats[col]?.dataType}) - {dataStats[col]?.uniqueValues} unique
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Y-Axis (Values) - Select one or more</label>
                <div className="multi-select">
                  {availableColumns.map(col => (
                    <label key={col} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedYAxis.includes(col)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedYAxis([...selectedYAxis, col]);
                          } else {
                            setSelectedYAxis(selectedYAxis.filter(c => c !== col));
                          }
                        }}
                      />
                      <span className="column-name">
                        {getColumnTypeIcon(dataStats[col]?.dataType)}
                        {col}
                        <small>({dataStats[col]?.dataType})</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                className="action-btn primary full-width"
                onClick={generateChartFromFile}
                disabled={!selectedXAxis || selectedYAxis.length === 0}
              >
                <BarChart3 size={16} />
                Generate Chart from Data
              </button>
            </div>
          )}

          {/* Chart Types */}
          <div className="section-container">
            <div className="section-header">
              <TrendingUp size={18} />
              <h3 className="section-title">Chart Type</h3>
            </div>
            
            <div className="chart-types-grid">
              {chartTypes.map(({ type, icon: Icon, label, description }) => (
                <button
                  key={type}
                  className={`chart-type-btn ${chartType === type ? 'active' : ''}`}
                  onClick={() => setChartType(type)}
                  title={description}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="section-container">
            <div className="section-header">
              <Target size={18} />
              <h3 className="section-title">Options</h3>
            </div>
            
            <div className="toggle-group">
              <label className="toggle-option">
                <input
                  type="checkbox"
                  checked={is3D}
                  onChange={(e) => setIs3D(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span>3D Effect (cosmetic)</span> {/* Added note */}
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="section-container">
            <div className="action-buttons">
              <button 
                className="action-btn primary"
                onClick={saveChart}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Chart
                  </>
                )}
              </button>
              
              <button className="action-btn secondary" onClick={downloadChart}>
                Download PNG
              </button>
              
              {saveSuccess && (
                <div className="success-message">
                  Chart saved successfully!
                </div>
              )}
              {errorMessage && (
                <div className="error-message">
                  {errorMessage}
                </div>
              )} {/* Added for better UX */}
            </div>
          </div>
        </div>

        {/* Chart Display */}
        <div className="flex-1">
          <div className={`chart-container ${darkMode ? 'dark' : 'light'}`}>
            <div className="chart-header">
              <h3>{chartTitle}</h3>
              <button 
                className="fullscreen-btn"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? '⊡' : '⊞'}
              </button>
            </div>
            
            <div className={`chart-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
              {isFullscreen && (
                <button 
                  className="fullscreen-close"
                  onClick={() => setIsFullscreen(false)}
                >
                  ✕
                </button>
              )}
              <canvas ref={chartRef} className="chart-canvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartCreationPage;