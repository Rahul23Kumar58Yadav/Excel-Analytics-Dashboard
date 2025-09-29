import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Card, Input, Button, Space, Spin, Modal, Form,
  Select, Tag, Popconfirm, message, Badge, Avatar, DatePicker,
  Typography, Divider, Row, Col, Alert, Tooltip, Switch, Skeleton, Collapse
} from 'antd';
import {
  SearchOutlined, UserAddOutlined, EditOutlined,
  DeleteOutlined, SyncOutlined, FilterFilled,
  UserOutlined, MailOutlined, LockOutlined, ReloadOutlined,
  SunOutlined, MoonOutlined, BulbOutlined, PlusOutlined,
  DownOutlined, UpOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';
import { fetchUsers, createUser, updateUser, deleteUser, getUserById, bulkUpdateUsers, exportUsers, getAuthToken } from '../../services/apiService';
import './UserManagement.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

// Constants
const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];
const FORM_RULES = {
  name: [
    { required: true, message: 'Please input the user name!' },
    { min: 2, message: 'Name must be at least 2 characters!' },
  ],
  email: [
    { required: true, message: 'Please input the user email!' },
    { type: 'email', message: 'Please enter a valid email!' },
  ],
  role: [{ required: true, message: 'Please select a role!' }],
  status: [{ required: true, message: 'Please select a status!' }],
  password: [
    { required: true, message: 'Please input the password!' },
    { min: 8, message: 'Password must be at least 8 characters!' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must contain uppercase, lowercase, and number!',
    },
  ],
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', { error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <Alert
            message="Error in User Management"
            description={this.state.error?.message || 'An unexpected error occurred'}
            type="error"
            showIcon
            action={
              <Space>
                <Button onClick={this.handleRetry}>Retry</Button>
                <Button onClick={() => window.location.reload()}>Reload</Button>
              </Space>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onRetry: PropTypes.func.isRequired,
};

// User Table Component
const UserTable = ({ users, columns, pagination, loading, rowSelection, onChange }) => (
  <div className="desktop-table">
    <Table
      columns={columns}
      dataSource={users}
      rowKey={(record) => record.id || record._id || `temp-${Math.random()}`}
      rowSelection={rowSelection}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
        className: 'user-table-pagination',
        responsive: true,
      }}
      loading={loading}
      onChange={onChange}
      scroll={{ x: 800, y: 600 }}
      className="user-table"
      bordered
      size="middle"
      tableLayout="fixed"
    />
  </div>
);

