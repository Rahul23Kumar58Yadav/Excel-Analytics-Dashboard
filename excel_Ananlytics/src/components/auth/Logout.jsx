import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaSpinner } from 'react-icons/fa';
import './Logout.css';

const Logout = () => {
  const { logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      await logout();
      // Redirect after logout completes
      navigate('/login');
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div className="logout-container">
      <div className="logout-content">
        {loading ? (
          <>
            <FaSpinner className="spinner-icon" />
            <h2>Logging out...</h2>
          </>
        ) : (
          <>
            <FaSignOutAlt className="logout-icon" />
            <h2>You have been logged out</h2>
            <p>Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Logout;