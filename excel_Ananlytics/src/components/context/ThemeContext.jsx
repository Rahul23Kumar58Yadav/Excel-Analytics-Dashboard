import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

// Create context with default value
const ThemeContext = createContext({
  darkMode: false,
  toggleTheme: () => {},
  isSystemDark: false,
});

/**
 * ThemeProvider component that manages dark/light theme state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {boolean} [props.defaultDark] - Default dark mode (optional)
 */
export const ThemeProvider = ({ children, defaultDark = false }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) return JSON.parse(savedMode);
    
    // Then check system preference
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return defaultDark ?? isSystemDark;
  });

  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      setIsSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const setTheme = (isDark) => {
    setDarkMode(isDark);
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    darkMode,
    toggleTheme,
    setTheme,
    isSystemDark,
  }), [darkMode, isSystemDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultDark: PropTypes.bool,
};

/**
 * Custom hook to access theme context
 * @returns {Object} Theme context with darkMode, toggleTheme, setTheme, and isSystemDark
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};