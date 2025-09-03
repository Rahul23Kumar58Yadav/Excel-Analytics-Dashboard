import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium',
  variant = 'circle-rotate',
  color = 'primary',
  fullPage = false 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    danger: 'text-red-600',
    success: 'text-green-600',
    dark: 'text-gray-800',
    light: 'text-gray-300'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'circle-rotate':
        return (
          <div className={`spinner-circle-rotate ${sizeClasses[size]} ${colorClasses[color]}`}>
            <div className="spinner-circle"></div>
          </div>
        );
      case 'dots-pulse':
        return (
          <div className={`spinner-dots-pulse ${sizeClasses[size]} ${colorClasses[color]}`}>
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
          </div>
        );
      case 'bar-fade':
        return (
          <div className={`spinner-bar-fade ${sizeClasses[size]} ${colorClasses[color]}`}>
            <div className="spinner-bar"></div>
            <div className="spinner-bar"></div>
            <div className="spinner-bar"></div>
            <div className="spinner-bar"></div>
          </div>
        );
      case 'circle-dots':
        return (
          <div className={`spinner-circle-dots ${sizeClasses[size]} ${colorClasses[color]}`}>
            <div className="spinner-dot-circle"></div>
            <div className="spinner-dot-circle"></div>
            <div className="spinner-dot-circle"></div>
            <div className="spinner-dot-circle"></div>
          </div>
        );
      default:
        return (
          <div className={`spinner-circle-rotate ${sizeClasses[size]} ${colorClasses[color]}`}>
            <div className="spinner-circle"></div>
          </div>
        );
    }
  };

  return (
    <div className={`spinner-container ${fullPage ? 'full-page' : ''}`}>
      {renderSpinner()}
    </div>
  );
};

export default LoadingSpinner;