import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { auth, googleProvider } from './firebase'; // Verify this path
import { signInWithPopup } from 'firebase/auth';
import './GoogleAuthButton.css';
import { useNavigate } from 'react-router-dom';

const GoogleAuthButton = ({ onSuccess, onError, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("Signed in user:", user);
      if (onSuccess) onSuccess(user);
      navigate('/dashboard'); // Redirect after success
    } catch (error) {
      console.error("Google auth error:", error);
      if (onError) onError(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`google-auth-btn ${disabled || loading ? 'disabled' : ''}`}
      onClick={handleGoogleLogin}
      disabled={disabled || loading}
    >
      <FcGoogle className="google-icon" />
      <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
      {loading && <div className="google-spinner"></div>}
    </button>
  );
};

export default GoogleAuthButton;