import { createTheme, ThemeOptions } from '@mui/material/styles';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Define light theme options
export const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#2C4F7C',
      light: '#4E6D94',
      dark: '#1A3359',
    },
    secondary: {
      main: '#7D6E2A',
      light: '#9F8C3F',
      dark: '#5D501F',
    },
    background: {
      default: '#FAFAFA',
      paper: '#F8F9FB',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
    success: {
      main: '#2e7d32',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    allVariants: { letterSpacing: '0.3px' },
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #2C4F7C 0%, #425F85 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 1px 3px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(90deg, #2C4F7C 0%, #3A5E86 100%)',
          color: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0px 2px 6px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          margin: '4px 0',
          overflow: 'hidden',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: 'rgba(44, 79, 124, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(44, 79, 124, 0.12)',
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '8px 0',
        },
      },
    },
  },
};

// Define dark theme options
export const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#4E6D94',
      light: '#6886AB',
      dark: '#3A5E86',
    },
    secondary: {
      main: '#9F8C3F',
      light: '#B09E56',
      dark: '#7D6E2A',
    },
    background: {
      default: '#12141D',
      paper: '#1D2029',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#29b6f6',
    },
    success: {
      main: '#66bb6a',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    allVariants: { letterSpacing: '0.3px' },
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #1D2029 0%, #272B38 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 1px 3px rgba(0,0,0,0.25)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          margin: '4px 0',
          overflow: 'hidden',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: 'rgba(78, 109, 148, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(78, 109, 148, 0.25)',
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '8px 0',
        },
      },
    },
  },
};

// Create the light and dark themes
export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);

// Export default theme (light)
export default lightTheme; 