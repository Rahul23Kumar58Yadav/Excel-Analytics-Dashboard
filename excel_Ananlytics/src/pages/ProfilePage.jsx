import { useState, useEffect, useRef, useMemo } from 'react';
import {
  FiUser, FiEdit3, FiSave, FiX, FiCamera, FiMail, FiPhone,
  FiMapPin, FiCalendar, FiFileText, FiPieChart, FiBarChart2,
  FiUpload, FiDownload, FiTrash2, FiEye, FiSettings,
  FiActivity, FiTrendingUp, FiDatabase, FiClock
} from 'react-icons/fi';
import { useAuth } from '../components/context/AuthContext'; // Updated path
import { useTheme } from '../components/context/ThemeContext'; // Updated path
import axios from 'axios';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, token, updateUser } = useAuth();
  const { darkMode = false } = useTheme() || {}; // Fallback for safety
  const fileInputRef = useRef(null);

  const initialProfileData = useMemo(() => ({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '/default-avatar.png',
    joinDate: user?.createdAt || new Date().toISOString()
  }), [user]);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(initialProfileData);

  const [activityData, setActivityData] = useState({
    totalFiles: 0,
    totalCharts: 0,
    totalReports: 0,
    storageUsed: 0,
    recentFiles: [],
    recentCharts: [],
    activityLog: []
  });

  const [stats, setStats] = useState([
    { icon: <FiDatabase />, label: 'Files Uploaded', value: 0, color: 'primary' },
    { icon: <FiPieChart />, label: 'Charts Created', value: 0, color: 'success' },
    { icon: <FiFileText />, label: 'Reports Generated', value: 0, color: 'warning' },
    { icon: <FiActivity />, label: 'Storage Used', value: '0 MB', color: 'danger' }
  ]);

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/v1/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityData(prev => ({
        ...prev,
        totalFiles: prev.totalFiles - 1,
        recentFiles: prev.recentFiles.filter(file => file.id !== fileId),
        activityLog: prev.activityLog.filter(activity => activity.id !== fileId)
      }));
      setStats(prev =>
        prev.map(stat =>
          stat.label === 'Files Uploaded' ? { ...stat, value: stat.value - 1 } : stat
        )
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChart = async (chartId) => {
    if (!window.confirm('Are you sure you want to delete this chart?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/v1/charts/${chartId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityData(prev => ({
        ...prev,
        totalCharts: prev.totalCharts - 1,
        recentCharts: prev.recentCharts.filter(chart => chart.id !== chartId),
        activityLog: prev.activityLog.filter(activity => activity.id !== chartId)
      }));
      setStats(prev =>
        prev.map(stat =>
          stat.label === 'Charts Created' ? { ...stat, value: stat.value - 1 } : stat
        )
      );
    } catch (error) {
      console.error('Error deleting chart:', error);
      alert('Failed to delete chart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profileResponse = await axios.get('http://localhost:5000/api/v1/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (profileResponse.data.status === 'success') {
          const userData = profileResponse.data.data.user;
          setProfileData(prev => ({
            ...prev,
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            location: userData.location || '',
            bio: userData.bio || '',
            avatar: userData.avatar || '/default-avatar.png',
            joinDate: userData.createdAt || new Date().toISOString()
          }));
        }

        const filesResponse = await axios.get('http://localhost:5000/api/v1/files/user', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const chartsResponse = await axios.get('http://localhost:5000/api/v1/charts/user', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const reportsResponse = await axios.get('http://localhost:5000/api/v1/reports/user', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { data: [] } }));

        const files = filesResponse.data.data || [];
        const charts = chartsResponse.data.data || [];
        const reports = reportsResponse.data.data || [];

        const totalStorageBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
        const storageInMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

        setActivityData({
          totalFiles: files.length,
          totalCharts: charts.length,
          totalReports: reports.length,
          storageUsed: totalStorageBytes,
          recentFiles: files.slice(0, 5).map(file => ({
            id: file._id,
            name: file.originalname || file.name,
            date: file.createdAt,
            size: file.size,
            type: file.mimetype
          })),
          recentCharts: charts.slice(0, 5).map(chart => ({
            id: chart._id,
            title: chart.title,
            type: chart.chartType,
            date: chart.createdAt
          })),
          activityLog: [
            ...files.map(f => ({ type: 'file', action: 'uploaded', name: f.originalname, date: f.createdAt, id: f._id })),
            ...charts.map(c => ({ type: 'chart', action: 'created', name: c.title, date: c.createdAt, id: c._id }))
          ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
        });

        setStats([
          { icon: <FiDatabase />, label: 'Files Uploaded', value: files.length, color: 'primary' },
          { icon: <FiPieChart />, label: 'Charts Created', value: charts.length, color: 'success' },
          { icon: <FiFileText />, label: 'Reports Generated', value: reports.length, color: 'warning' },
          { icon: <FiActivity />, label: 'Storage Used', value: `${storageInMB} MB`, color: 'danger' }
        ]);

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [token]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.put('http://localhost:5000/api/v1/users/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        updateUser(response.data.data.user);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/v1/users/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === 'success') {
        setProfileData(prev => ({ ...prev, avatar: response.data.data.avatarUrl }));
        updateUser({ ...user, avatar: response.data.data.avatarUrl });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading && !profileData.name) {
    return (
      <div className={`profile-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`profile-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="profile-header">
        <div className="profile-cover">
          <div className="cover-gradient"></div>
        </div>
        
        <div className="profile-info">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <img
                src={profileData.avatar}
                alt="Profile"
                className="avatar"
                onError={(e) => { e.target.src = '/default-avatar.png'; e.target.classList.add('loaded'); }}
              />
              {isEditing && (
                <button
                  className="avatar-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiCamera />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }
              }
            />
          </div>
          
          <div className="user-details">
            {isEditing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="name-input"
                placeholder="Your name"
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <h1 className="user-name">{profileData.name || 'User'}</h1>
            )}
            
            <p className="user-email">
              <FiMail /> {profileData.email}
            </p>
            
            <p className="join-date">
              <FiCalendar /> Joined {formatDate(profileData.joinDate)}
            </p>
          </div>
        </div>

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button
                className="btn btn-success"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                <FiSave /> Save
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                <FiX /> Cancel
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              <FiEdit3 /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <div className="section-header">
            <h2>Profile Information</h2>
            <FiUser className="section-icon" />
          </div>
          <div className="profile-fields">
            <div className="field-group">
              <label>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Your phone number"
                />
              ) : (
                <p><FiPhone /> {profileData.phone || 'Not provided'}</p>
              )}
            </div>
            <div className="field-group">
              <label>Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Your location"
                />
              ) : (
                <p><FiMapPin /> {profileData.location || 'Not provided'}</p>
              )}
            </div>
            <div className="field-group full-width">
              <label>Bio</label>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              ) : (
                <p>{profileData.bio || 'No bio provided'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2>Recent Files</h2>
            <FiDatabase className="section-icon" />
          </div>
          
          <div className="items-list">
            {activityData.recentFiles.length > 0 ? (
              activityData.recentFiles.map((file) => (
                <div key={file.id} className="list-item">
                  <div className="item-info">
                    <h4>{file.name}</h4>
                    <p>{formatDate(file.date)} • {formatFileSize(file.size)}</p>
                  </div>
                  <div className="item-actions">
                    <button className="action-btn view"><FiEye /></button>
                    <button className="action-btn download"><FiDownload /></button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No files uploaded yet</p>
            )}
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2>Recent Charts</h2>
            <FiBarChart2 className="section-icon" />
          </div>
          
          <div className="items-list">
            {activityData.recentCharts.length > 0 ? (
              activityData.recentCharts.map((chart) => (
                <div key={chart.id} className="list-item">
                  <div className="item-info">
                    <h4>{chart.title}</h4>
                    <p>{chart.type} Chart • {formatDate(chart.date)}</p>
                  </div>
                  <div className="item-actions">
                    <button className="action-btn view"><FiEye /></button>
                    <button className="action-btn download"><FiDownload /></button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteChart(chart.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No charts created yet</p>
            )}
          </div>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <FiActivity className="section-icon" />
          </div>
          
          <div className="activity-log">
            {activityData.activityLog.length > 0 ? (
              activityData.activityLog.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === 'file' ? <FiUpload /> : <FiPieChart />}
                  </div>
                  <div className="activity-content">
                    <p>
                      <strong>{activity.action}</strong> {activity.type} "{activity.name}"
                    </p>
                    <span className="activity-date">
                      <FiClock /> {formatDate(activity.date)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProfilePage;