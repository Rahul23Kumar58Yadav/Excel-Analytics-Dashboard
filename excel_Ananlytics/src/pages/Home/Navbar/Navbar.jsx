import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../../components/context/AuthContext';
import { useTheme } from '../../../components/context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  const handleAdminDashboard = () => {
    navigate('/admin/dashboard');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-icon">📊</span>
          <h1>Excel Analytics</h1>
        </div>
        
        <nav className="main-nav">
          <div className="nav-links">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/analyze" className="nav-link">Analyze</Link>
            <Link to="/upload" className="nav-link">Upload</Link>
          </div>
          
          <div className="nav-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            <div className="user-menu">
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                    <button
                      className="admin-btn"
                      onClick={handleAdminDashboard}
                      title="Admin Dashboard"
                    >
                      <FiSettings />
                    </button>
                  )}
                  <div className="user-info">
                    <span className="user-avatar">
                      <FiUser />
                    </span>
                    <span className="user-name">
                      Hello, {user?.name || 'User'}
                    </span>
                  </div>
                  <button 
                    className="logout-btn" 
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <FiLogOut />
                  </button>
                </>
              ) : (
                <div className="auth-links">
                  <Link to="/auth/login" className="auth-link">
                    Sign In
                  </Link>
                  <Link to="/auth/register" className="auth-link register">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;