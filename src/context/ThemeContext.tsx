import { createContext, useState, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '../theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleThemeMode: () => {},
  setThemeMode: () => {},
});

// Theme provider component that will wrap the app
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize theme mode from localStorage or system preference
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check if theme preference is stored
    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
    
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      return savedMode;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light mode
    return 'light';
  });

  // Listen for system theme preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if the user hasn't set a preference
      if (!localStorage.getItem('themeMode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    return undefined;
  }, []);

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    
    // Update HTML element with data-theme attribute for global CSS selectors
    document.documentElement.setAttribute('data-theme', mode);
    
    // Update body background immediately for smoother transitions
    document.body.style.backgroundColor = 
      mode === 'dark' ? '#121212' : '#f5f5f5';
      
  }, [mode]);

  // Theme toggler function
  const toggleThemeMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  // Set specific theme mode
  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  // Memoize theme to prevent unnecessary recreations
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Context value
  const contextValue = {
    mode,
    toggleThemeMode,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useThemeContext = () => useContext(ThemeContext);

export default ThemeProvider;