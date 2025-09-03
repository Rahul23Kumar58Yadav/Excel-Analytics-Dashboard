import React, { useState, useEffect } from 'react';
import { FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';
import GoogleAuthButton from '../context/GoogleAuthButton';
import { setAuthToken } from '../../services/apiService';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, setError, isAuthenticated, user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem('rememberMe') === 'true'
  );
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [loginAttempts, setLoginAttempts] = useState(
    parseInt(localStorage.getItem('loginAttempts')) || 0
  );
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);

  // Redirect based on role if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Authenticated user:', { user, role: user?.role });
      redirectBasedOnRole();
    }
  }, [isAuthenticated, user]);

  // Check account lock status
  useEffect(() => {
    const checkLockStatus = () => {
      const storedLock = localStorage.getItem('accountLock');
      if (storedLock) {
        try {
          const { timestamp, attempts } = JSON.parse(storedLock);
          const lockDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
          const currentTime = Date.now();

          if (currentTime - timestamp < lockDuration) {
            setIsLocked(true);
            setLockTime(Math.ceil((lockDuration - (currentTime - timestamp)) / 1000));
            setLoginAttempts(attempts);
          } else {
            localStorage.removeItem('accountLock');
            localStorage.removeItem('loginAttempts');
            setLoginAttempts(0);
          }
        } catch (err) {
          console.error('Error parsing lock data:', err);
          localStorage.removeItem('accountLock');
          localStorage.removeItem('loginAttempts');
        }
      }
    };

    checkLockStatus();
  }, []);

  const redirectBasedOnRole = () => {
    try {
      // Normalize role to handle case sensitivity
      const role = user?.role?.toLowerCase();
      // Define valid routes for validation
      const validRoutes = ['/dashboard', '/admin/users', '/admin/files', '/admin/system', '/admin/settings'];
      let redirectAfterLogin = localStorage.getItem('redirectAfterLogin') || (role === 'admin' ? '/admin/users' : '/dashboard');

      // Validate redirect path
      if (!validRoutes.includes(redirectAfterLogin)) {
        console.warn(`Invalid redirect path: ${redirectAfterLogin}. Defaulting to role-based path.`);
        redirectAfterLogin = role === 'admin' ? '/admin/users' : '/dashboard';
      }

      console.log('Redirecting to:', redirectAfterLogin, 'Role:', role);
      localStorage.removeItem('redirectAfterLogin'); // Clear redirect
      navigate(redirectAfterLogin, { replace: true });
    } catch (err) {
      console.error('Redirect error:', err.message || err);
      navigate('/dashboard', { replace: true });
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }

    if (error && setError) {
      setError(null);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.email = validateField('email', formData.email);
    newErrors.password = validateField('password', formData.password);

    setFieldErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleAccountLock = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('loginAttempts', newAttempts.toString());

    if (newAttempts >= 5) {
      const lockData = {
        timestamp: Date.now(),
        attempts: newAttempts,
      };
      localStorage.setItem('accountLock', JSON.stringify(lockData));
      setIsLocked(true);
      setLockTime(300); // 5 minutes in seconds

      toast.error('Account locked due to multiple failed attempts. Please try again in 5 minutes.');
    }
  };

  const resetLoginAttempts = () => {
    setLoginAttempts(0);
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('accountLock');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) {
      toast.error(`Account temporarily locked. Try again in ${Math.ceil(lockTime / 60)} minutes.`);
      return;
    }

    if (!validateForm()) return;

    try {
      if (setError) setError(null);

      const { token, user: userData } = await login(formData.email, formData.password);

      // Set token using apiService
      setAuthToken(token);

      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }

      // Reset login attempts onsuccessful login
      resetLoginAttempts();

      toast.success('Login successful!');
    } catch (err) {
      console.error('Login error:', err);

      let errorMessage = 'Login failed. Please try again.';

      if (err.message) {
        switch (err.message) {
          case 'Invalid credentials':
          case 'Invalid email or password':
            errorMessage = 'Invalid email or password';
            handleAccountLock();
            break;
          case 'User not found':
            errorMessage = 'No account found with this email address';
            break;
          case 'Account has been deactivated. Please contact support.':
          case 'Account deactivated':
            errorMessage = 'Account deactivated. Please contact support.';
            break;
          case 'Account temporarily locked due to too many failed login attempts':
            errorMessage = 'Account temporarily locked. Please try again later.';
            handleAccountLock();
            break;
          case 'No response from server. Ensure backend is running on port 5000.':
          case 'Network Error':
            errorMessage = 'Cannot connect to server. Please check your connection and try again.';
            break;
          case 'Database connection failed':
          case 'MongoDB connection error':
            errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
            break;
          case 'Request timeout':
            errorMessage = 'Request timed out. Please try again.';
            break;
          default:
            if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
              errorMessage = 'Server error. Please try again in a few minutes.';
            } else {
              errorMessage = err.message || 'Login failed. Please try again.';
            }
        }
      }

      if (setError) {
        setError(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Countdown timer for account lock
  useEffect(() => {
    if (lockTime > 0) {
      const timer = setInterval(() => {
        setLockTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsLocked(false);
            resetLoginAttempts();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockTime]);

  const formatLockTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`login-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="login-card">
        {/* Left Section - Login Form */}
        <div className="login-form-section">
          <div className="form-header">
            <h2>
              <FaSignInAlt className="icon" /> Welcome Back
            </h2>
            <p>Please sign in to your account</p>
          </div>

          {/* Global Error Display */}
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button
                onClick={() => setError && setError(null)}
                className="error-close"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {isLocked && (
            <div className="lock-banner" role="alert">
              <span>
                Account temporarily locked due to multiple failed attempts.
                Please try again in {formatLockTime(lockTime)}.
              </span>
            </div>
          )}

          {loginAttempts >= 3 && loginAttempts < 5 && !isLocked && (
            <div className="warning-banner" role="alert">
              <span>Warning: {5 - loginAttempts} attempts remaining before account lock.</span>
            </div>
          )}

          {/* Google Auth (Placeholder) */}
          <div className="social-login">
            <GoogleAuthButton disabled={loading || isLocked} />
          </div>

          <div className="divider">
            <span>or continue with email</span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your email"
                  className={`form-input ${fieldErrors.email ? 'error' : ''} ${
                    touched.email && !fieldErrors.email && formData.email ? 'valid' : ''
                  }`}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  disabled={loading || isLocked}
                  autoComplete="email"
                  required
                />
              </div>
              {fieldErrors.email && (
                <span id="email-error" className="error-message" role="alert">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <div className="input-wrapper password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  className={`form-input ${fieldErrors.password ? 'error' : ''} ${
                    touched.password && !fieldErrors.password && formData.password ? 'valid' : ''
                  }`}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  disabled={loading || isLocked}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || isLocked}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {fieldErrors.password && (
           <span id="password-error" className="error-message" role="alert">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  disabled={loading || isLocked}
                />
                <span className="checkmark"></span>
                <span>Remember me</span>
              </label>

              <Link to="/auth/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className={`submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading || isLocked || !formData.email || !formData.password}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/auth/register" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Right Section - Welcome Message */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h2>Hello, Friend!</h2>
            <p>Enter your personal details and start your journey with us</p>

            <div className="features-list">
              <div className="feature">
                <span className="feature-icon">🔒</span>
                <span>Secure Authentication</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <span>Fast & Reliable</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📱</span>
                <span>Mobile Friendly</span>
              </div>
            </div>

            <div className="account-prompt">
              <p>New here?</p>
              <Link to="/auth/register" className="signup-btn">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span className="theme-icon">{darkMode ? '☀️' : '🌙'}</span>
        <span className="theme-text">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default Login;