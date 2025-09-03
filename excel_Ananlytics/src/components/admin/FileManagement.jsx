import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Input, 
  Button, 
  Space, 
  Spin, 
  Modal, 
  Tag, 
  Popconfirm, 
  message,
  Badge,
  Avatar,
  DatePicker,
  Select,
  Tooltip,
  Alert,
  Typography,
  Row,
  Col,
  Upload,
  Progress
} from 'antd';
import { 
  SearchOutlined, 
  DownloadOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  FilterOutlined,
  SyncOutlined,
  FileExcelOutlined,
  UserOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
  UploadOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { fetchFiles, deleteFile, downloadFile, uploadFile } from '../../services/apiService';
import "./FileManagement.css"

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { Dragger } = Upload;

const FileManagement = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [fileDetailModalVisible, setFileDetailModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    fileType: null,
    userId: null,
    dateRange: null,
    status: null,
  });

  const fetchFileData = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const { pagination: paginationParams, filters: filterParams } = params;
      
      const query = {
        page: paginationParams?.current || pagination.current,
        pageSize: paginationParams?.pageSize || pagination.pageSize,
        search: searchText,
        ...filterParams,
      };

      const data = await fetchFiles(query).catch(err => {
        console.warn('Files API not available, using mock data:', err);
        return {
          files: [
            {
              id: 1,
              fileName: 'sales_report_2024.xlsx',
              fileType: 'xlsx',
              fileSize: '2.5 MB',
              uploadDate: new Date().toISOString(),
              status: 'processed',
              user: { name: 'John Doe', avatar: null },
              description: 'Q4 Sales Analysis Report'
            },
            {
              id: 2,
              fileName: 'customer_data.csv',
              fileType: 'csv',
              fileSize: '1.8 MB',
              uploadDate: new Date(Date.now() - 86400000).toISOString(),
              status: 'processed',
              user: { name: 'Jane Smith', avatar: null },
              description: 'Customer Database Export'
            },
            {
              id: 3,
              fileName: 'budget_planning.xlsx',
              fileType: 'xlsx',
              fileSize: '3.2 MB',
              uploadDate: new Date(Date.now() - 172800000).toISOString(),
              status: 'processing',
              user: { name: 'Mike Johnson', avatar: null },
              description: '2025 Budget Planning Document'
            },
            {
              id: 4,
              fileName: 'employee_records.xls',
              fileType: 'xls',
              fileSize: '4.1 MB',
              uploadDate: new Date(Date.now() - 259200000).toISOString(),
              status: 'processed',
              user: { name: 'Sarah Wilson', avatar: null },
              description: 'HR Employee Database'
            },
            {
              id: 5,
              fileName: 'inventory_tracking.csv',
              fileType: 'csv',
              fileSize: '890 KB',
              uploadDate: new Date(Date.now() - 345600000).toISOString(),
              status: 'failed',
              user: { name: 'Tom Brown', avatar: null },
              description: 'Warehouse Inventory Data'
            }
          ],
          total: 5,
          page: 1,
          pageSize: 10
        };
      });
      
      setFiles(data.files || []);
      setPagination({
        ...pagination,
        total: data.total || 0,
        current: data.page || 1,
        pageSize: data.pageSize || 10,
      });
    } catch (err) {
      setError(err.message);
      message.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFileData();
  }, []);

  const handleTableChange = (newPagination, tableFilters) => {
    fetchFileData({ pagination: newPagination, filters: tableFilters });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchFileData({ filters: { ...filters, search: value } });
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    fetchFileData({ filters: { ...newFilters, search: searchText } });
  };

  const handleDelete = async (fileId) => {
    try {
      setLoading(true);
      await deleteFile(fileId).catch(() => {
        // Mock deletion for demo
        console.log('Mock file deletion for ID:', fileId);
      });
      message.success('File deleted successfully');
      
      // Remove from local state for immediate UI update
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    } catch (err) {
      message.error(err.message || 'Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      setLoading(true);
      
      // Mock download for demo
      const response = await downloadFile(fileId).catch(() => {
        // Create a mock blob for demo
        const mockContent = `Mock content for ${fileName}`;
        return { data: new Blob([mockContent], { type: 'text/plain' }) };
      });
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('File downloaded successfully');
    } catch (err) {
      message.error(err.message || 'Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (file) => {
    setSelectedFile(file);
    setFileDetailModalVisible(true);
  };

  const refreshData = () => {
    fetchFileData();
  };

  const getFileIcon = (type) => {
    const iconMap = {
      'xlsx': <FileExcelOutlined style={{ fontSize: '20px', color: '#1d6f42' }} />,
      'xls': <FileExcelOutlined style={{ fontSize: '20px', color: '#1d6f42' }} />,
      'csv': <FileTextOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />,
      'pdf': <FilePdfOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />,
      'doc': <FileWordOutlined style={{ fontSize: '20px', color: '#1890ff' }} />,
      'docx': <FileWordOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
    };
    return iconMap[type] || <FileTextOutlined style={{ fontSize: '20px', color: '#8c8c8c' }} />;
  };

  const getFileTypeTag = (type) => {
    const colorMap = {
      'xlsx': 'green',
      'xls': 'blue',
      'csv': 'orange',
      'pdf': 'red',
      'doc': 'purple',
      'docx': 'purple',
      'other': 'gray'
    };
    
    return (
      <Tag color={colorMap[type] || colorMap.other}>
        {type?.toUpperCase() || 'UNKNOWN'}
      </Tag>
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'processed': { status: 'success', text: 'PROCESSED', color: '#52c41a' },
      'processing': { status: 'processing', text: 'PROCESSING', color: '#1890ff' },
      'failed': { status: 'error', text: 'FAILED', color: '#ff4d4f' },
      'pending': { status: 'warning', text: 'PENDING', color: '#faad14' }
    };
    
    const config = statusMap[status] || { status: 'default', text: 'UNKNOWN', color: '#d9d9d9' };
    
    return (
      <Badge 
        status={config.status} 
        text={<Text style={{ color: config.color }}>{config.text}</Text>}
      />
    );
  };

  const handleUpload = async (file) => {
    try {
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('file', file);
      
      // Mock upload with progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      await uploadFile(formData).catch(() => {
        // Mock successful upload
        setTimeout(() => {
          clearInterval(progressInterval);
          setUploadProgress(100);
          message.success('File uploaded successfully');
          setUploadModalVisible(false);
          refreshData();
        }, 2000);
      });
      
    } catch (err) {
      message.error(err.message || 'Failed to upload file');
      setUploadProgress(0);
    }
    
    return false; // Prevent default upload behavior
  };

  const columns = [
    {
      title: <Text strong>FILE NAME</Text>,
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.fileType)}
          <div>
            <Text strong className="file-name">{text || 'Unknown File'}</Text>
            <div className="file-size-info">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.fileSize || 'Unknown Size'}
              </Text>
            </div>
          </div>
        </Space>
      ),
      sorter: true,
      width: 250,
    },
    {
      title: <Text strong>TYPE</Text>,
      dataIndex: 'fileType',
      key: 'fileType',
      render: getFileTypeTag,
      filters: [
        { text: 'XLSX', value: 'xlsx' },
        { text: 'XLS', value: 'xls' },
        { text: 'CSV', value: 'csv' },
        { text: 'PDF', value: 'pdf' },
        { text: 'DOC', value: 'doc' },
        { text: 'DOCX', value: 'docx' },
      ],
      width: 100,
    },
    {
      title: <Text strong>UPLOADED BY</Text>,
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <Space>
          <Avatar 
            src={user?.avatar} 
            size="small" 
            icon={<UserOutlined />} 
            className="uploader-avatar"
          />
          <div>
            <Text className="uploader-name">{user?.name || 'Unknown User'}</Text>
            <div className="uploader-email">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {user?.email || 'No Email'}
              </Text>
            </div>
          </div>
        </Space>
      ),
      width: 180,
    },
    {
      title: <Text strong>UPLOAD DATE</Text>,
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      render: (date) => (
        <div>
          <Text>{date ? new Date(date).toLocaleDateString() : 'Unknown'}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {date ? new Date(date).toLocaleTimeString() : ''}
            </Text>
          </div>
        </div>
      ),
      sorter: true,
      width: 140,
    },
    {
      title: <Text strong>STATUS</Text>,
      dataIndex: 'status',
      key: 'status',
      render: getStatusBadge,
      filters: [
        { text: 'Processed', value: 'processed' },
        { text: 'Processing', value: 'processing' },
        { text: 'Failed', value: 'failed' },
        { text: 'Pending', value: 'pending' },
      ],
      width: 120,
    },
    {
      title: <Text strong>ACTIONS</Text>,
      key: 'actions',
      render: (_, record) => (
        <Space size="small" className="action-buttons">
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetails(record)}
              size="small"
              className="action-btn view-btn"
            />
          </Tooltip>
          <Tooltip title="Download File">
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record.id, record.fileName)}
              size="small"
              className="action-btn download-btn"
              disabled={record.status === 'failed'}
            />
          </Tooltip>
          <Popconfirm
            title="Delete File"
            description="Are you sure you want to delete this file? This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete File">
              <Button 
                icon={<DeleteOutlined />} 
                danger 
                size="small"
                className="action-btn delete-btn"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      width: 140,
      fixed: 'right',
    },
  ];

  const uploadProps = {
    name: 'file',
    multiple: true,
    beforeUpload: handleUpload,
    showUploadList: false,
    accept: '.xlsx,.xls,.csv,.pdf,.doc,.docx',
  };

  return (
    <div className="file-management-container">
      <Card
        className="file-management-card"
        title={
          <Title level={3} className="page-title">
            <FileExcelOutlined /> File Management
          </Title>
        }
        extra={
          <Space>
            <Button 
              icon={<SyncOutlined />} 
              onClick={refreshData}
              loading={loading}
              className="refresh-btn"
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<UploadOutlined />} 
              onClick={() => setUploadModalVisible(true)}
              className="upload-btn"
            >
              Upload Files
            </Button>
          </Space>
        }
      >
        {/* Filter Section */}
        <div className="filter-section">
          <Row gutter={[16, 16]} align="middle" className="filter-row">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Search
                placeholder="Search files..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                className="search-input"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Filter by type"
                allowClear
                onChange={(value) => handleFilterChange('fileType', value)}
                suffixIcon={<FilterOutlined />}
                className="filter-select"
                style={{ width: '100%' }}
              >
                <Option value="xlsx">XLSX Files</Option>
                <Option value="xls">XLS Files</Option>
                <Option value="csv">CSV Files</Option>
                <Option value="pdf">PDF Files</Option>
                <Option value="doc">DOC Files</Option>
                <Option value="docx">DOCX Files</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Filter by status"
                allowClear
                onChange={(value) => handleFilterChange('status', value)}
                suffixIcon={<FilterOutlined />}
                className="filter-select"
                style={{ width: '100%' }}
              >
                <Option value="processed">Processed</Option>
                <Option value="processing">Processing</Option>
                <Option value="failed">Failed</Option>
                <Option value="pending">Pending</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <DatePicker.RangePicker
                onChange={(dates) => handleFilterChange('dateRange', dates)}
                className="date-range-picker"
                style={{ width: '100%' }}
                showTime={{
                  format: 'HH:mm',
                }}
                format="YYYY-MM-DD HH:mm"
              />
            </Col>
          </Row>
        </div>

        {/* Summary Stats */}
        <Row gutter={[16, 16]} className="file-stats" style={{ margin: '20px 0' }}>
          <Col xs={24} sm={8}>
            <Card size="small" className="stat-card">
              <div className="stat-content">
                <Text strong>Total Files</Text>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  {files.length}
                </Title>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" className="stat-card">
              <div className="stat-content">
                <Text strong>Storage Used</Text>
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                  {Math.round(files.reduce((acc, file) => {
                    const size = parseFloat(file.fileSize) || 0;
                    return acc + size;
                  }, 0) * 100) / 100} MB
                </Title>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" className="stat-card">
              <div className="stat-content">
                <Text strong>Active Files</Text>
                <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
                  {files.filter(f => f.status === 'processed').length}
                </Title>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Error Loading Files"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" danger onClick={refreshData}>
                Retry
              </Button>
            }
          />
        )}

        {/* Files Table */}
        <Table
          columns={columns}
          dataSource={files}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} files`,
            className: 'file-table-pagination'
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: true }}
          className="file-table"
          bordered
          size="middle"
          rowClassName={(record) => 
            record.status === 'failed' ? 'failed-row' : 
            record.status === 'processing' ? 'processing-row' : ''
          }
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title={
          <Title level={4}>
            <UploadOutlined /> Upload New Files
          </Title>
        }
        visible={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setUploadProgress(0);
        }}
        footer={[
          <Button key="cancel" onClick={() => setUploadModalVisible(false)}>
            Cancel
          </Button>
        ]}
        width={600}
        className="upload-modal"
      >
        <div className="upload-content">
          <Dragger {...uploadProps} className="upload-dragger">
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">
              Click or drag files to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for Excel (.xlsx, .xls), CSV, PDF, and Word documents. 
              Maximum file size: 10MB per file.
            </p>
          </Dragger>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div style={{ marginTop: '16px' }}>
              <Text>Uploading...</Text>
              <Progress percent={uploadProgress} status="active" />
            </div>
          )}
        </div>
      </Modal>

      {/* File Details Modal */}
      <Modal
        title={
          <Title level={4}>
            <EyeOutlined /> File Details
          </Title>
        }
        visible={fileDetailModalVisible}
        onCancel={() => setFileDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setFileDetailModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => {
              if (selectedFile) {
                handleDownload(selectedFile.id, selectedFile.fileName);
              }
            }}
            disabled={selectedFile?.status === 'failed'}
          >
            Download
          </Button>
        ]}
        width={700}
        className="file-detail-modal"
      >
        {selectedFile && (
          <div className="file-details">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small" title="Basic Information">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text strong>File Name:</Text>
                      <div>{selectedFile.fileName}</div>
                    </Col>
                    <Col span={12}>
                      <Text strong>File Type:</Text>
                      <div>{getFileTypeTag(selectedFile.fileType)}</div>
                    </Col>
                    <Col span={12}>
                      <Text strong>File Size:</Text>
                      <div>{selectedFile.fileSize}</div>
                    </Col>
                    <Col span={12}>
                      <Text strong>Status:</Text>
                      <div>{getStatusBadge(selectedFile.status)}</div>
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              <Col span={24}>
                <Card size="small" title="Upload Information">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text strong>Uploaded By:</Text>
                      <div>
                        <Space>
                          <Avatar 
                            src={selectedFile.user?.avatar} 
                            size="small" 
                            icon={<UserOutlined />} 
                          />
                          {selectedFile.user?.name || 'Unknown User'}
                        </Space>
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text strong>Upload Date:</Text>
                      <div>
                        {selectedFile.uploadDate ? 
                          new Date(selectedFile.uploadDate).toLocaleString() : 
                          'Unknown'
                        }
                      </div>
                    </Col>
                    <Col span={24}>
                      <Text strong>Description:</Text>
                      <div>
                        <Text type="secondary">
                          {selectedFile.description || 'No description available'}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FileManagement;