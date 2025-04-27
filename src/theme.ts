import { createTheme, responsiveFontSizes, Theme, PaletteOptions } from '@mui/material/styles';
import { blue, grey, blueGrey } from '@mui/material/colors';

// Define color palettes for light and dark modes
const getLightPalette = (): PaletteOptions => ({
  mode: 'light',
  primary: {
    main: blue[700],
    light: blue[500],
    dark: blue[800],
    contrastText: '#ffffff',
  },
  secondary: {
    main: blueGrey[600],
    light: blueGrey[400],
    dark: blueGrey[800],
    contrastText: '#ffffff',
  },
  background: {
    default: grey[50],
    paper: '#ffffff',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
  },
});

const getDarkPalette = (): PaletteOptions => ({
  mode: 'dark',
  primary: {
    main: blue[500],
    light: blue[300],
    dark: blue[700],
    contrastText: '#ffffff',
  },
  secondary: {
    main: blueGrey[400],
    light: blueGrey[300],
    dark: blueGrey[600],
    contrastText: '#ffffff',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
  },
  info: {
    main: '#29b6f6',
    light: '#4fc3f7',
    dark: '#0288d1',
  },
  success: {
    main: '#66bb6a',
    light: '#81c784',
    dark: '#388e3c',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
  },
});

// Create theme function that generates for either light or dark mode
export const createAppTheme = (mode: 'light' | 'dark'): Theme => {
  const palette = mode === 'light' ? getLightPalette() : getDarkPalette();
  
  let theme = createTheme({
    palette,
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.2rem',
        fontWeight: 500,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '1.8rem',
        fontWeight: 500,
        lineHeight: 1.2,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 500,
        lineHeight: 1.2,
      },
      h4: {
        fontSize: '1.3rem',
        fontWeight: 500,
        lineHeight: 1.2,
      },
      h5: {
        fontSize: '1.1rem',
        fontWeight: 500,
        lineHeight: 1.2,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.2,
      },
      body1: {
        fontSize: '0.9rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
    transitions: {
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
    },
    components: {
      // Add standardized global styles
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          '*, *::before, *::after': {
            boxSizing: 'border-box',
            transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
          body: {
            scrollBehavior: 'smooth',
            margin: 0,
            padding: 0,
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            transition: 'background-color 350ms ease',
          },
          // Standardize scrollbars for consistent look
          '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.05)',
          },
          '::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(0, 0, 0, 0.3)',
          },
        }),
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: 8,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          contained: {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px'
            }
          },
          sizeSmall: {
            padding: '4px 12px',
            fontSize: '0.8125rem',
          },
          sizeMedium: {
            padding: '6px 16px',
            fontSize: '0.875rem',
          },
          sizeLarge: {
            padding: '8px 22px',
            fontSize: '0.9375rem',
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.04)' 
                : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 12,
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
          elevation0: {
            boxShadow: 'none',
          },
          elevation1: {
            boxShadow: mode === 'dark'
              ? '0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.04)',
          },
          elevation2: {
            boxShadow: mode === 'dark'
              ? '0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1)'
              : '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05)',
          },
          elevation3: {
            boxShadow: mode === 'dark'
              ? '0 3px 6px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)'
              : '0 3px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)',
          },
          elevation4: {
            boxShadow: mode === 'dark'
              ? '0 4px 8px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)'
              : '0 4px 8px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)',
          },
          elevation6: {
            boxShadow: mode === 'dark'
              ? '0 6px 12px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.1)'
              : '0 6px 12px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            margin: '2px 0',
            transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&.Mui-selected': {
              backgroundColor: mode === 'dark' ? 'rgba(30, 144, 255, 0.15)' : blue[50],
              '&:hover': {
                backgroundColor: mode === 'dark' ? 'rgba(30, 144, 255, 0.25)' : blue[100],
              },
            },
            '&:hover': {
              backgroundColor: mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: 8,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: mode === 'dark' ? blue[300] : blue[400],
                borderWidth: '1.5px',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
              '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                borderColor: '#d32f2f',
              },
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.875rem',
            },
            '& .MuiInputBase-input': {
              fontSize: '0.875rem',
              padding: '12px 14px',
            },
            '& .MuiOutlinedInput-input': {
              padding: '12px 14px',
            },
            '&.MuiTextField-sizeSmall .MuiOutlinedInput-input': {
              padding: '8px 12px',
              fontSize: '0.8125rem',
            },
            '&.MuiTextField-sizeSmall .MuiInputLabel-root': {
              fontSize: '0.8125rem',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0 1px 3px rgba(0, 0, 0, 0.2)'
                : '0 1px 2px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.75rem',
            backgroundColor: mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.9)' 
              : 'rgba(33, 33, 33, 0.9)',
            color: mode === 'dark' ? 'rgba(0, 0, 0, 0.87)' : '#fff',
            padding: '8px 12px',
            backdropFilter: 'blur(4px)',
            borderRadius: 6,
          },
          arrow: {
            color: mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.9)' 
              : 'rgba(33, 33, 33, 0.9)',
          },
        },
        defaultProps: {
          arrow: true,
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'dark'
              ? '0 1px 3px rgba(0, 0, 0, 0.2)'
              : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.04)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            boxShadow: mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 24px rgba(0, 0, 0, 0.15)',
            borderRadius: 12,
            overflow: 'hidden',
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(0, 0, 0, 0.06)',
            '&::after': {
              backgroundImage: mode === 'dark'
                ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.04), transparent)',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: mode === 'dark'
              ? '0 1px 3px rgba(0, 0, 0, 0.2)'
              : '0 1px 3px rgba(0, 0, 0, 0.08)',
          },
          standardSuccess: {
            backgroundColor: mode === 'dark' 
              ? 'rgba(76, 175, 80, 0.15)' 
              : 'rgba(46, 125, 50, 0.08)',
            color: mode === 'dark' ? '#81c784' : '#1e4620',
          },
          standardError: {
            backgroundColor: mode === 'dark' 
              ? 'rgba(244, 67, 54, 0.15)' 
              : 'rgba(211, 47, 47, 0.08)',
            color: mode === 'dark' ? '#e57373' : '#ab2121',
          },
          standardWarning: {
            backgroundColor: mode === 'dark' 
              ? 'rgba(255, 152, 0, 0.15)' 
              : 'rgba(237, 108, 2, 0.08)',
            color: mode === 'dark' ? '#ffb74d' : '#bd5d05',
          },
          standardInfo: {
            backgroundColor: mode === 'dark' 
              ? 'rgba(41, 182, 246, 0.15)' 
              : 'rgba(2, 136, 209, 0.08)',
            color: mode === 'dark' ? '#4fc3f7' : '#01579b',
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiSnackbarContent-root': {
              boxShadow: mode === 'dark'
                ? '0 3px 10px rgba(0, 0, 0, 0.4)'
                : '0 3px 10px rgba(0, 0, 0, 0.2)',
              borderRadius: 8,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            '& .MuiTabs-indicator': {
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
  });

  // Make fonts responsive
  theme = responsiveFontSizes(theme);
  
  return theme;
};

// For backward compatibility, export a default light theme
const theme = createAppTheme('light');
export default theme;