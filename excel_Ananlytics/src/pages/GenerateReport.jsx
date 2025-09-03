import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

// Register Chart.js components
ChartJS.register(...registerables);

// Animations
const slideIn = keyframes`
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(74, 107, 255, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(74, 107, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 107, 255, 0); }
`;

// Styled Components (unchanged, omitted for brevity)
const GenerateReportContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  font-weight: 700;
  margin: 0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #4a6bff;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(74, 107, 255, 0.1);
  }

  svg {
    margin-right: 8px;
  }
`;

const WizardContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: ${slideIn} 0.4s ease-out forwards;
`;

const WizardHeader = styled.div`
  display: flex;
  border-bottom: 1px solid #eaeef2;
  padding: 1.5rem 2rem;
`;

const WizardStep = styled.div`
  display: flex;
  align-items: center;
  margin-right: 2rem;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    right: -1.5rem;
    width: 10px;
    height: 10px;
    background-color: #dfe3e8;
    border-radius: 50%;
  }

  &:last-child {
    margin-right: 0;
    
    &:after {
      display: none;
    }
  }

  ${props => props.active && css`
    .step-number {
      background-color: #4a6bff;
      color: white;
    }
    .step-title {
      color: #4a6bff;
      font-weight: 600;
    }
    
    &:after {
      background-color: #4a6bff;
    }
  `}

  ${props => props.completed && css`
    .step-number {
      background-color: #6bcebb;
      color: white;
    }
    
    &:after {
      background-color: #6bcebb;
    }
  `}
`;

const StepNumber = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #dfe3e8;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 0.75rem;
  transition: all 0.3s ease;
`;

const StepTitle = styled.div`
  color: #7f8c8d;
  font-weight: 500;
  transition: all 0.3s ease;
`;

const WizardContent = styled.div`
  padding: 2rem;
`;

const DropzoneContainer = styled.div`
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => props.isDragActive ? 'rgba(74, 107, 255, 0.05)' : 'white'};
  border-color: ${props => props.isDragActive ? '#4a6bff' : '#cbd5e0'};
  margin-bottom: 2rem;

  &:hover {
    border-color: #4a6bff;
  }
`;

const DropzoneTitle = styled.h3`
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const DropzoneText = styled.p`
  color: #7f8c8d;
  margin-bottom: 1rem;
`;

const UploadButton = styled.button`
  background-color: #4a6bff;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(74, 107, 255, 0.2);
  animation: ${props => props.highlight ? css`${pulse} 2s infinite` : 'none'};

  &:hover {
    background-color: #3a56d9;
    transform: translateY(-2px);
  }

  svg {
    margin-right: 8px;
  }
`;

const PreviewContainer = styled.div`
  margin-top: 2rem;
  border: 1px solid #eaeef2;
  border-radius: 8px;
  overflow: hidden;
`;

const PreviewHeader = styled.div`
  background-color: #f8fafc;
  padding: 1rem;
  border-bottom: 1px solid #eaeef2;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PreviewTitle = styled.h4`
  margin: 0;
  color: #2c3e50;
`;

const PreviewContent = styled.div`
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
`;

const PreviewTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const PreviewTableHeader = styled.thead`
  background-color: #f8fafc;
`;

const PreviewTableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f8fafc;
  }
`;

const PreviewTableCell = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eaeef2;
  color: #4a5568;
`;

const PreviewTableHeaderCell = styled.th`
  padding: 0.75rem 1rem;
  text-align: left;
  color: #4a5568;
  font-weight: 500;
`;

const ChartOptionsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const ChartOptionCard = styled.div`
  border: 1px solid ${props => props.selected ? '#4a6bff' : '#eaeef2'};
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => props.selected ? 'rgba(74, 107, 255, 0.05)' : 'white'};
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #4a6bff;
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: ${props => props.selected ? '#4a6bff' : 'transparent'};
  }
`;

const ChartOptionTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
`;

const ChartOptionDescription = styled.p`
  margin: 0;
  color: #718096;
  font-size: 0.875rem;
`;

const AxisSelectContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 2rem;
`;

const SelectContainer = styled.div`
  position: relative;
`;

const SelectLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #eaeef2;
  border-radius: 6px;
  background-color: white;
  font-size: 1rem;
  color: #2c3e50;
  transition: all 0.3s ease;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4a6bff;
    box-shadow: 0 0 0 3px rgba(74, 107, 255, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  gap: 1rem;
`;

const PrimaryButton = styled.button`
  background-color: #4a6bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(74, 107, 255, 0.2);

  &:hover {
    background-color: #3a56d9;
    transform: translateY(-2px);
  }

  &:disabled {
    background-color: #eaeef2;
    color: #a0aec0;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    margin-right: 8px;
  }
`;

const SecondaryButton = styled.button`
  background-color: white;
  color: #4a6bff;
  border: 1px solid #eaeef2;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;

  &:hover {
    background-color: #f8fafc;
    border-color: #4a6bff;
  }

  svg {
    margin-right: 8px;
  }
`;

