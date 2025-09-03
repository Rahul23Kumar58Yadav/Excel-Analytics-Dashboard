import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { ThemeContext } from '../App';
import './QuickActions.css';

const QuickActions = ({ actions }) => {
  const { darkMode } = useContext(ThemeContext);

  const handleAction = (action) => {
    console.log('Executing action:', action?.title);
    if (typeof action?.action === 'function') {
      try {
        action.action();
      } catch (error) {
        console.error('Navigation error:', error);
      }
    } else {
      console.error('Invalid action:', action);
    }
  };

  return (
    <div className={`quick-actions ${darkMode ? 'dark' : 'light'}`}>
      <h2 className="section-title">Quick Actions</h2>
      <div className="actions-grid">
        {actions?.map((action, index) => (
          <button
            key={`action-${index}`}
            className={`action-card ${darkMode ? 'dark' : 'light'}`}
            onClick={() => handleAction(action)}
            aria-label={action.title}
          >
            <div className="action-icon">{action.icon}</div>
            <span className="action-title">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

QuickActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.element.isRequired,
      title: PropTypes.string.isRequired,
      action: PropTypes.func.isRequired,
    })
  ),
};

QuickActions.defaultProps = {
  actions: [],
};

export default QuickActions;