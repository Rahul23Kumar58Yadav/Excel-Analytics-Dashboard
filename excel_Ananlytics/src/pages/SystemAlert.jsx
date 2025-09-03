import React from 'react';
import PropTypes from 'prop-types';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import './SystemAlert.css';

const SystemAlert = ({ message, details, action, variant = 'warning', onDismiss }) => {
  return (
    <div className={`system-alert ${variant}`}>
      <div className="alert-content">
        <FiAlertCircle className="alert-icon" />
        <div className="alert-text">
          <h3 className="alert-title">{message}</h3>
          <p className="alert-details">{details}</p>
        </div>
      </div>
      <div className="alert-actions">
        {action && (
          <button 
            className="alert-action"
            onClick={() => console.log('Upgrade action')}
          >
            {action}
          </button>
        )}
        <button 
          className="alert-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          <FiX />
        </button>
      </div>
    </div>
  );
};

SystemAlert.propTypes = {
  message: PropTypes.string.isRequired,
  details: PropTypes.string.isRequired,
  action: PropTypes.string,
  variant: PropTypes.oneOf(['warning', 'danger', 'info']),
  onDismiss: PropTypes.func
};

export default SystemAlert;