import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  FiHome, FiPieChart, FiUpload, FiFile, FiSettings,
  FiChevronLeft, FiChevronRight, FiMoon, FiSun, FiUser,
  FiUsers, FiBarChart, FiFolder, FiShield
} from 'react-icons/fi';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../components/context/ThemeContext';
import { useAuth } from '../components/context/AuthContext';
import PropTypes from 'prop-types';
import './SideBar.css';

// Navigation items for regular users
const USER_NAV_ITEMS = [
  { path: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
  { path: '/analysis', icon: <FiPieChart />, label: 'Analyze Data' },
  { path: '/upload', icon: <FiUpload />, label: 'Upload Files' },
  { path: '/report-generation', icon: <FiFile />, label: 'Reports' },
  { path: '/settings', icon: <FiSettings />, label: 'Settings' }
];

// Navigation items for admin users
const ADMIN_NAV_ITEMS = [
  { path: '/admin', icon: <FiHome />, label: 'Dashboard' },
  { path: '/admin/users', icon: <FiUsers />, label: 'User Management' },
  { path: '/admin/files', icon: <FiFolder />, label: 'File Management' },
  { path: '/admin/system', icon: <FiBarChart />, label: 'System Analytics' },
  { path: '/admin/settings', icon: <FiSettings />, label: 'Settings' }
];

const STORAGE_TOTAL = 1000;

const SideBar = ({ isMobile, sidebarOpen, setSidebarOpen, onCollapseChange }) => {
  const { darkMode, toggleTheme } = useTheme();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const activeTab = location.pathname;

  // Use isAdmin directly from useAuth
  const userIsAdmin = isAdmin; // Simplified: isAdmin is a boolean from AuthContext

  // Select appropriate navigation items based on user role
  const navItems = userIsAdmin ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS;

  // Determine logo text based on user role and collapsed state
  const getLogoText = () => {
    if (collapsed) {
      return userIsAdmin ? 'EA' : 'EA';
    }
    return userIsAdmin ? 'Excel Analytics Admin' : 'Excel Analytics';
  };

  // Notify parent when collapse state changes
  useEffect(() => {
    if (onCollapseChange && !isMobile) {
      onCollapseChange(collapsed);
    }
  }, [collapsed, onCollapseChange, isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (!mobile) setSidebarOpen(false);
      if (mobile && collapsed) {
        setCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen, collapsed]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  }, [isMobile, setSidebarOpen]);

  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  // Get appropriate CSS classes based on user role
  const getSidebarClasses = () => {
    let classes = `sidebar ${darkMode ? 'dark-mode' : ''} ${collapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`;
    if (userIsAdmin) {
      classes += ' admin-sidebar';
    }
    return classes;
  };

  return (
    <>
      <aside
        className={getSidebarClasses()}
        role="navigation"
        aria-label="Main navigation"
      >
        <SidebarHeader
          collapsed={isMobile ? false : collapsed}
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
          isAdmin={userIsAdmin}
          logoText={getLogoText()}
        />
        <SidebarNav
          items={navItems}
          activeTab={activeTab}
          collapsed={isMobile ? false : collapsed}
          onNavClick={handleNavClick}
          isAdmin={userIsAdmin}
        />
        <SidebarFooter
          toggleDarkMode={toggleTheme}
          darkMode={darkMode}
          collapsed={isMobile ? false : collapsed}
          user={user}
          loading={authLoading || false}
          storageTotal={STORAGE_TOTAL}
          isAdmin={userIsAdmin}
        />
      </aside>
    </>
  );
};

SideBar.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
  onCollapseChange: PropTypes.func
};

const SidebarHeader = ({ collapsed, toggleSidebar, isMobile, isAdmin, logoText }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleSidebar();
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <div className={`sidebar-header ${isAdmin ? 'admin-header' : ''}`}>
      <div
        className="logo"
        onClick={handleToggle}
        role="button"
        tabIndex="0"
        onKeyPress={(e) => e.key === 'Enter' && handleToggle()}
      >
        {collapsed && !isMobile ? (
          <FiChevronRight className={`logo-icon ${isAnimating ? 'icon-anim' : ''}`} />
        ) : (
          <>
            {isAdmin ? (
              <FiShield className={`logo-icon ${isAdmin ? 'admin-icon' : ''}`} />
            ) : (
              <FiPieChart className="logo-icon" />
            )}
            <span className={isAdmin ? 'admin-logo-text' : ''}>{logoText}</span>
          </>
        )}
      </div>
      {!isMobile && (
        <button
          className={`sidebar-toggle ${isAnimating ? 'pulse' : ''} ${isAdmin ? 'admin-toggle' : ''}`}
          onClick={handleToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          {collapsed ? (
            <FiChevronRight className={`toggle-icon ${isAnimating ? 'icon-anim' : ''}`} />
          ) : (
            <FiChevronLeft className={`toggle-icon ${isAnimating ? 'icon-anim' : ''}`} />
          )}
        </button>
      )}
    </div>
  );
};

