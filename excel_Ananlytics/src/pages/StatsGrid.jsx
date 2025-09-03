import React, { useState } from 'react';
import PropTypes from 'prop-types';

export const StatsGrid = ({ stats }) => {
  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div className="stat-card" key={index}>
          <div className="stat-icon">{stat.icon}</div>
          <div className="stat-content">
            <h3 className="stat-title">{stat.title}</h3>
            <div className="stat-value-row">
              <p className="stat-value">{stat.value}</p>
              <span className={`stat-change ${stat.trend}`}>
                {stat.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

StatsGrid.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.element.isRequired,
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      change: PropTypes.string.isRequired,
      trend: PropTypes.oneOf(['up', 'down']).isRequired
    })
  ).isRequired
};