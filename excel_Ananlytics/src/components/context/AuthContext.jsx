import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Derive isAdmin from user role
  const isAdmin = user && user.role?.toLowerCase() === 'admin';

  // Update user data
  const updateUser = (updatedUser) => {
    setUser({
      ...updatedUser,
      role: updatedUser.role?.toLowerCase(), // Normalize role
    });
  };

  // Initialize authentication
  const initAuth = async () => {
    setLoading(true);
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      const response = await axios.get('http://localhost:5000/api/v1/auth/me', {
        timeout: 10000,
      });

      const userData = response.data?.data?.user;
      if (!userData || !userData.email || !userData.role) {
        throw new Error('Invalid user data received: missing required fields');
      }

      setUser({ ...userData, role: userData.role?.toLowerCase() }); // Normalize role
      setToken(storedToken);
      setIsAuthenticated(true);
      console.log('✅ Auth initialization successful:', { user: userData });
    } catch (error) {
      console.error('❌ Auth initialization error:', {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Sending login request:', {
        url: 'http://localhost:5000/api/v1/auth/login',
        payload: { email: email.trim(), password: '[REDACTED]' },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timestamp: new Date().toISOString(),
      });

      const response = await axios.post(
        'http://localhost:5000/api/v1/auth/login',
        { email: email.trim(), password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );

      const { token: newToken, data } = response.data;
      if (!newToken || !data?.user || !data.user.email || !data.user.role) {
        throw new Error('Invalid login response: missing token or user data');
      }

      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      setUser({ ...data.user, role: data.user.role?.toLowerCase() }); // Normalize role
      setToken(newToken);
      setIsAuthenticated(true);

      console.log('✅ Login successful:', { user: data.user });
      return { token: newToken, user: data.user };
    } catch (error) {
      console.error('❌ Login error:', {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });
      let errorMessage = 'Login failed. Please try again.';
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        switch (status) {
          case 400:
            errorMessage = serverMessage || 'Invalid login data';
            break;
          case 401:
            errorMessage = 'Invalid email or password';
            break;
          case 403:
            errorMessage = 'Account deactivated';
            break;
          case 429:
            errorMessage = 'Too many attempts';
            break;
          case 500:
            errorMessage = 'Server error';
            break;
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server on port 5000';
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password, passwordConfirm, role = 'user') => {
    setLoading(true);
    setError(null);

    try {
      console.log('📝 Sending registration request:', {
        url: 'http://localhost:5000/api/v1/auth/register',
        payload: { name: name.trim(), email: email.trim(), password: '[REDACTED]', passwordConfirm: '[REDACTED]', role },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timestamp: new Date().toISOString(),
      });

      const response = await axios.post(
        'http://localhost:5000/api/v1/auth/register',
        {
          name: name.trim(),
          email: email.trim(),
          password,
          passwordConfirm,
          role: role?.toLowerCase(), // Normalize role
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );

      const { token: newToken, data } = response.data;
      if (!newToken || !data?.user || !data.user.email || !data.user.role) {
        throw new Error('Invalid registration response: missing token or user data');
      }

      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      setUser({ ...data.user, role: data.user.role?.toLowerCase() }); // Normalize role
      setToken(newToken);
      setIsAuthenticated(true);

      console.log('✅ Registration successful:', { user: data.user });
      return { token: newToken, user: data.user };
    } catch (error) {
      console.error('❌ Registration error:', {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        switch (status) {
          case 400:
            errorMessage = serverMessage || 'Invalid registration data';
            break;
          case 409:
            errorMessage = 'Email already exists';
            break;
          case 422:
            errorMessage = 'Check your information';
            break;
          case 500:
            errorMessage = 'Server error';
            break;
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server on port 5000';
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);

    try {
      console.log('Attempting logout from http://localhost:5000/api/v1/auth/logout');
      await axios.post('http://localhost:5000/api/v1/auth/logout', {}, { timeout: 5000 });
    } catch (error) {
      console.error('❌ Logout API error:', {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('accountLock');
      localStorage.removeItem('loginAttempts');

      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);

      console.log('✅ Logout completed');
    }
  };

  // Initialize auth on app start
  useEffect(() => {
    initAuth();
  }, []);

  // Update isAuthenticated when user or token changes
  useEffect(() => {
    setIsAuthenticated(!!user && !!token);
  }, [user, token]);

  const contextValue = {
    user,
    loading,
    error,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    initAuth,
    updateUser,
    setError,
    isAdmin,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthContext;