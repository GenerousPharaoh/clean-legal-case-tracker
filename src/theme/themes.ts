import { createTheme, responsiveFontSizes, Theme, alpha } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';

declare module '@mui/material/styles' {
  interface Palette {
    customColors?: {
      activeBackground: string;
      successLight: string;
      errorLight: string;
      warningLight: string;
      infoLight: string;
      highlightBackground: string;
      buttonHover: string;
      dividerStrong: string;
    };
  }
  
  interface PaletteOptions {
    customColors?: {
      activeBackground: string;
      successLight: string;
      errorLight: string;
      warningLight: string;
      infoLight: string;
      highlightBackground: string;
      buttonHover: string;
      dividerStrong: string;
    };
  }
}

// Common theme settings shared between light and dark mode
const baseTheme = createTheme({
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        sizeSmall: {
          padding: '4px 12px',
        },
        sizeMedium: {
          padding: '6px 16px',
        },
        sizeLarge: {
          padding: '8px 22px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px 0 rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 16,
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '8px 24px 20px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '8px 16px 16px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: '0.75rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        elevation4: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

// Light theme settings
export const lightTheme: Theme = responsiveFontSizes(
  createTheme(
    deepmerge(baseTheme, {
      palette: {
        mode: 'light',
        primary: {
          main: '#1976d2',
          light: '#42a5f5',
          dark: '#1565c0',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#9c27b0',
          light: '#ba68c8',
          dark: '#7b1fa2',
          contrastText: '#ffffff',
        },
        success: {
          main: '#2e7d32',
          light: '#4caf50',
          dark: '#1b5e20',
        },
        info: {
          main: '#0288d1',
          light: '#03a9f4',
          dark: '#01579b',
        },
        warning: {
          main: '#ed6c02',
          light: '#ff9800',
          dark: '#e65100',
        },
        error: {
          main: '#d32f2f',
          light: '#ef5350',
          dark: '#c62828',
        },
        background: {
          default: '#f5f7fa',
          paper: '#ffffff',
        },
        text: {
          primary: '#1f2937',
          secondary: '#6b7280',
          disabled: '#9ca3af',
        },
        divider: 'rgba(0, 0, 0, 0.12)',
        action: {
          active: 'rgba(0, 0, 0, 0.54)',
          hover: 'rgba(0, 0, 0, 0.04)',
          hoverOpacity: 0.04,
          selected: 'rgba(0, 0, 0, 0.08)',
          selectedOpacity: 0.08,
          disabled: 'rgba(0, 0, 0, 0.26)',
          disabledBackground: 'rgba(0, 0, 0, 0.12)',
          focus: 'rgba(0, 0, 0, 0.12)',
          focusOpacity: 0.12,
          activatedOpacity: 0.12,
        },
        customColors: {
          activeBackground: 'rgba(25, 118, 210, 0.08)',
          successLight: 'rgba(46, 125, 50, 0.1)',
          errorLight: 'rgba(211, 47, 47, 0.1)',
          warningLight: 'rgba(237, 108, 2, 0.1)',
          infoLight: 'rgba(2, 136, 209, 0.1)',
          highlightBackground: 'rgba(255, 247, 231, 1)',
          buttonHover: 'rgba(0, 0, 0, 0.05)',
          dividerStrong: 'rgba(0, 0, 0, 0.2)',
        },
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: '#ffffff',
              color: '#1f2937',
            },
          },
        },
      },
    })
  )
);

