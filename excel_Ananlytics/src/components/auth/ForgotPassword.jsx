import React, { useState } from 'react';
import { FaLock, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import API_CONFIG from '../../config';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkServerConnection = async () => {
    try {
      const response = await axios.get(
        `${API_CONFIG.API_BASE_URL}${API_CONFIG.ENDPOINTS.HEALTHCHECK}`,
        { timeout: API_CONFIG.TIMEOUT }
      );
      return response.data.status === 'OK';
    } catch (err) {
      console.error('Connection check failed:', err);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const isServerUp = await checkServerConnection();
      if (!isServerUp) {
        setMessage('Server connection failed. Please try again later.');
        return;
      }

      const response = await axios.post(
        `${API_CONFIG.API_BASE_URL}${API_CONFIG.ENDPOINTS.FORGOT_PASSWORD}`,
        { email },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: API_CONFIG.TIMEOUT
        }
      );

      setMessage(response.data.message || 'Reset link sent to your email.');
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage(
        error.response?.data?.message ||
        'Failed to send reset link. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className={`forgot-password-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="forgot-password-card">
        {/* Left Section - Form */}
        <div className="form-section">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>
          
          <div className="form-header">
            <div className="icon-circle">
              <FaLock className="lock-icon" />
            </div>
            <h2>Forgot Password?</h2>
            <p>Enter your email and we'll send you a link to reset your password</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email"
                className={error ? 'error' : ''}
              />
              {error && <span className="error-message">{error}</span>}
              {success && <span className="success-message">{success}</span>}
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          
          <div className="login-link">
            Remember your password? <a href="/login">Sign In</a>
          </div>
        </div>
        
        {/* Right Section - Illustration */}
        <div className="illustration-section">
          <div className="illustration-content">
            <h2>Having trouble?</h2>
            <p>We're here to help you regain access to your account</p>
            
            <div className="tips">
              <div className="tip">
                <div className="tip-number">1</div>
                <p>Enter the email associated with your account</p>
              </div>
              <div className="tip">
                <div className="tip-number">2</div>
                <p>Check your inbox for our password reset link</p>
              </div>
              <div className="tip">
                <div className="tip-number">3</div>
                <p>Follow the instructions to set a new password</p>
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

export default ForgotPassword;