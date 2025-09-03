import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';
import html2canvas from 'html2canvas';
import './ChartContainer.css';

const ChartContainer = ({
  title,
  chart,
  description = 'This chart visualizes the data.',
  className = '',
  style = {},
  showLegend = true
}) => {
  const themeContext = useTheme();
  const darkMode = themeContext?.darkMode || false;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  // Clear error after a few seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDownload = async () => {
    if (!chartRef.current) {
      setError('Chart not ready for download');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Wait a bit for chart to fully render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}_chart.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download chart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`chart-container ${className} ${darkMode ? 'dark-mode' : 'light-mode'}`} 
      style={style}
    >
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <button
          className="download-btn"
          onClick={handleDownload}
          disabled={isLoading}
          aria-label={`Download ${title} chart as PNG`}
        >
          {isLoading ? 'Downloading...' : 'Download PNG'}
        </button>
      </div>
      
      {error && (
        <div className="chart-error" role="alert">
          <span>⚠️ {error}</span>
          <button 
            onClick={() => setError(null)}
            className="error-close"
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      )}
      
      {isLoading && (
        <div className="chart-loading" role="status" aria-live="polite">
          <div className="loading-spinner"></div>
          <span>Preparing download...</span>
        </div>
      )}
      
      {description && (
        <p className="chart-description">{description}</p>
      )}
      
      <div className="chart-wrapper" ref={chartRef}>
        {chart}
      </div>
      
      {showLegend && (
        <div className="chart-legend">
          <h4>Legend</h4>
          <ul>
            <li>
              <span 
                className="legend-color" 
                style={{ backgroundColor: 'rgba(54, 162, 235, 0.5)' }}
              ></span>
              Data Values
            </li>
            <li>
              <span 
                className="legend-color" 
                style={{ backgroundColor: 'rgba(54, 162, 235, 1)' }}
              ></span>
              Border
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

ChartContainer.propTypes = {
  title: PropTypes.string.isRequired,
  chart: PropTypes.node.isRequired,
  description: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  showLegend: PropTypes.bool,
};

export default ChartContainer;