// Dark theme settings - Improved for better readability and aesthetics
export const darkTheme: Theme = responsiveFontSizes(
  createTheme(
    deepmerge(baseTheme, {
      palette: {
        mode: 'dark',
        primary: {
          main: '#4dabf5', // Brighter and more visible blue
          light: '#81d4fa',
          dark: '#2196f3',
          contrastText: '#121212',
        },
        secondary: {
          main: '#ce93d8',
          light: '#e1bee7',
          dark: '#ab47bc',
          contrastText: '#121212',
        },
        success: {
          main: '#66bb6a',
          light: '#81c784',
          dark: '#43a047',
        },
        info: {
          main: '#29b6f6',
          light: '#4fc3f7',
          dark: '#0288d1',
        },
        warning: {
          main: '#ffa726',
          light: '#ffb74d',
          dark: '#f57c00',
        },
        error: {
          main: '#f44336',
          light: '#e57373',
          dark: '#d32f2f',
        },
        background: {
          default: '#121212', // Slightly lighter than pure black for better contrast
          paper: '#1e1e1e',   // Dark but not too dark for readability
        },
        text: {
          primary: '#ffffff',  // Pure white for primary text - maximum readability
          secondary: '#b0bec5', // Lighter secondary text for better visibility
          disabled: '#78909c',
        },
        divider: 'rgba(255, 255, 255, 0.15)', // Slightly more visible dividers
        action: {
          active: 'rgba(255, 255, 255, 0.8)', // More visible active elements
          hover: 'rgba(255, 255, 255, 0.1)',  // Subtle but noticeable hover
          hoverOpacity: 0.1,
          selected: 'rgba(255, 255, 255, 0.2)', // More visible selections
          selectedOpacity: 0.2,
          disabled: 'rgba(255, 255, 255, 0.4)', // More visible disabled elements
          disabledBackground: 'rgba(255, 255, 255, 0.15)',
          focus: 'rgba(255, 255, 255, 0.15)',
          focusOpacity: 0.15,
          activatedOpacity: 0.24,
        },
        customColors: {
          activeBackground: 'rgba(77, 171, 245, 0.2)', // More visible active background
          successLight: 'rgba(102, 187, 106, 0.2)',
          errorLight: 'rgba(244, 67, 54, 0.2)',
          warningLight: 'rgba(255, 167, 38, 0.2)',
          infoLight: 'rgba(41, 182, 246, 0.2)',
          highlightBackground: 'rgba(41, 98, 155, 0.2)', // Clearer highlight
          buttonHover: 'rgba(255, 255, 255, 0.1)',
          dividerStrong: 'rgba(255, 255, 255, 0.25)', // More visible dividers
        },
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: '#1e1e1e',
              color: '#ffffff',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)', // Stronger shadow for better visibility
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.3)', // Better shadows for depth
            },
            elevation1: {
              boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
            },
            elevation2: {
              boxShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.4)',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.925rem', // Slightly larger text for better readability
            },
            head: {
              fontWeight: 600, // Bolder headers
              color: '#ffffff', // Ensure headers are clearly visible
            },
          },
        },
        MuiTypography: {
          styleOverrides: {
            root: {
              letterSpacing: '0.015em', // Slightly increased letter spacing for better readability
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)', // Stronger shadow for dialogs
              backgroundColor: '#1e1e1e', // Consistent with paper color
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            notchedOutline: {
              borderColor: 'rgba(255, 255, 255, 0.3)', // More visible borders
            },
            root: {
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)', // Better hover effect
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4dabf5', // Primary color for focused inputs
              },
              caretColor: '#4dabf5', // More visible text cursor
            },
            input: {
              color: '#ffffff', // Ensure input text is clearly visible
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              color: '#b0bec5', // More visible labels
              '&.Mui-focused': {
                color: '#4dabf5', // Primary color for focused labels
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            contained: {
              boxShadow: '0 2px 5px 0 rgba(0, 0, 0, 0.3)', // Better shadow for buttons
            },
            outlined: {
              borderColor: 'rgba(255, 255, 255, 0.3)', // More visible button borders
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)', // Better hover effect
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            },
            text: {
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)', // Better hover effect
              },
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)', // Better hover effect
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(77, 171, 245, 0.16)', // More visible selected item
                '&:hover': {
                  backgroundColor: 'rgba(77, 171, 245, 0.24)',
                },
              },
            },
          },
        },
        MuiListItem: {
          styleOverrides: {
            root: {
              '&.Mui-selected': {
                backgroundColor: 'rgba(77, 171, 245, 0.16)', // More visible selected item
                '&:hover': {
                  backgroundColor: 'rgba(77, 171, 245, 0.24)',
                },
              },
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              backgroundColor: '#4dabf5', // Ensure indicator is visible
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              color: '#b0bec5', // Better default tab color
              '&.Mui-selected': {
                color: '#ffffff', // Ensure selected tab is clearly visible
              },
            },
          },
        },
      },
    })
  )
);

export default { lightTheme, darkTheme };