SidebarHeader.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  logoText: PropTypes.string.isRequired
};

const SidebarNav = ({ items, activeTab, collapsed, onNavClick, isAdmin }) => (
  <nav className={`sidebar-nav ${isAdmin ? 'admin-nav' : ''}`} aria-label="Sidebar navigation">
    <ul>
      {items.map((item, index) => (
        <SidebarNavItem
          key={item.path}
          path={item.path}
          icon={item.icon}
          label={item.label}
          isActive={activeTab === item.path || (item.path === '/admin' && activeTab.startsWith('/admin') && activeTab.split('/').length === 2)}
          collapsed={collapsed}
          index={index}
          onClick={onNavClick}
          isAdmin={isAdmin}
        />
      ))}
    </ul>
  </nav>
);

SidebarNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string,
      icon: PropTypes.element,
      label: PropTypes.string
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  collapsed: PropTypes.bool.isRequired,
  onNavClick: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

const SidebarNavItem = memo(({ path, icon, label, isActive, collapsed, index, onClick, isAdmin }) => (
  <li style={{ '--i': index }} className={`nav-item-wrapper ${isAdmin ? 'admin-nav-item' : ''}`}>
    <NavLink
      to={path}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isAdmin ? 'admin-item' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? label : undefined}
    >
      <span className={`nav-icon ${isAdmin ? 'admin-icon' : ''}`}>{icon}</span>
      {!collapsed && <span className={`nav-label ${isAdmin ? 'admin-label' : ''}`}>{label}</span>}
      {!collapsed && isActive && (
        <div className={`active-indicator ${isAdmin ? 'admin-indicator' : ''}`} />
      )}
    </NavLink>
  </li>
));

SidebarNavItem.propTypes = {
  path: PropTypes.string.isRequired,
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  collapsed: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

const SidebarFooter = ({
  darkMode,
  toggleDarkMode,
  collapsed,
  user = null,
  loading = false,
  storageTotal,
  isAdmin
}) => {
  const storageUsed = 156; // MB (Replace with dynamic value if available)
  const username = loading ? 'Loading...' : user?.name || 'Guest';
  const userEmail = loading ? 'Loading...' : user?.email || 'guest@example.com';
  const userRole = isAdmin ? 'Administrator' : 'User';

  const calculateStoragePercentage = () => {
    if (!storageTotal || storageTotal <= 0) return 0;
    const percentage = (storageUsed / storageTotal) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const storagePercentage = calculateStoragePercentage();

  return (
    <div className={`sidebar-footer ${isAdmin ? 'admin-footer' : ''}`}>
      {!collapsed && (
        <div className={`storage-meter ${isAdmin ? 'admin-storage' : ''}`}>
          <div className="storage-info">
            <span>
              {isAdmin
                ? `System Storage: ${storageUsed}MB of ${storageTotal}MB`
                : `Storage: ${storageUsed}MB of ${storageTotal}MB`
              }
            </span>
            <span>{Math.round(storagePercentage)}%</span>
          </div>
          <div className="meter-bar">
            <div
              className={`meter-fill ${isAdmin ? 'admin-meter-fill' : ''}`}
              style={{
                width: `${storagePercentage}%`,
                backgroundColor: isAdmin
                  ? (darkMode ? '#f59e0b' : '#d97706') // Orange for admin
                  : (darkMode ? '#818cf8' : '#6366f1') // Blue for user
              }}
            />
          </div>
          <button
            className={`theme-toggle ${isAdmin ? 'admin-theme-toggle' : ''}`}
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            type="button"
          >
            {darkMode ? <FiSun /> : <FiMoon />}
          </button>
        </div>
      )}
      <div className={`user-profile ${isAdmin ? 'admin-user-profile' : ''}`}>
        <div className={`user-avatar ${isAdmin ? 'admin-avatar' : ''}`} aria-hidden="true">
          {isAdmin ? <FiShield /> : <FiUser />}
        </div>
        {!collapsed && (
          <div className="user-info">
            <span className={`username ${isAdmin ? 'admin-username' : ''}`}>
              {username}
            </span>
            <span className={`user-email ${isAdmin ? 'admin-user-email' : ''}`}>
              {userEmail}
            </span>
            <span className={`user-role ${isAdmin ? 'admin-user-role' : ''}`}>
              {userRole}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

SidebarFooter.propTypes = {
  darkMode: PropTypes.bool.isRequired,
  toggleDarkMode: PropTypes.func.isRequired,
  collapsed: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string
  }),
  loading: PropTypes.bool,
  storageTotal: PropTypes.number.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

export default SideBar;