import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUserShield, FaUser } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { register: authRegister, isAuthenticated, user } = useAuth();

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role || 'user';
      navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        if (!/^[a-zA-Z0-9_\s-]+$/.test(value.trim())) return 'Name can only contain letters, numbers, hyphens, underscores, and spaces';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      case 'role':
        if (!value) return 'Please select an account type';
        return '';
      default:
        return '';
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^A-Za-z0-9]/)) strength += 1;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear global error when user starts typing
    if (error) {
      setError('');
    }

    // Validate field if it's been touched
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }

    // Update password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));

      // Re-validate confirm password if it exists
      if (formData.confirmPassword && touched.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validateField('confirmPassword', formData.confirmPassword),
        }));
      }
    }

    // Re-validate confirm password when it changes
    if (name === 'confirmPassword' && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField(name, value),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const validate = () => {
    const newErrors = {};
    Object.keys(formData).forEach(field => {
      newErrors[field] = validateField(field, formData[field]);
    });

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the form errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('Register.jsx: Attempting registration with endpoint:', 'http://localhost:5000/api/v1/auth/register');
      console.log('Register.jsx: Sending data:', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: '[REDACTED]',
        confirmPassword: '[REDACTED]',
        role: formData.role,
      });

      const result = await authRegister(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        formData.confirmPassword,
        formData.role
      );

      console.log('Register.jsx: Registration successful:', result);
      toast.success('Registration successful! Welcome aboard!');

      // Redirect based on role
      const userRole = result?.data?.user?.role || formData.role;
      navigate(userRole === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      console.error('Register.jsx: Registration error details:', err.message, err.response?.status);
      let errorMessage = err.message;
      if (err.message.includes('Network Error') || err.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on port 5000.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Registration endpoint not found. Please verify backend configuration at http://localhost:5000/api/v1/auth/register.';
      } else if (err.response?.status === 409) {
        errorMessage = 'An account with this email already exists.';
      } else if (err.response?.status) {
        errorMessage = `Server error (${err.response.status}): ${err.response.data?.message || 'Unknown error'}`;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return formData.password ? 'Very Weak' : '';
      case 1: return 'Weak';
      case 2: return 'Moderate';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return '#ff4d4d';
      case 1: return '#ff4d4d';
      case 2: return '#ffa64d';
      case 3: return '#66b3ff';
      case 4: return '#4dff4d';
      default: return 'transparent';
    }
  };

  return (
    <div className={`register-container ${darkMode ? 'dark' : 'light'} ${isSubmitting ? 'loading' : ''}`}>
      {isSubmitting && <div className="loading-overlay"><div className="spinner"></div></div>}
      <div className="register-card">
        <div className="register-form-section">
          <h2><FaUserPlus className="icon" /> Create Account</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="name" // FIXED: Changed from username to name
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Full Name" // Updated placeholder
                className={errors.name ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Email Address"
                className={errors.email ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Password (min 8 characters)"
                className={errors.password ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
              {formData.password && (
                <div className="password-strength-meter">
                  <div 
                    className="strength-indicator"
                    style={{
                      width: `${passwordStrength * 25}%`,
                      backgroundColor: getPasswordStrengthColor(),
                    }}
                  ></div>
                  <span className="strength-text">{getPasswordStrengthText()}</span>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Confirm Password"
                className={errors.confirmPassword ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
            
            <div className="form-group role-selection">
              <label>Account Type:</label>
              <div className="role-options">
                <label className={`role-option ${formData.role === 'user' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={formData.role === 'user'}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <FaUser className="role-icon" />
                  <span>User</span>
                </label>
                
                <label className={`role-option ${formData.role === 'admin' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <FaUserShield className="role-icon" />
                  <span>Admin</span>
                </label>
              </div>
              {errors.role && <span className="error-message">{errors.role}</span>}
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : 'Sign Up'}
            </button>
          </form>
          
          <div className="login-prompt">
            Already have an account? <Link to="/auth/login">Sign In</Link>
          </div>
        </div>
        
        <div className="welcome-section">
          <div className="welcome-content">
            <h2>Welcome!</h2>
            <p>Join our community to unlock exclusive features and content.</p>
            <ul className="benefits-list">
              <li>Access to premium content</li>
              <li>Personalized recommendations</li>
              <li>Save your preferences</li>
              <li>Connect with other users</li>
            </ul>
            
            <div className="testimonial">
              <p>"This platform has transformed how I work. Highly recommended!"</p>
              <div className="testimonial-author">
                <div className="author-avatar"></div>
                <div className="author-info">
                  <strong>Rahul</strong>
                  <span>Power User</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <button className="theme-toggle" onClick={toggleDarkMode}>
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>
    </div>
  );
};

export default Register;