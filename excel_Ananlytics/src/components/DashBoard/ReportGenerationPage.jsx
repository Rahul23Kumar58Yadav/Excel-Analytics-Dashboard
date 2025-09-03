import React, { useState, useContext, useRef } from 'react';
import { FiFileText, FiDownload, FiPrinter, FiShare2 } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ReportGenerationPage.css';

const ReportGenerationPage = () => {
  const context = useTheme(); // Use the hook directly
  const { darkMode = false } = context || {}; // Fallback to false if context is undefined
  const [reportTitle, setReportTitle] = useState('');
  const [sections, setSections] = useState([
    { id: 1, title: 'Executive Summary', content: '' },
    { id: 2, title: 'Key Findings', content: '' },
    { id: 3, title: 'Recommendations', content: '' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef(null);

  const addSection = () => {
    setSections([...sections, { id: sections.length + 1, title: `Section ${sections.length + 1}`, content: '' }]);
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(section => (section.id === id ? { ...section, [field]: value } : section)));
  };

  const handlePrint = () => {
    if (!previewRef.current) return;
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups for printing.');
      return;
    }
    printWindow.document.write(`
      <html><head><title>${reportTitle || 'Report'}</title><style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        h1 { font-size: 24px; margin-bottom: 20px; }
        h2 { font-size: 18px; margin-top: 20px; }
        p { font-size: 14px; line-height: 1.5; }
        @media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none !important; } }
      </style></head><body>
        <h1>${reportTitle || 'Untitled Report'}</h1>
        ${sections.map(section => `<div><h2>${section.title}</h2><p>${section.content || 'Content will appear here'}</p></div>`).join('')}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${reportTitle || 'report'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: reportTitle || 'Generated Report',
          text: 'Check out this report I generated',
          url: window.location.href,
        });
      } else {
        alert('Web Share API not supported in your browser');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const chartCanvas = document.querySelector('.chart-wrapper canvas');
      const chartImage = chartCanvas ? await html2canvas(chartCanvas).then(c => c.toDataURL('image/png')) : null;
      if (chartImage) {
        // Update preview with chart image
        const imgElement = `<img src="${chartImage}" style="max-width: 100%;" />`;
        const previewContent = previewRef.current.querySelector('.preview-content');
        if (previewContent) {
          previewContent.innerHTML = `<h1>${reportTitle || 'Untitled Report'}</h1>${sections
            .map(section => `<div><h2>${section.title}</h2><p>${section.content || 'Content will appear here'}</p></div>`)
            .join('')}${imgElement}`;
        }
      }
      setTimeout(() => {
        alert('Report generated successfully with chart!');
      }, 1500);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`report-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="report-header">
        <h1>Report Generator</h1>
        <div className="report-actions">
          <button className={`action-btn ${darkMode ? 'dark' : 'light'}`} onClick={handlePrint}>
            <FiPrinter /> Print
          </button>
          <button
            className={`action-btn ${darkMode ? 'dark' : 'light'}`}
            onClick={handleDownloadPDF}
            disabled={isGenerating}
          >
            <FiDownload /> Download PDF
          </button>
          <button className={`action-btn ${darkMode ? 'dark' : 'light'}`} onClick={handleShare}>
            <FiShare2 /> Share
          </button>
        </div>
      </div>
      <div className="report-form">
        <div className="form-group">
          <label>Report Title</label>
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Enter report title"
            className={darkMode ? 'dark' : 'light'}
          />
        </div>
        {sections.map(section => (
          <div key={section.id} className={`section-editor ${darkMode ? 'dark' : 'light'}`}>
            <input
              type="text"
              value={section.title}
              onChange={(e) => updateSection(section.id, 'title', e.target.value)}
              className={`section-title ${darkMode ? 'dark' : 'light'}`}
            />
            <textarea
              value={section.content}
              onChange={(e) => updateSection(section.id, 'content', e.target.value)}
              placeholder="Enter section content"
              className={darkMode ? 'dark' : 'light'}
            />
          </div>
        ))}
        <button className={`add-section-btn ${darkMode ? 'dark' : 'light'}`} onClick={addSection}>
          + Add Section
        </button>
      </div>
      <div className="report-preview">
        <h2>Preview</h2>
        <div ref={previewRef} className={`preview-content ${darkMode ? 'dark' : 'light'}`}>
          <h1>{reportTitle || 'Untitled Report'}</h1>
          {sections.map(section => (
            <div key={section.id} className="preview-section">
              <h2>{section.title}</h2>
              <p>{section.content || 'Content will appear here'}</p>
            </div>
          ))}
        </div>
      </div>
      <button
        className={`generate-report-btn ${darkMode ? 'dark' : 'light'}`}
        onClick={generateReport}
        disabled={isGenerating}
      >
        <FiFileText /> {isGenerating ? 'Generating...' : 'Generate Final Report'}
      </button>
    </div>
  );
};

export default ReportGenerationPage;