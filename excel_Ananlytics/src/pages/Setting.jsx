import { useState , useRef} from 'react';
import { FiUser, FiMail, FiLock, FiMoon, FiSun, FiBell, FiGlobe } from 'react-icons/fi';
import './Setting.css';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [password, setPassword] = useState('');

  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: ''
  });
    const [avatar, setAvatar] = useState(null);
  const [avatarInitials, setAvatarInitials] = useState('JD');
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File size should be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const calculatePasswordStrength = (password) => {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const length = password.length;

  let strength = 0;
  if (length > 0) strength += 1;
  if (length > 5) strength += 1;
  if (hasLower && hasUpper) strength += 1;
  if (hasNumber) strength += 1;
  if (hasSpecial) strength += 1;

  return strength;
};

const getStrengthClass = (strength) => {
  if (strength === 0) return 'empty';
  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
};

const getStrengthText = (strength) => {
  if (strength === 0) return '';
  if (strength <= 2) return 'Weak';
  if (strength <= 4) return 'Medium';
  return 'Strong';
};

  return (
    <div className={`settings-container ${darkMode ? 'dark' : ''}`}>
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p>Manage your profile and preferences</p>
      </div>

      <div className="settings-grid">
        {/* Profile Section */}
        <section className="settings-card profile-section">
          <div className="card-header">
            <FiUser className="icon" />
            <h2>Profile Information</h2>
          </div>
          <div className="card-content">
              <div className="avatar-container">
        <div className="avatar">
          {avatar ? (
            <img src={avatar} alt="User Avatar" className="avatar-image" />
          ) : (
            <span>{avatarInitials}</span>
          )}
          <div className="avatar-hover">
            <button 
              className="edit-button"
              onClick={triggerFileInput}
            >
              Change
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden-input"
            />
             </div>
            </div>
          </div>
            <form className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-container">
                  <FiUser className="input-icon" />
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-container">
                  <FiMail className="input-icon" />
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <button type="submit" className="save-button">
                Save Changes
              </button>
            </form>
          </div>
        </section>

        {/* Security Section */}
        <section className="settings-card security-section">
          <div className="card-header">
            <FiLock className="icon" />
            <h2>Security</h2>
          </div>
          <div className="card-content">
            <h2>Upadate Password</h2>
            <form className="security-form">
              <div className="form-group">
                <label>Current Password</label>
                <div className="input-container">
                  <FiLock className="input-icon" />
                 
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="form-group">
                    <label>New Password</label>
                   <div className="input-container">
                     <FiLock className="input-icon" />
                     <input 
                       type="password" 
                       name="newPassword" 
                       value={formData.newPassword}
                       onChange={(e) => {
                         handleChange(e);
                         setPassword(e.target.value);
                       }}
                       placeholder="••••••••"
                     />
                 </div>
                 <div className="password-strength">
                   <div className="strength-meter">
                     <div 
                       className={`strength-bar ${getStrengthClass(calculatePasswordStrength(password))}`}
                       style={{ width: `${(calculatePasswordStrength(password) / 5) * 100}%` }}
                     ></div>
                   </div>
                   {password && (
                     <span>Password Strength: {getStrengthText(calculatePasswordStrength(password))}</span>
                   )}
                 </div>
               
              </div>
              <button type="submit" className="update-button">
                Update Password
              </button>
            </form>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="settings-card preferences-section">
          <div className="card-header">
            <FiMoon className="icon" />
            <h2>Preferences</h2>
          </div>
          <div className="card-content">
            <div className="preference-item">
              <div className="preference-info">
                <FiMoon className="preference-icon" />
                <div>
                  <h3>Dark Mode</h3>
                  <p>Switch between light and dark theme</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="preference-item">
              <div className="preference-info">
                <FiBell className="preference-icon" />
                <div>
                  <h3>Notifications</h3>
                  <p>Enable or disable notifications</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={notifications}
                  onChange={() => setNotifications(!notifications)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="preference-item">
              <div className="preference-info">
                <FiGlobe className="preference-icon" />
                <div>
                  <h3>Language</h3>
                  <p>Select your preferred language</p>
                </div>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="language-select"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;