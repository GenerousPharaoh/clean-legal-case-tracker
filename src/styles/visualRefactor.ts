/**
 * Visual Audit & Aesthetic Refinement (Phase 14)
 * 
 * This file contains theme extensions and common style utilities for ensuring
 * visual consistency across the entire application.
 */

import { Theme } from '@mui/material/styles';

/**
 * Common spacing values to use throughout the application to maintain consistency
 * Always use these instead of hard-coded pixel values
 */
export const spacing = {
  // Use the MUI theme spacing function directly for most cases
  // These are just for special cases where theme spacing isn't directly accessible
  xs: 4,    // theme.spacing(0.5)
  sm: 8,    // theme.spacing(1)
  md: 16,   // theme.spacing(2)
  lg: 24,   // theme.spacing(3)
  xl: 32,   // theme.spacing(4)
  xxl: 40,  // theme.spacing(5)
};

/**
 * Common border radius values to use throughout the application
 */
export const borderRadius = {
  xs: 4,    // Small radius for subtle rounding
  sm: 6,    // Standard radius for most components (from theme)
  md: 8,    // Medium radius for cards, dialogs
  lg: 12,   // Large radius for floating components
  xl: 16,   // Extra large radius for special components
  round: '50%', // For completely round elements
};

/**
 * Common shadow values to use throughout the application
 */
export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

/**
 * Common transition values to use throughout the application
 * These are the same as in cssTransitions but with theme integration
 */
export const transitions = {
  ultraFast: 'all 100ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  medium: 'all 225ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * Consistent container styles for panels, cards, etc.
 */
export const containers = {
  panel: (theme: Theme) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: 0, // No border radius for panels
    boxShadow: theme.shadows[2],
    transition: transitions.medium,
  }),
  card: (theme: Theme) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    transition: transitions.fast,
    overflow: 'hidden',
    '&:hover': {
      boxShadow: theme.shadows[2],
    },
  }),
  dialog: (theme: Theme) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: borderRadius.md,
    boxShadow: theme.shadows[4],
    overflow: 'hidden',
  }),
};

/**
 * Common interactive states for components
 */
export const interactiveStates = {
  hover: (theme: Theme) => ({
    backgroundColor: theme.palette.action.hover,
    transition: transitions.fast,
  }),
  selected: (theme: Theme) => ({
    backgroundColor: theme.palette.action.selected,
    transition: transitions.fast,
  }),
  focused: (theme: Theme) => ({
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
    transition: transitions.fast,
  }),
  disabled: (theme: Theme) => ({
    opacity: 0.6,
    pointerEvents: 'none',
  }),
};

/**
 * Common typography styles for consistent text hierarchy
 */
export const typographyStyles = {
  panelTitle: (theme: Theme) => ({
    ...theme.typography.h6,
    fontWeight: 500,
    fontSize: '1.125rem',
  }),
  sectionHeading: (theme: Theme) => ({
    ...theme.typography.subtitle1,
    fontWeight: 500,
    fontSize: '1rem',
  }),
  cardTitle: (theme: Theme) => ({
    ...theme.typography.subtitle1,
    fontWeight: 500,
    lineHeight: 1.3,
  }),
  label: (theme: Theme) => ({
    ...theme.typography.body2,
    fontWeight: 500,
    color: theme.palette.text.secondary,
  }),
  caption: (theme: Theme) => ({
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
  }),
};

/**
 * Consistent button styles
 */
export const buttonStyles = {
  base: (theme: Theme) => ({
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: borderRadius.sm,
  }),
  icon: (theme: Theme) => ({
    minWidth: 'auto',
    padding: theme.spacing(1),
    borderRadius: borderRadius.sm,
  }),
};

/**
 * Loading state styles
 */
export const loadingStyles = {
  skeleton: (theme: Theme) => ({
    backgroundColor: theme.palette.mode === 'light' 
      ? 'rgba(0, 0, 0, 0.05)' 
      : 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.sm,
  }),
  skeletonPulse: (theme: Theme) => ({
    animation: `pulse 1.5s ease-in-out infinite`,
    '@keyframes pulse': {
      '0%': { opacity: 0.6 },
      '50%': { opacity: 0.8 },
      '100%': { opacity: 0.6 },
    },
  }),
};

/**
 * Empty state styles
 */
export const emptyStateStyles = {
  container: (theme: Theme) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: theme.spacing(3),
  }),
  icon: (theme: Theme) => ({
    fontSize: 48,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  }),
};

/**
 * Scrollbar styles
 */
export const scrollbarStyles = {
  thin: (theme: Theme) => ({
    '&::-webkit-scrollbar': {
      width: 6,
      height: 6,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: theme.palette.mode === 'light' 
        ? 'rgba(0, 0, 0, 0.05)' 
        : 'rgba(255, 255, 255, 0.05)',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.2)'
        : 'rgba(255, 255, 255, 0.2)',
      borderRadius: 3,
      '&:hover': {
        backgroundColor: theme.palette.mode === 'light'
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(255, 255, 255, 0.3)',
      },
    },
  }),
};

/**
 * Common animation keyframes
 */
export const animations = {
  fadeIn: {
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    animation: 'fadeIn 0.3s ease-in-out',
  },
  slideIn: {
    '@keyframes slideIn': {
      from: { transform: 'translateY(10px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    animation: 'slideIn 0.3s ease-in-out',
  },
  pulse: {
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)' },
    },
  },
};
