import React, { useState, useContext } from 'react';
import { FiUpload, FiBarChart2, FiPieChart, FiGrid, FiDownload } from 'react-icons/fi';
import { MdScatterPlot } from 'react-icons/md';
import { useTheme } from '../context/ThemeContext';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import ThreeDChart from './ThreeDChart';
import ChartCreationPage from './ChartCreationPage';
import axios from 'axios';
import './AnalysisPage.css';

const AnalysisPage = () => {
  const { darkMode } = useTheme()
  const { token } = useAuth();
  const [fileData, setFileData] = useState(null);
  const [selectedChart, setSelectedChart] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [zAxis, setZAxis] = useState('');

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    onDrop: async acceptedFiles => {
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);
      try {
        const response = await axios.post('http://localhost:5000/api/v1/files/upload', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('File uploaded:', response.data);
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          setFileData({
            headers: jsonData[0],
            rows: jsonData.slice(1).filter(row => row.length > 0),
          });
        };
        reader.readAsArrayBuffer(acceptedFiles[0]);
      } catch (err) {
        console.error('Error uploading file:', err);
        alert('Failed to upload file: ' + (err.response?.data?.message || err.message));
      }
    },
  });

  const generateChart = () => {
    if (!xAxis || !yAxis || (selectedChart === '3d' && !zAxis)) {
      alert('Please select all required axes');
      return;
    }
    // The chart update is handled by useEffect in ChartCreationPage when xAxis or yAxis changes
    console.log('Chart generation triggered with:', { xAxis, yAxis, zAxis, selectedChart });
  };

  const handleDownload = () => {
    const chartCanvas = document.querySelector('.chart-wrapper canvas');
    if (!chartCanvas) {
      alert('Chart not found');
      return;
    }
    const link = document.createElement('a');
    link.download = `chart_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = chartCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`analysis-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="upload-section">
        <div {...getRootProps()} className={`dropzone ${darkMode ? 'dark' : 'light'}`}>
          <input {...getInputProps()} />
          <FiUpload className="upload-icon" />
          <p>Drag & drop Excel file here, or click to select</p>
          <span className="file-types">Supports .xlsx, .xls, and .csv</span>
        </div>
      </div>
      {fileData && (
        <div className="analysis-content">
          <div className="controls-section">
            <div className="axis-selectors">
              <div className="selector">
                <label>X-Axis</label>
                <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} className={darkMode ? 'dark' : 'light'}>
                  <option value="">Select X-Axis</option>
                  {fileData.headers.map((header, index) => <option key={`x-${index}`} value={header}>{header}</option>)}
                </select>
              </div>
              <div className="selector">
                <label>Y-Axis</label>
                <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} className={darkMode ? 'dark' : 'light'}>
                  <option value="">Select Y-Axis</option>
                  {fileData.headers.map((header, index) => <option key={`y-${index}`} value={header}>{header}</option>)}
                </select>
              </div>
              {selectedChart === '3d' && (
                <div className="selector">
                  <label>Z-Axis</label>
                  <select value={zAxis} onChange={(e) => setZAxis(e.target.value)} className={darkMode ? 'dark' : 'light'}>
                    <option value="">Select Z-Axis</option>
                    {fileData.headers.map((header, index) => <option key={`z-${index}`} value={header}>{header}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="chart-types">
              <button className={`chart-btn ${selectedChart === 'bar' ? 'active' : ''} ${darkMode ? 'dark' : 'light'}`} onClick={() => setSelectedChart('bar')}>
                <FiBarChart2 /> Bar
              </button>
              <button className={`chart-btn ${selectedChart === 'pie' ? 'active' : ''} ${darkMode ? 'dark' : 'light'}`} onClick={() => setSelectedChart('pie')}>
                <FiPieChart /> Pie
              </button>
              <button className={`chart-btn ${selectedChart === 'scatter' ? 'active' : ''} ${darkMode ? 'dark' : 'light'}`} onClick={() => setSelectedChart('scatter')}>
                <MdScatterPlot /> Scatter
              </button>
              <button className={`chart-btn ${selectedChart === '3d' ? 'active' : ''} ${darkMode ? 'dark' : 'light'}`} onClick={() => setSelectedChart('3d')}>
                <FiGrid /> 3D
              </button>
            </div>
            <button className={`generate-btn ${darkMode ? 'dark' : 'light'}`} onClick={generateChart}>
              Generate Chart
            </button>
          </div>
          <div className="chart-display">
            {selectedChart === '3d' ? (
              <ThreeDChart data={fileData} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} darkMode={darkMode} />
            ) : (
              <ChartCreationPage fileData={fileData} xAxis={xAxis} yAxis={yAxis} />
            )}
            <button className={`download-btn ${darkMode ? 'dark' : 'light'}`} onClick={handleDownload}>
              <FiDownload /> Download as PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;