const ChartContainer = styled.div`
  margin-top: 2rem;
  text-align: center;
`;

// Icons
const ArrowLeftIcon = () => <span>←</span>;
const UploadCloudIcon = () => <span>☁️</span>;
const FileIcon = () => <span>📄</span>;
const ChartIcon = () => <span>📈</span>;
const SettingsIcon = () => <span>⚙️</span>;
const CheckIcon = () => <span>✓</span>;

const GenerateReport = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [chartType, setChartType] = useState('');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const fileInputRef = useRef(null); // Ensure this is defined at the top

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: acceptedFiles => {
      console.log('Files dropped:', acceptedFiles);
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      console.log('Drop rejected:', fileRejections);
      setError('Invalid file type or size limit exceeded. Please use .xls or .xlsx files.');
    }
  });

  const handleFileUpload = (file) => {
    setFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        if (jsonData.length === 0) {
          setError('No data found in the uploaded file.');
          setPreviewData([]);
        } else {
          setPreviewData(jsonData);
          setTimeout(() => setActiveStep(2), 500);
        }
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse the file. Please try a valid Excel file.');
        setPreviewData([]);
      }
    };
    reader.onerror = () => {
      setError('Error reading the file. Please try again.');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGenerateClick = () => {
    console.log('Generating chart:', { chartType, xAxis, yAxis });
    setActiveStep(4);
  };

  const chartOptions = [
    { id: 'bar', title: 'Bar Chart', description: 'Compare values across categories' },
    { id: 'line', title: 'Line Chart', description: 'Show trends over time' },
    { id: 'pie', title: 'Pie Chart', description: 'Show proportions of a whole' },
    { id: 'scatter', title: 'Scatter Plot', description: 'Show relationships between variables' }
  ];

  const availableColumns = previewData.length > 0 
    ? Object.keys(previewData[0]).filter(key => key !== 'id') 
    : [];

  const chartData = {
    labels: previewData.map(row => row[xAxis] || ''),
    datasets: [{
      label: yAxis,
      data: previewData.map(row => row[yAxis] || 0),
      backgroundColor: 'rgba(74, 107, 255, 0.6)',
      borderColor: 'rgba(74, 107, 255, 1)',
      borderWidth: 1
    }]
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <Bar ref={chartRef} data={chartData} />;
      case 'line':
        return <Line ref={chartRef} data={chartData} />;
      case 'pie':
        return <Pie ref={chartRef} data={{ ...chartData, labels: chartData.labels.slice(0, chartData.data.length) }} />;
      case 'scatter':
        return <Scatter ref={chartRef} data={chartData} />;
      default:
        return null;
    }
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `chart_${new Date().toISOString()}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  const handleEdit = () => {
    setActiveStep(3);
  };

  return (
    <GenerateReportContainer>
      <MainContent>
        <Header>
          <BackButton onClick={() => window.history.back()}>
            <ArrowLeftIcon /> Back to Reports
          </BackButton>
          <Title>Generate New Report</Title>
          <div></div>
        </Header>

        <WizardContainer>
          <WizardHeader>
            <WizardStep 
              active={activeStep === 1} 
              completed={activeStep > 1}
              onClick={() => setActiveStep(1)}
            >
              <StepNumber className="step-number">
                {activeStep > 1 ? <CheckIcon /> : '1'}
              </StepNumber>
              <StepTitle className="step-title">Upload Data</StepTitle>
            </WizardStep>
            
            <WizardStep 
              active={activeStep === 2} 
              completed={activeStep > 2}
              onClick={() => file && setActiveStep(2)}
            >
              <StepNumber className="step-number">
                {activeStep > 2 ? <CheckIcon /> : '2'}
              </StepNumber>
              <StepTitle className="step-title">Select Chart</StepTitle>
            </WizardStep>
            
            <WizardStep 
              active={activeStep === 3} 
              completed={activeStep > 4}
              onClick={() => chartType && setActiveStep(3)}
            >
              <StepNumber className="step-number">
                {activeStep > 3 ? <CheckIcon /> : '3'}
              </StepNumber>
              <StepTitle className="step-title">Configure</StepTitle>
            </WizardStep>
            
            <WizardStep 
              active={activeStep === 4} 
              onClick={() => xAxis && yAxis && setActiveStep(4)}
            >
              <StepNumber className="step-number">4</StepNumber>
              <StepTitle className="step-title">Generate</StepTitle>
            </WizardStep>
          </WizardHeader>

          <WizardContent>
            {activeStep === 1 && (
              <>
                <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
                  <input {...getInputProps()} ref={fileInputRef} />
                  <UploadCloudIcon style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                  <DropzoneTitle>Drag & Drop your Excel file here</DropzoneTitle>
                  <DropzoneText>or</DropzoneText>
                  <UploadButton 
                    highlight={!file} 
                    onClick={() => {
                      console.log('Triggering file input:', fileInputRef.current);
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      } else {
                        console.error('fileInputRef is not attached');
                      }
                    }}
                  >
                    <FileIcon /> Browse Files
                  </UploadButton>
                  <DropzoneText>Supports .xls and .xlsx files</DropzoneText>
                </DropzoneContainer>
                
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                {file && (
                  <PreviewContainer>
                    <PreviewHeader>
                      <PreviewTitle>Preview: {file.name}</PreviewTitle>
                      <div>
                        <SecondaryButton onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}>
                          <FileIcon /> Change File
                        </SecondaryButton>
                      </div>
                    </PreviewHeader>
                    <PreviewContent>
                      <PreviewTable>
                        <PreviewTableHeader>
                          <PreviewTableRow>
                            {previewData.length > 0 && 
                              Object.keys(previewData[0]).map(key => (
                                <PreviewTableHeaderCell key={key}>{key}</PreviewTableHeaderCell>
                              ))}
                          </PreviewTableRow>
                        </PreviewTableHeader>
                        <tbody>
                          {previewData.slice(0, 5).map((row, i) => (
                            <PreviewTableRow key={i}>
                              {Object.values(row).map((value, j) => (
                                <PreviewTableCell key={j}>{value}</PreviewTableCell>
                              ))}
                            </PreviewTableRow>
                          ))}
                          {previewData.length > 5 && (
                            <PreviewTableRow>
                              <PreviewTableCell colSpan={Object.keys(previewData[0]).length} style={{ textAlign: 'center' }}>
                                ... and {previewData.length - 5} more rows
                              </PreviewTableCell>
                            </PreviewTableRow>
                          )}
                        </tbody>
                      </PreviewTable>
                    </PreviewContent>
                  </PreviewContainer>
                )}
                
                <ButtonGroup>
                  <PrimaryButton 
                    onClick={() => setActiveStep(2)} 
                    disabled={!file || !!error}
                  >
                    Next: Select Chart
                  </PrimaryButton>
                </ButtonGroup>
              </>
            )}

            {activeStep === 2 && (
              <>
                <h3 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>Choose a chart type</h3>
                <ChartOptionsContainer>
                  {chartOptions.map(option => (
                    <ChartOptionCard
                      key={option.id}
                      selected={chartType === option.id}
                      onClick={() => setChartType(option.id)}
                    >
                      <ChartOptionTitle>{option.title}</ChartOptionTitle>
                      <ChartOptionDescription>{option.description}</ChartOptionDescription>
                    </ChartOptionCard>
                  ))}
                </ChartOptionsContainer>
                
                <ButtonGroup>
                  <SecondaryButton onClick={() => setActiveStep(1)}>
                    Back
                  </SecondaryButton>
                  <PrimaryButton 
                    onClick={() => setActiveStep(3)} 
                    disabled={!chartType}
                  >
                    Next: Configure Chart
                  </PrimaryButton>
                </ButtonGroup>
              </>
            )}

            {activeStep === 3 && (
              <>
                <h3 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>Configure your chart</h3>
                
                <AxisSelectContainer>
                  <SelectContainer>
                    <SelectLabel>X-Axis</SelectLabel>
                    <Select 
                      value={xAxis} 
                      onChange={(e) => setXAxis(e.target.value)}
                    >
                      <option value="">Select X-Axis</option>
                      {availableColumns.map(col => (
                        <option key={`x-${col}`} value={col}>{col}</option>
                      ))}
                    </Select>
                  </SelectContainer>
                  
                  <SelectContainer>
                    <SelectLabel>Y-Axis</SelectLabel>
                    <Select 
                      value={yAxis} 
                      onChange={(e) => setYAxis(e.target.value)}
                    >
                      <option value="">Select Y-Axis</option>
                      {availableColumns.map(col => (
                        <option key={`y-${col}`} value={col}>{col}</option>
                      ))}
                    </Select>
                  </SelectContainer>
                </AxisSelectContainer>
                
                <ButtonGroup>
                  <SecondaryButton onClick={() => setActiveStep(2)}>
                    Back
                  </SecondaryButton>
                  <PrimaryButton 
                    onClick={handleGenerateClick}
                    disabled={!xAxis || !yAxis}
                  >
                    Generate Chart
                  </PrimaryButton>
                </ButtonGroup>
              </>
            )}

            {activeStep === 4 && (
              <>
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <ChartContainer>
                    {renderChart()}
                  </ChartContainer>
                  <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Chart Generated Successfully!</h2>
                  <p style={{ color: '#718096', marginBottom: '2rem' }}>
                    Your {chartType} chart showing {yAxis} by {xAxis} is ready.
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <SecondaryButton onClick={handleEdit}>
                      <SettingsIcon /> Edit Chart
                    </SecondaryButton>
                    <PrimaryButton onClick={handleDownload}>
                      <FileIcon /> Download Chart
                    </PrimaryButton>
                  </div>
                </div>
              </>
            )}
          </WizardContent>
        </WizardContainer>
      </MainContent>
    </GenerateReportContainer>
  );
};

export default GenerateReport;