UserTable.propTypes = {
  users: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  pagination: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  rowSelection: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

// Mobile Cards Component
const MobileCards = ({ users, loading, onEdit, onDelete }) => (
  <div className="mobile-user-cards">
    {loading && !users.length ? (
      Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="mobile-user-card" size="small">
          <Skeleton avatar active paragraph={{ rows: 2 }} />
        </Card>
      ))
    ) : users.length > 0 ? (
      users.map((user) => (
        <Card
          key={user.id || user._id || `temp-${Math.random()}`}
          className="mobile-user-card"
          size="small"
          tabIndex={0}
          role="button"
          aria-label={`User card for ${user.name || 'Unknown User'}`}
        >
          <div className="mobile-user-header">
            <Avatar
              src={user.avatar}
              icon={<UserOutlined />}
              size="large"
              className="mobile-user-avatar"
            />
            <div className="mobile-user-info">
              <Text strong className="user-name" ellipsis={{ tooltip: user.name || 'Unknown User' }}>
                {user.name || 'Unknown User'}
              </Text>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }} ellipsis={{ tooltip: user.email || 'No Email' }}>
                  {user.email || 'No Email'}
                </Text>
              </div>
              <Space size="small" style={{ marginTop: '4px' }}>
                <Tag
                  className="role-tag"
                  data-role={user.role}
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
              onClick={() => onEdit(user)}
              size="small"
              className="edit-btn"
              style={{ flex: 1 }}
              aria-label={`Edit user ${user.name || 'Unknown User'}`}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete User"
              description="Are you sure?"
              onConfirm={() => onDelete(user.id || user._id)}
              disabled={user.role === 'admin'}
              overlayClassName="delete-confirm-modal"
              okButtonProps={{ 'aria-label': 'Confirm delete' }}
              cancelButtonProps={{ 'aria-label': 'Cancel delete' }}
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
                className="delete-btn"
                disabled={user.role === 'admin'}
                style={{ flex: 1 }}
                aria-label={`Delete user ${user.name || 'Unknown User'}`}
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

MobileCards.propTypes = {
  users: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// User Form Component
const UserForm = ({ form, currentUser, loading }) => (
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
      rules={FORM_RULES.name}
      validateTrigger={['onChange', 'onBlur']}
    >
      <Input
        placeholder="Enter full name"
        prefix={<UserOutlined />}
        className="form-input"
        aria-label="Full name input"
      />
    </Form.Item>

    <Form.Item
      name="email"
      label={<Text strong>Email</Text>}
      rules={FORM_RULES.email}
      validateTrigger={['onChange', 'onBlur']}
    >
      <Input
        placeholder="Enter email address"
        prefix={<MailOutlined />}
        className="form-input"
        disabled={!!currentUser}
        aria-label="Email input"
      />
    </Form.Item>

    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item
          name="role"
          label={<Text strong>Role</Text>}
          rules={FORM_RULES.role}
        >
          <Select className="form-select" aria-label="Role selector">
            <Option value="user">User</Option>
            <Option value="admin">Admin</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name="status"
          label={<Text strong>Status</Text>}
          rules={FORM_RULES.status}
        >
          <Select className="form-select" aria-label="Status selector">
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
        rules={FORM_RULES.password}
        validateTrigger={['onChange', 'onBlur']}
      >
        <Input.Password
          placeholder="Enter password (min 8 chars)"
          prefix={<LockOutlined />}
          className="form-input"
          aria-label="Password input"
        />
      </Form.Item>
    )}
  </Form>
);

UserForm.propTypes = {
  form: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
  loading: PropTypes.bool.isRequired,
};

const UserManagement = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
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
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchText) count++;
    if (filters.status) count++;
    if (filters.role) count++;
    if (filters.dateRange && filters.dateRange.length === 2) count++;
    return count;
  }, [searchText, filters]);

  // Debounced search handler
  const debouncedFetchUserData = useCallback(
    debounce((params) => {
      fetchUserData(params);
    }, 500),
    []
  );

  const fetchUserData = useCallback(
    async (params = {}) => {
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
        const usersArray = Array.isArray(userData.users || userData.data || userData)
          ? userData.users || userData.data || userData
          : [];
        const total = userData.totalCount || userData.total || usersArray.length;

        if (!Array.isArray(usersArray)) {
          throw new Error('Invalid response format: users array not found');
        }

        setUsers(usersArray.map((user) => ({
          ...user,
          id: user.id || user._id,
        })));
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
    },
    [searchText, filters]
  );

  useEffect(() => {
    fetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
  }, [fetchUserData]);

  const handleTableChange = useCallback(
    (newPagination, tableFilters, sorter) => {
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
    },
    [fetchUserData]
  );

  const handleSearch = useCallback(
    (value) => {
      setSearchText(value);
      setPagination((prev) => ({ ...prev, current: 1 }));
      debouncedFetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
    },
    [debouncedFetchUserData, pagination.pageSize]
  );

  const handleFilterChange = useCallback(
    (name, value) => {
      const newFilters = { ...filters, [name]: value };
      setFilters(newFilters);
      setPagination((prev) => ({ ...prev, current: 1 }));
      debouncedFetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
    },
    [debouncedFetchUserData, filters, pagination.pageSize]
  );

  const showAddModal = useCallback(() => {
    setModalTitle('Add New User');
    setCurrentUser(null);
    form.resetFields();
    setIsModalVisible(true);
  }, [form]);

  const showEditModal = useCallback(
    async (user) => {
      try {
        setLoading(true);
        const freshUserData = await getUserById(user.id);
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
    },
    [form]
  );

  const handleCancel = useCallback(() => {
    setIsModalVisible(false);
    form.resetFields();
    setCurrentUser(null);
  }, [form]);

  const handleSubmit = useCallback(
    async () => {
      try {
        const values = await form.validateFields();
        setLoading(true);

        let response;
        if (currentUser) {
          response = await updateUser(currentUser.id, values);
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
    },
    [currentUser, form, fetchUserData, pagination.pageSize]
  );

  const handleDelete = useCallback(
    async (userId) => {
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
    },
    [fetchUserData, pagination]
  );

  const handleBulkAction = useCallback(
    async (action) => {
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
    },
    [fetchUserData, selectedRowKeys, pagination.pageSize]
  );

  const handleExportUsers = useCallback(async () => {
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
  }, [filters]);

  const columns = useMemo(
    () => [
      {
        title: <Text strong>ROLE</Text>,
        dataIndex: 'role',
        key: 'role',
        width: 100,
        align: 'center',
        render: (role) => (
          <Tag
            className="role-tag"
            data-role={role}
            color={role === 'admin' ? 'gold' : 'blue'}
            style={{ margin: 0 }}
            aria-label={`Role: ${role || 'user'}`}
          >
            {(role || 'user').toUpperCase()}
          </Tag>
        ),
        filters: [
          { text: 'Admin', value: 'admin' },
          { text: 'User', value: 'user' },
        ],
      },
      {
        title: <Text strong>STATUS</Text>,
        dataIndex: 'status',
        key: 'status',
        width: 110,
        align: 'center',
        render: (status) => (
          <Badge
            status={status === 'active' ? 'success' : 'default'}
            text={
              <Text className="status-text" style={{ fontSize: '12px' }} aria-label={`Status: ${status || 'inactive'}`}>
                {(status || 'inactive').toUpperCase()}
              </Text>
            }
          />
        ),
        filters: [
          { text: 'Active', value: 'active' },
          { text: 'Inactive', value: 'inactive' },
        ],
      },
      {
        title: <Text strong>JOINED</Text>,
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 120,
        align: 'center',
        render: (date) => (
          <Tooltip title={date ? moment(date).format('LLLL') : 'Unknown'}>
            <div style={{ textAlign: 'center' }}>
              <Text className="join-date" style={{ fontSize: '12px' }}>
                {date ? moment(date).format('MMM DD') : 'Unknown'}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {date ? moment(date).format('YYYY') : ''}
              </Text>
            </div>
          </Tooltip>
        ),
        sorter: true,
      },
      {
        title: <Text strong>FILES</Text>,
        dataIndex: 'fileCount',
        key: 'fileCount',
        width: 80,
        align: 'center',
        render: (count) => (
          <Text style={{ fontSize: '14px', fontWeight: '500' }} aria-label={`File count: ${count || 0}`}>
            {count || 0}
          </Text>
        ),
        sorter: true,
      },
      {
        title: <Text strong>ACTIONS</Text>,
        key: 'actions',
        width: 120,
        fixed: 'right',
        align: 'center',
        render: (_, record) => (
          <Space size="small" className="action-buttons">
            <Tooltip title="Edit User">
              <Button
                icon={<EditOutlined />}
                onClick={() => showEditModal(record)}
                disabled={record.role === 'admin' && record.id !== currentUser?.id}
                className="edit-btn"
                size="small"
                type="text"
                aria-label={`Edit user ${record.name || 'Unknown User'}`}
              />
            </Tooltip>
            <Popconfirm
              title="Delete User"
              description="Are you sure you want to delete this user?"
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              disabled={record.role === 'admin'}
              overlayClassName="delete-confirm-modal"
              okButtonProps={{ 'aria-label': 'Confirm delete' }}
              cancelButtonProps={{ 'aria-label': 'Cancel delete' }}
            >
              <Tooltip title="Delete User">
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  disabled={record.role === 'admin'}
                  className="delete-btn"
                  size="small"
                  type="text"
                  aria-label={`Delete user ${record.name || 'Unknown User'}`}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [showEditModal, handleDelete, currentUser]
  );

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (selectedKeys) => {
        setSelectedRowKeys(selectedKeys);
      },
      getCheckboxProps: (record) => ({
        disabled: record.role === 'admin',
        name: record.name || 'Unknown User',
      }),
    }),
    [selectedRowKeys]
  );

  const handleRetry = useCallback(() => {
    setError(null);
    fetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
  }, [fetchUserData, pagination.pageSize]);

  if (loading && users.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Loading users..." />
      </div>
    );
  }

  return (
    <ErrorBoundary onRetry={handleRetry}>
      <div className="user-management-container" data-theme={darkMode ? 'dark' : 'light'}>
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
                  className="theme-switch"
                  aria-label="Toggle theme"
                />
              </Tooltip>
            </div>
          }
          extra={
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setError(null);
                  setSearchText('');
                  setFilters({ status: null, role: null, dateRange: null });
                  setPagination((prev) => ({ ...prev, current: 1 }));
                  fetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
                }}
                loading={tableLoading}
                className="refresh-btn"
                aria-label="Refresh users"
              >
                <span className="desktop-only">Refresh</span>
              </Button>
              <Button
                onClick={handleExportUsers}
                className="export-btn"
                aria-label="Export users"
              >
                <span className="desktop-only">Export</span>
              </Button>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={showAddModal}
                className="add-user-btn"
                aria-label="Add new user"
              >
                <span className="desktop-only">Add User</span>
              </Button>
            </Space>
          }
        >
          <div className="filter-section" aria-label="Filter and search controls">
            <Collapse
              defaultActiveKey={['filters']}
              onChange={(keys) => setIsFilterCollapsed(keys.length === 0)}
              className="filter-collapse"
              expandIcon={({ isActive }) => isActive ? <UpOutlined /> : <DownOutlined />}
              expandIconPosition="end"
            >
              <Panel
                header={
                  <div className="filter-header">
                    <Title level={5} className="filter-title">
                      <FilterFilled style={{ marginRight: '8px', color: 'var(--accent-color)' }} />
                      Filters & Search
                      {activeFilterCount > 0 && (
                        <Badge
                          count={activeFilterCount}
                          style={{ marginLeft: '8px', backgroundColor: 'var(--accent-color)' }}
                          aria-label={`Active filters: ${activeFilterCount}`}
                        />
                      )}
                    </Title>
                    <Text type="secondary" className="filter-subtitle">
                      Find and filter users efficiently
                    </Text>
                  </div>
                }
                key="filters"
                className="filter-panel"
              >
                <div className="filter-controls">
                  <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} sm={12} md={6} lg={6}>
                      <Tooltip title="Search users by name or email" aria-describedby="search-tooltip">
                        <div className="filter-item">
                          <Text strong className="filter-label">
                            <SearchOutlined /> Search Users
                          </Text>
                          <Search
                            placeholder="Name or email..."
                            allowClear
                            enterButton={
                              <Button type="primary" icon={<SearchOutlined />} className="search-btn">
                                Search
                              </Button>
                            }
                            size="small"
                            onSearch={handleSearch}
                            onChange={(e) => setSearchText(e.target.value)}
                            value={searchText}
                            className="search-input"
                            aria-label="Search users by name or email"
                            aria-describedby="search-tooltip"
                          />
                        </div>
                      </Tooltip>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={6}>
                      <Tooltip title="Filter by user role (Admin or User)" aria-describedby="role-tooltip">
                        <div className="filter-item">
                          <Text strong className="filter-label">
                            <UserOutlined /> Role
                          </Text>
                          <Select
                            placeholder="All Roles"
                            allowClear
                            value={filters.role}
                            onChange={(value) => handleFilterChange('role', value)}
                            size="small"
                            className="filter-select role-filter"
                            style={{ width: '100%' }}
                            aria-label="Filter by user role"
                            aria-describedby="role-tooltip"
                          >
                            <Option value="admin">
                              <Space>
                                <Tag color="gold" size="small">ADMIN</Tag>
                                Administrator
                              </Space>
                            </Option>
                            <Option value="user">
                              <Space>
                                <Tag color="blue" size="small">USER</Tag>
                                Regular User
                              </Space>
                            </Option>
                          </Select>
                        </div>
                      </Tooltip>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={6}>
                      <Tooltip title="Filter by user status (Active or Inactive)" aria-describedby="status-tooltip">
                        <div className="filter-item">
                          <Text strong className="filter-label">
                            <Badge status="success" /> Status
                          </Text>
                          <Select
                            placeholder="All Status"
                            allowClear
                            value={filters.status}
                            onChange={(value) => handleFilterChange('status', value)}
                            size="small"
                            className="filter-select status-filter"
                            style={{ width: '100%' }}
                            aria-label="Filter by user status"
                            aria-describedby="status-tooltip"
                          >
                            <Option value="active">
                              <Space>
                                <Badge status="success" />
                                Active Users
                              </Space>
                            </Option>
                            <Option value="inactive">
                              <Space>
                                <Badge status="default" />
                                Inactive Users
                              </Space>
                            </Option>
                          </Select>
                        </div>
                      </Tooltip>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={6}>
                      <Tooltip title="Filter by user join date range" aria-describedby="date-tooltip">
                        <div className="filter-item">
                          <Text strong className="filter-label">
                            📅 Join Date
                          </Text>
                          <RangePicker
                            value={filters.dateRange}
                            onChange={(dates) => handleFilterChange('dateRange', dates)}
                            className="date-range-picker"
                            size="small"
                            style={{ width: '100%' }}
                            placeholder={['Start', 'End']}
                            format="MMM DD, YYYY"
                            aria-label="Filter by join date range"
                            aria-describedby="date-tooltip"
                          />
                        </div>
                      </Tooltip>
                    </Col>
                    <Col xs={24} sm={24} md={24} lg={24}>
                      <div className="quick-filters">
                        <Space wrap size="small" align="center">
                          <Text type="secondary" style={{ fontSize: '12px', fontWeight: '500' }}>
                            Quick Filters:
                          </Text>
                          <Button
                            size="small"
                            type={filters.status === 'active' ? 'primary' : 'default'}
                            onClick={() => handleFilterChange('status', filters.status === 'active' ? null : 'active')}
                            className="quick-filter-btn"
                            aria-label="Show only active users"
                          >
                            <Badge status="success" />
                            Active Only
                          </Button>
                          <Button
                            size="small"
                            type={filters.role === 'admin' ? 'primary' : 'default'}
                            onClick={() => handleFilterChange('role', filters.role === 'admin' ? null : 'admin')}
                            className="quick-filter-btn"
                            aria-label="Show only admin users"
                          >
                            <UserOutlined />
                            Admins Only
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setFilters({ status: null, role: null, dateRange: null });
                              setSearchText('');
                              fetchUserData({ pagination: { current: 1, pageSize: pagination.pageSize } });
                            }}
                            className="clear-filters-btn"
                            aria-label="Clear all filters and search"
                          >
                            <SyncOutlined />
                            Clear All
                          </Button>
                        </Space>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Panel>
            </Collapse>
          </div>

          {selectedRowKeys.length > 0 && (
            <Row style={{ marginTop: '16px' }}>
              <Col span={24}>
                <Alert
                  message={
                    <Space wrap>
                      <Text>{selectedRowKeys.length} users selected</Text>
                      <Button size="small" onClick={() => handleBulkAction('activate')} aria-label="Activate selected users">
                        Activate
                      </Button>
                      <Button size="small" onClick={() => handleBulkAction('deactivate')} aria-label="Deactivate selected users">
                        Deactivate
                      </Button>
                      <Button size="small" onClick={() => setSelectedRowKeys([])} aria-label="Clear selection">
                        Clear Selection
                      </Button>
                    </Space>
                  }
                  type="info"
                  showIcon
                  aria-label="Bulk action controls"
                />
              </Col>
            </Row>
          )}

          <Divider className="table-divider" />

          {error && (
            <div className="error-container" style={{ marginBottom: '16px' }}>
              <Alert
                message="Error Loading Users"
                description={error}
                type="error"
                showIcon
                action={
                  <Button size="small" danger onClick={handleRetry} aria-label="Retry loading users">
                    Retry
                  </Button>
                }
              />
            </div>
          )}

          <UserTable
            users={users}
            columns={columns}
            pagination={pagination}
            loading={tableLoading}
            rowSelection={rowSelection}
            onChange={handleTableChange}
          />

          <MobileCards
            users={users}
            loading={tableLoading}
            onEdit={showEditModal}
            onDelete={handleDelete}
          />

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
            aria-labelledby="user-modal-title"
            footer={[
              <Button key="back" onClick={handleCancel} className="cancel-btn" aria-label="Cancel">
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={loading}
                onClick={handleSubmit}
                className="submit-btn"
                aria-label={currentUser ? 'Update user' : 'Create user'}
              >
                {currentUser ? 'Update User' : 'Create User'}
              </Button>
            ]}
          >
            <UserForm form={form} currentUser={currentUser} loading={loading} />
          </Modal>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

UserManagement.propTypes = {};

export default UserManagement;