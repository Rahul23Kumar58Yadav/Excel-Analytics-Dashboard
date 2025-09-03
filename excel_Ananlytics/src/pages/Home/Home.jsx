import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../components/context/AuthContext';
import SideBar from '../SideBar';
import Footer from '../Footer';
import './Home.css';

const Home = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarOpen(false);
        setSidebarCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarCollapseChange = useCallback((collapsed) => {
    if (!isMobile) {
      setSidebarCollapsed(collapsed);
    }
  }, [isMobile]);

  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebarOpen = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const getDashboardClasses = () => {
    let classes = 'dashboard-container';
    if (!isMobile && sidebarCollapsed) {
      classes += ' sidebar-collapsed';
    }
    if (isAdmin) { // Changed from isAdmin() to isAdmin
      classes += ' admin-dashboard';
    }
    return classes;
  };

  if (loading) {
    return (
      <div className="home-wrapper loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`home-wrapper ${isAdmin ? 'admin-mode' : 'user-mode'}`}> 
      <SideBar
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onCollapseChange={handleSidebarCollapseChange}
      />
      {isMobile && sidebarOpen && (
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={handleOverlayClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && handleOverlayClick()}
          aria-label="Close sidebar"
        />
      )}
      {isMobile && (
        <button
          className={`mobile-menu-toggle ${isAdmin ? 'admin-toggle' : ''}`} 
          onClick={toggleSidebarOpen}
          aria-label="Toggle sidebar menu"
          title="Open menu"
          type="button"
        >
          ☰
        </button>
      )}
      <main className={getDashboardClasses()} role="main">
        <div className="content-area">
          <div className="outlet-content">
            <Outlet />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Home;