import React, { createContext, useState, useContext, useMemo, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, Theme, PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from './themes';

// Define the shape of our theme context
interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
  theme: Theme;
}

// Create our theme context with a default value
const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
  theme: lightTheme,
});

// Custom hook to use the theme context
export const useThemeContext = () => useContext(ThemeContext);

// Define props for the ThemeProvider component
interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: PaletteMode;
  localStorageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'light',
  localStorageKey = 'legalCaseTrackerColorMode',
}) => {
  // Try to get the mode from localStorage, fallback to defaultMode
  const getInitialMode = (): PaletteMode => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(localStorageKey);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
        return savedMode;
      }
      
      // If no saved preference, try to detect preferred color scheme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return defaultMode;
  };
  
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);
  
  // Update the theme whenever the mode changes
  const theme = useMemo(() => {
    return mode === 'light' ? lightTheme : darkTheme;
  }, [mode]);
  
  // Toggle between light and dark mode
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  // Store the mode preference in localStorage
  useEffect(() => {
    localStorage.setItem(localStorageKey, mode);
    
    // Update the document's body class for potential global styling
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(`${mode}-mode`);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        mode === 'light' ? theme.palette.primary.main : theme.palette.background.default
      );
    }
  }, [mode, localStorageKey, theme]);
  
  // Provide the theme context to all children
  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
      theme,
    }),
    [mode, theme]
  );
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;