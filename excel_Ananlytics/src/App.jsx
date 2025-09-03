import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Navbar from './pages/Home/Navbar/Navbar';
import Analyze from './pages/Analyze';
import Dashboard from './components/Dashboard/DashBoard';
import Home from './pages/Home/Home';
import FileUploader from './components/FileUploader';
import RecentFiles from './pages/RecentFiles';
import AllFiles from './pages/AllFiles';
import Settings from './pages/Setting';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import GoogleAuthButton from './components/context/GoogleAuthButton';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AnalysisPage from './components/Dashboard/AnalysisPage';
import ReportGenerationPage from './components/Dashboard/ReportGenerationPage';
import ChartCreationPage from './components/Dashboard/ChartCreationPage';
import PopularCharts from './pages/PopularCharts';
import ViewAllCharts from './pages/ViewAllChart';
import Logout from './components/auth/LogOut';
import { useAuth } from './components/context/AuthContext';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './NotFoundPage';
import Footer from './pages/Footer';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import FileManagement from './components/admin/FileManagement';
import SystemAnalytics from './components/admin/SystemAnalytics';
import AdminSettings from './components/admin/AdminSettings';
import { useTheme } from './components/context/ThemeContext';
import './App.css';

const App = () => {
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot', '/auth/logout', '/auth/google'];
    const isAuthRoute = authRoutes.some((route) => location.pathname.startsWith(route));
    if (!isAuthenticated && !isAuthRoute) {
      navigate('/auth/login', { replace: true, state: { from: location.pathname } });
    }
  }, [navigate, location.pathname, isAuthenticated]);

  const isAuthPage = location.pathname.startsWith('/auth');

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      {!isAuthPage && <Navbar />}
      <main className={`app-main ${!isAuthPage ? 'with-navbar' : ''}`}>
        <Routes>
          <Route path="/auth">
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot" element={<ForgotPassword />} />
            <Route path="logout" element={<Logout />} />
            <Route
              path="google"
              element={
                <div className="auth-page">
                  <GoogleAuthButton
                    onSuccess={() => navigate('/dashboard')}
                    onError={(error) => console.error('Google auth error:', error)}
                  />
                  <p>You'll be redirected to your dashboard after authentication</p>
                </div>
              }
            />
          </Route>

          <Route element={<ProtectedRoute roles={['user', 'admin']} />}>
            <Route path="/" element={<Home />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="analyze" element={<Analyze />} />
              <Route path="settings" element={<Settings />} />
              <Route
                path="upload"
                element={
                  <FileUploader
                    onUploadSuccess={(data) => navigate('/dashboard', { state: { fileData: data } })}
                  />
                }
              />
              <Route path="all-files" element={<AllFiles />} />
              <Route path="chartfiles" element={<ViewAllCharts />} />
              <Route path="analysis" element={<AnalysisPage />} />
              <Route path="report-generation" element={<ReportGenerationPage />} />
              <Route path="chart-creation" element={<ChartCreationPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="charts" element={<PopularCharts />} />
              <Route path="recent" element={<RecentFiles />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} redirectUnauthorized="/dashboard" />}>
            <Route path="/admin" element={<Home />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="files" element={<FileManagement />} />
              <Route path="system" element={<SystemAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
      {(isAuthPage || location.pathname === '/404') && <Footer />}
    </div>
  );
};

export default App;