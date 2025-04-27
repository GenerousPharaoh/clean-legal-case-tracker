/**
 * Theme Utility Functions
 * 
 * Consistent spacing and styling utilities to be used across components
 * for a uniform appearance throughout the application.
 */

import { Theme } from '@mui/material/styles';

/**
 * Get standardized spacing between components based on size
 * @param theme MUI theme
 * @param size The size category (xxs, xs, sm, md, lg, xl, xxl)
 * @returns Spacing value in pixels as a number
 */
export const getSpacing = (theme: Theme, size: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): number => {
  switch (size) {
    case 'xxs': return theme.spacing(0.25); // 2px
    case 'xs': return theme.spacing(0.5);   // 4px
    case 'sm': return theme.spacing(1);     // 8px
    case 'md': return theme.spacing(2);     // 16px
    case 'lg': return theme.spacing(3);     // 24px
    case 'xl': return theme.spacing(4);     // 32px
    case 'xxl': return theme.spacing(5);    // 40px
    default: return theme.spacing(1);       // 8px
  }
};

/**
 * Get standardized border radius based on size
 * @param theme MUI theme
 * @param size The size category (xs, sm, md, lg, xl, round)
 * @returns Border radius value
 */
export const getBorderRadius = (theme: Theme, size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'round'): number | string => {
  switch (size) {
    case 'xs': return 4;
    case 'sm': return theme.shape.borderRadius;  // Default from theme
    case 'md': return 8;
    case 'lg': return 12;
    case 'xl': return 16;
    case 'round': return '50%';
    default: return theme.shape.borderRadius;
  }
};

/**
 * Get standardized box shadow based on elevation level
 * @param theme MUI theme
 * @param elevation Elevation level (0-24)
 * @returns Box shadow CSS value
 */
export const getShadow = (theme: Theme, elevation: number): string => {
  if (elevation < 0 || elevation > 24) {
    return theme.shadows[1]; // Default fallback
  }
  return theme.shadows[elevation];
};

/**
 * Get transition styling for consistent animations
 * @param theme MUI theme
 * @param properties Array of CSS properties to transition
 * @param duration Duration in ms or preset ('shortest', 'shorter', 'short', 'standard', 'complex')
 * @param easing Easing function ('easeInOut', 'easeOut', 'easeIn', 'sharp')
 * @returns Transition CSS value
 */
export const getTransition = (
  theme: Theme,
  properties: string[] = ['all'],
  duration: number | 'shortest' | 'shorter' | 'short' | 'standard' | 'complex' = 'standard',
  easing: 'easeInOut' | 'easeOut' | 'easeIn' | 'sharp' = 'easeInOut'
): string => {
  // Get the duration in ms
  let durationMs: number;
  if (typeof duration === 'string') {
    durationMs = theme.transitions.duration[duration];
  } else {
    durationMs = duration;
  }

  // Get the easing function
  const easingFunction = theme.transitions.easing[easing];

  // Create the transition string
  return properties
    .map(prop => `${prop} ${durationMs}ms ${easingFunction}`)
    .join(', ');
};

/**
 * Get standardized typography style with proper hierarchy
 * @param theme MUI theme
 * @param variant Typography variant ('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'overline', 'button')
 * @returns Typography style object
 */
export const getTypography = (
  theme: Theme,
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'overline' | 'button'
): object => {
  return theme.typography[variant];
};

/**
 * Create responsive style objects for different breakpoints
 * @param defaultValue Default style value
 * @param breakpoints Optional object with values for different breakpoints
 * @returns Responsive style object
 */
export const responsiveValue = (
  defaultValue: any,
  breakpoints?: {
    xs?: any;
    sm?: any;
    md?: any;
    lg?: any;
    xl?: any;
  }
): object => {
  if (!breakpoints) return defaultValue;

  const result: { [key: string]: any } = {};

  // Set default value
  if (defaultValue !== undefined) {
    result.default = defaultValue;
  }

  // Add breakpoint-specific values
  Object.entries(breakpoints).forEach(([breakpoint, value]) => {
    if (value !== undefined) {
      result[breakpoint] = value;
    }
  });

  return result;
};

/**
 * Get color with proper opacity based on theme mode (light/dark)
 * @param theme MUI theme
 * @param color The base color value (e.g., theme.palette.primary.main)
 * @param opacity Opacity value (0-1)
 * @returns Color with applied opacity
 */
export const getColorWithOpacity = (theme: Theme, color: string, opacity: number): string => {
  // Ensure opacity is between 0 and 1
  const validOpacity = Math.max(0, Math.min(1, opacity));
  
  // Convert opacity to hex format (00-FF)
  const opacityHex = Math.round(validOpacity * 255).toString(16).padStart(2, '0');
  
  // Add opacity to the color
  if (color.startsWith('#')) {
    return `${color}${opacityHex}`;
  } else if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${validOpacity})`);
  } else if (color.startsWith('rgba(')) {
    return color.replace(/,[^,]*\)$/, `, ${validOpacity})`);
  }
  
  // Default fallback
  return `rgba(0, 0, 0, ${validOpacity})`;
};
