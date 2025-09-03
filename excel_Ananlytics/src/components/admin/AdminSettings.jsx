import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Tabs, Card, Form, Input, Button, Switch, Select, message, Divider, Avatar, Upload } from 'antd';
import { SettingOutlined, UserOutlined, LockOutlined, MailOutlined, NotificationOutlined, CloudUploadOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import "./AdminSettings.css"

const { TabPane } = Tabs;
const { Option } = Select;

// Theme Context
const ThemeContext = createContext({
  darkMode: false,
  toggleTheme: () => {},
  isSystemDark: false,
});

const ThemeProvider = ({ children, defaultDark = false }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) return JSON.parse(savedMode);
    
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return defaultDark ?? isSystemDark;
  });
  
  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      setIsSystemDark(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const contextValue = useMemo(() => ({
    darkMode,
    toggleTheme,
    isSystemDark,
  }), [darkMode, isSystemDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const AdminSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const { darkMode, toggleTheme } = useTheme();

  const onFinish = (values) => {
    setLoading(true);
    console.log('Received values:', values);
    setTimeout(() => {
      message.success('Settings updated successfully');
      setLoading(false);
    }, 1500);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div className="admin-settings-container">
      

      <div className="settings-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SettingOutlined /> Admin Settings
        </div>
        <Button 
          className="theme-toggle" 
          onClick={toggleTheme}
          icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
        >
          {darkMode ? 'Light' : 'Dark'}
        </Button>
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        className="settings-tabs"
        tabPosition="left"
        destroyInactiveTabPane={false}
      >
        <TabPane tab={
          <span>
            <UserOutlined /> Profile
          </span>
        } key="profile">
          <Card className="settings-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
            >
              <div className="avatar-upload-section">
                <Avatar 
                  size={120} 
                  icon={<UserOutlined />} 
                  className="admin-avatar"
                />
                <Upload 
                  name="avatar" 
                  showUploadList={false}
                  className="avatar-upload"
                >
                  <Button icon={<CloudUploadOutlined />}>Change Avatar</Button>
                </Upload>
              </div>

              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please input your name!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Admin Name" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="admin@example.com" />
              </Form.Item>

              <Divider orientation="left">Security</Divider>

              <Form.Item
                label="Current Password"
                name="currentPassword"
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Current Password" />
              </Form.Item>

              <Form.Item
                label="New Password"
                name="newPassword"
              >
                <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  className="save-btn"
                >
                  Update Profile
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab={
          <span>
            <NotificationOutlined /> Notifications
          </span>
        } key="notifications">
          <Card className="settings-card">
            <Form layout="vertical">
              <Form.Item label="Email Notifications" name="emailNotifications">
                <Switch checkedChildren="On" unCheckedChildren="Off" defaultChecked />
              </Form.Item>

              <Form.Item label="System Alerts" name="systemAlerts">
                <Switch checkedChildren="On" unCheckedChildren="Off" defaultChecked />
              </Form.Item>

              <Form.Item label="Notification Frequency" name="frequency">
                <Select defaultValue="daily">
                  <Option value="instant">Instant</Option>
                  <Option value="daily">Daily Digest</Option>
                  <Option value="weekly">Weekly Summary</Option>
                </Select>
              </Form.Item>

              <Divider orientation="left">Notification Preferences</Divider>

              <Form.Item label="New User Registration" name="newUser">
                <Switch checkedChildren="On" unCheckedChildren="Off" defaultChecked />
              </Form.Item>

              <Form.Item label="System Updates" name="systemUpdates">
                <Switch checkedChildren="On" unCheckedChildren="Off" defaultChecked />
              </Form.Item>

              <Form.Item>
                <Button type="primary" className="save-btn">
                  Save Preferences
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminSettings;