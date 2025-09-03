import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Input, Button, Space, Spin, Modal, Form,
  Select, Tag, Popconfirm, message, Badge, Avatar, DatePicker,
  Typography, Divider, Row, Col, Alert, Tooltip, Switch
} from 'antd';
import {
  SearchOutlined, UserAddOutlined, EditOutlined,
  DeleteOutlined, SyncOutlined, FilterFilled,
  UserOutlined, MailOutlined, LockOutlined, ReloadOutlined,
  SunOutlined, MoonOutlined, BulbOutlined, PlusOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useTheme } from '../context/ThemeContext';
import { fetchUsers, createUser, updateUser, deleteUser, getUserById, bulkUpdateUsers, exportUsers, getAuthToken } from '../../services/apiService';
import './UserManagement.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="Error in User Management"
          description={this.state.error?.message || 'An unexpected error occurred'}
          type="error"
          showIcon
          action={<Button onClick={() => window.location.reload()}>Reload</Button>}
        />
      );
    }
    return this.props.children;
  }
}

const UserManagement = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add New User');
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    status: null,
    role: null,
    dateRange: null,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const fetchUserData = useCallback(async (params = {}) => {
    try {
      setTableLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const queryParams = {
        page: params.pagination?.current || pagination.current,
        limit: params.pagination?.pageSize || pagination.pageSize,
        search: searchText,
        ...filters,
        ...params.filters,
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        queryParams.start_date = filters.dateRange[0].format('YYYY-MM-DD');
        queryParams.end_date = filters.dateRange[1].format('YYYY-MM-DD');
        delete queryParams.dateRange;
      }

      const response = await fetchUsers(queryParams);
      const userData = response.data || response;
      const usersArray = userData.users || userData.data || userData;
      const total = userData.totalCount || userData.total || usersArray.length;

      if (!Array.isArray(usersArray)) {
        throw new Error('Invalid response format: users array not found');
      }

      setUsers(usersArray);
      setPagination((prev) => ({
        ...prev,
        total,
        current: userData.currentPage || params.pagination?.current || prev.current,
        pageSize: userData.itemsPerPage || params.pagination?.pageSize || prev.pageSize,
      }));
    } catch (err) {
      console.error('Fetch users error:', {
        message: err.message,
        status: err.response?.status || 'Unknown',
        stack: err.stack,
      });
      setError(err.message || 'Failed to fetch users');
      message.error(`Failed to fetch users: ${err.message}`);

      if (err.response?.status === 401 || err.message.includes('Access denied') || err.message.includes('token')) {
        message.error('Session expired. Please login again.');
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  }, [searchText, filters]);

  useEffect(() => {
    fetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
  }, [fetchUserData]);

  const handleTableChange = (newPagination, tableFilters, sorter) => {
    const processedFilters = {};
    Object.entries(tableFilters).forEach(([key, value]) => {
      if (value && value.length > 0) {
        processedFilters[key] = value[0];
      }
    });

    if (sorter && sorter.order) {
      processedFilters.sortBy = sorter.field;
      processedFilters.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    setFilters((prev) => ({ ...prev, ...processedFilters }));
    setPagination(newPagination);
    fetchUserData({
      pagination: newPagination,
      filters: processedFilters,
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
  };

  const showAddModal = () => {
    setModalTitle('Add New User');
    setCurrentUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = async (user) => {
    try {
      setLoading(true);
      const freshUserData = await getUserById(user.id || user._id);
      const userData = freshUserData.data || freshUserData;

      setModalTitle('Edit User');
      setCurrentUser(userData);
      form.setFieldsValue({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status,
      });
      setIsModalVisible(true);
    } catch (err) {
      console.error('Show edit modal error:', err);
      message.error('Failed to fetch user details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setCurrentUser(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let response;
      if (currentUser) {
        response = await updateUser(currentUser.id || currentUser._id, values);
        message.success('User updated successfully');
      } else {
        response = await createUser(values);
        message.success('User created successfully');
      }

      await fetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
      setIsModalVisible(false);
      form.resetFields();
      setCurrentUser(null);
    } catch (err) {
      console.error('Submit error:', err);
      message.error(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      setTableLoading(true);
      await deleteUser(userId);
      message.success('User deleted successfully');

      const newTotal = pagination.total - 1;
      const maxPage = Math.ceil(newTotal / pagination.pageSize);
      const currentPage = pagination.current > maxPage ? maxPage : pagination.current;

      await fetchUserData({
        pagination: { ...pagination, current: Math.max(1, currentPage) },
      });
    } catch (err) {
      console.error('Delete error:', err);
      message.error(err.message || 'Failed to delete user');
    } finally {
      setTableLoading(false);
    }
  };

  const refreshData = () => {
    setError(null);
    setSearchText('');
    setFilters({ status: null, role: null, dateRange: null });
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
  };

  const handleBulkAction = async (action) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select users first');
      return;
    }

    try {
      setTableLoading(true);

      switch (action) {
        case 'activate':
          await bulkUpdateUsers(selectedRowKeys, { status: 'active' });
          message.success(`${selectedRowKeys.length} users activated`);
          break;
        case 'deactivate':
          await bulkUpdateUsers(selectedRowKeys, { status: 'inactive' });
          message.success(`${selectedRowKeys.length} users deactivated`);
          break;
        default:
          return;
      }

      setSelectedRowKeys([]);
      await fetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
    } catch (err) {
      console.error('Bulk action error:', err);
      message.error('Bulk action failed: ' + err.message);
    } finally {
      setTableLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      const blob = await exportUsers(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${moment().format('YYYY-MM-DD')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Users exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      message.error('Export failed: ' + err.message);
    }
  };

  const columns = [
    {
      title: <Text strong>USER</Text>,
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space className="user-info-space">
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            size="large"
            className="user-avatar"
          />
          <div className="user-details">
            <Text strong className="user-name">
              {text || 'Unknown User'}
            </Text>
            <div className="user-email">
              <Text type="secondary">
                {record.email || 'No Email'}
              </Text>
            </div>
            {record.lastLogin && (
              <div className="last-login">
                <Text type="secondary">
                  Last login: {moment(record.lastLogin).fromNow()}
                </Text>
              </div>
            )}
          </div>
        </Space>
      ),
      sorter: true,
      width: 280,
    },
    {
      title: <Text strong>ROLE</Text>,
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag
          className="role-tag"
          data-role={role}
          color={role === 'admin' ? 'gold' : 'blue'}
        >
          {(role || 'user').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'User', value: 'user' },
      ],
      width: 120,
    },
    {
      title: <Text strong>STATUS</Text>,
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={status === 'active' ? 'success' : 'default'}
          text={
            <Text className="status-text">
              {(status || 'inactive').toUpperCase()}
            </Text>
          }
        />
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      width: 120,
    },
    {
      title: <Text strong>JOINED</Text>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Tooltip title={moment(date).format('LLLL')}>
          <Text className="join-date">
            {date ? moment(date).format('MMM DD, YYYY') : 'Unknown'}
          </Text>
        </Tooltip>
      ),
      sorter: true,
      width: 130,
    },
    {
      title: <Text strong>FILES</Text>,
      dataIndex: 'fileCount',
      key: 'fileCount',
      render: (count) => (
        <Text>{count || 0}</Text>
      ),
      sorter: true,
      width: 80,
    },
    {
      title: <Text strong>ACTIONS</Text>,
      key: 'actions',
      render: (_, record) => (
        <Space size="small" className="action-buttons">
          <Tooltip title="Edit User">
            <Button
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
              disabled={record.role === 'admin' && record.id !== currentUser?.id}
              className="edit-btn"
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user? This action cannot be undone."
            onConfirm={() => handleDelete(record.id || record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            disabled={record.role === 'admin'}
            overlayClassName="delete-confirm-modal"
          >
            <Tooltip title="Delete User">
              <Button
                icon={<DeleteOutlined />}
                danger
                disabled={record.role === 'admin'}
                className="delete-btn"
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      width: 100,
      fixed: 'right',
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.role === 'admin',
    }),
  };

  const renderMobileCards = () => (
    <div className="mobile-user-cards">
      {users.length > 0 ? (
        users.map((user) => (
          <Card
            key={user.id || user._id}
            className="mobile-user-card"
            size="small"
          >
            <div className="mobile-user-header">
              <Avatar
                src={user.avatar}
                icon={<UserOutlined />}
                size="large"
                className="mobile-user-avatar"
              />
              <div className="mobile-user-info">
                <Text strong className="user-name">
                  {user.name || 'Unknown User'}
                </Text>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {user.email || 'No Email'}
                  </Text>
                </div>
                <Space size="small" style={{ marginTop: '4px' }}>
                  <Tag
                    className="role-tag"
                    data-role={user.role}
                    size="small"
                    color={user.role === 'admin' ? 'gold' : 'blue'}
                  >
                    {(user.role || 'user').toUpperCase()}
                  </Tag>
                  <Badge
                    status={user.status === 'active' ? 'success' : 'default'}
                    text={
                      <Text className="status-text" style={{ fontSize: '11px' }}>
                        {(user.status || 'inactive').toUpperCase()}
                      </Text>
                    }
                  />
                </Space>
              </div>
            </div>
            <div className="mobile-user-actions">
              <Button
                icon={<EditOutlined />}
                onClick={() => showEditModal(user)}
                size="small"
                className="edit-btn"
                style={{ flex: 1 }}
              >
                Edit
              </Button>
              <Popconfirm
                title="Delete User"
                description="Are you sure?"
                onConfirm={() => handleDelete(user.id || user._id)}
                disabled={user.role === 'admin'}
              >
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  size="small"
                  className="delete-btn"
                  disabled={user.role === 'admin'}
                  style={{ flex: 1 }}
                >
                  Delete
                </Button>
              </Popconfirm>
            </div>
          </Card>
        ))
      ) : (
        <Text>No users available</Text>
      )}
    </div>
  );

  const loadMoreUsers = () => {
    const nextPage = pagination.current + 1;
    if (nextPage <= Math.ceil(pagination.total / pagination.pageSize)) {
      setPagination((prev) => ({ ...prev, current: nextPage }));
      fetchUserData({ pagination: { current: nextPage, pageSize: pagination.pageSize } });
    }
  };

  if (loading && users.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="user-management-container">
        <Card
          className="user-management-card"
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <Title level={3} className="page-title">
                  User Management
                </Title>
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                  ({pagination.total} total users)
                </Text>
              </div>
              <Tooltip title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}>
                <Switch
                  checked={darkMode}
                  onChange={toggleTheme}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                  style={{ backgroundColor: darkMode ? '#1890ff' : '#d9d9d9' }}
                />
              </Tooltip>
            </div>
          }
          extra={
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={refreshData}
                loading={tableLoading}
                className="refresh-btn"
              >
                <span className="desktop-only">Refresh</span>
              </Button>
              <Button
                onClick={handleExportUsers}
                className="export-btn"
              >
                <span className="desktop-only">Export</span>
              </Button>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={showAddModal}
                className="add-user-btn"
              >
                <span className="desktop-only">Add User</span>
              </Button>
            </Space>
          }
        >
          <div className="filter-section">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={24} md={12} lg={6}>
                <Search
                  placeholder="Search by name or email..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  onSearch={handleSearch}
                  onChange={(e) => setSearchText(e.target.value)}
                  value={searchText}
                  className="search-input"
                />
              </Col>
              <Col xs={24} sm={8} md={6} lg={4}>
                <Select
                  placeholder="Filter by role"
                  allowClear
                  value={filters.role}
                  onChange={(value) => handleFilterChange('role', value)}
                  suffixIcon={<FilterFilled />}
                  className="filter-select"
                  style={{ width: '100%' }}
                >
                  <Option value="admin">Admin</Option>
                  <Option value="user">User</Option>
                </Select>
              </Col>
              <Col xs={24} sm={8} md={6} lg={4}>
                <Select
                  placeholder="Filter by status"
                  allowClear
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  suffixIcon={<FilterFilled />}
                  className="filter-select"
                  style={{ width: '100%' }}
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Col>
              <Col xs={24} sm={8} md={6} lg={6}>
                <RangePicker
                  value={filters.dateRange}
                  onChange={(dates) => handleFilterChange('dateRange', dates)}
                  className="date-range-picker"
                  style={{ width: '100%' }}
                  placeholder={['Start Date', 'End Date']}
                />
              </Col>
            </Row>

            {selectedRowKeys.length > 0 && (
              <Row style={{ marginTop: '16px' }}>
                <Col span={24}>
                  <Alert
                    message={
                      <Space wrap>
                        <Text>{selectedRowKeys.length} users selected</Text>
                        <Button size="small" onClick={() => handleBulkAction('activate')}>
                          Activate
                        </Button>
                        <Button size="small" onClick={() => handleBulkAction('deactivate')}>
                          Deactivate
                        </Button>
                        <Button size="small" onClick={() => setSelectedRowKeys([])}>
                          Clear Selection
                        </Button>
                      </Space>
                    }
                    type="info"
                    showIcon
                  />
                </Col>
              </Row>
            )}
          </div>

          <Divider className="table-divider" />

          {error && (
            <div className="error-container" style={{ marginBottom: '16px' }}>
              <Alert
                message="Error Loading Users"
                description={error}
                type="error"
                showIcon
                action={
                  <Button size="small" danger onClick={refreshData}>
                    Retry
                  </Button>
                }
              />
            </div>
          )}

          <div className="desktop-table">
            <Table
              columns={columns}
              dataSource={users}
              rowKey={(record) => record.id || record._id}
              rowSelection={rowSelection}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} users`,
                className: 'user-table-pagination',
                responsive: true,
              }}
              loading={tableLoading}
              onChange={handleTableChange}
              scroll={{ x: 800 }}
              className="user-table"
              bordered
              size="middle"
            />
          </div>

          <div className="mobile-view">
            {renderMobileCards()}
            {users.length > 0 && pagination.current < Math.ceil(pagination.total / pagination.pageSize) && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button
                  icon={<PlusOutlined />}
                  onClick={loadMoreUsers}
                  loading={tableLoading}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BulbOutlined style={{ color: 'var(--accent-color)' }} />
              <Title level={4} className="modal-title">
                {modalTitle}
              </Title>
            </div>
          }
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={handleCancel}
          confirmLoading={loading}
          width={600}
          className="user-modal"
          footer={[
            <Button key="back" onClick={handleCancel} className="cancel-btn">
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              className="submit-btn"
            >
              {currentUser ? 'Update User' : 'Create User'}
            </Button>,
          ]}
        >
          <Form
            form={form}
            layout="vertical"
            className="user-form"
            initialValues={{
              status: 'active',
              role: 'user',
            }}
          >
            <Form.Item
              name="name"
              label={<Text strong>Full Name</Text>}
              rules={[
                { required: true, message: 'Please input the user name!' },
                { min: 2, message: 'Name must be at least 2 characters!' },
              ]}
            >
              <Input
                placeholder="Enter full name"
                prefix={<UserOutlined />}
                className="form-input"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<Text strong>Email</Text>}
              rules={[
                { required: true, message: 'Please input the user email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input
                placeholder="Enter email address"
                prefix={<MailOutlined />}
                className="form-input"
                disabled={!!currentUser}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="role"
                  label={<Text strong>Role</Text>}
                  rules={[{ required: true, message: 'Please select a role!' }]}
                >
                  <Select className="form-select">
                    <Option value="user">User</Option>
                    <Option value="admin">Admin</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label={<Text strong>Status</Text>}
                  rules={[{ required: true, message: 'Please select a status!' }]}
                >
                  <Select className="form-select">
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {!currentUser && (
              <Form.Item
                name="password"
                label={<Text strong>Password</Text>}
                rules={[
                  { required: true, message: 'Please input the password!' },
                  { min: 8, message: 'Password must be at least 8 characters!' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number!',
                  },
                ]}
              >
                <Input.Password
                  placeholder="Enter password (min 8 chars)"
                  prefix={<LockOutlined />}
                  className="form-input"
                />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default UserManagement;