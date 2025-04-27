import React, { ReactNode } from 'react';
import { 
  Fade, 
  Grow, 
  Slide, 
  Zoom, 
  Collapse, 
  SxProps, 
  Theme, 
  Fade as MuiFade,
  TransitionProps
} from '@mui/material';

// Standard durations for consistency
export const durations = {
  shortest: 150,
  shorter: 200,
  short: 250,
  standard: 300,
  complex: 375,
  enteringScreen: 225,
  leavingScreen: 195,
};

// Easing functions for consistency
export const easings = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
};

// CSS Transition strings for various use cases
export const cssTransitions = {
  fast: `all ${durations.shorter}ms ${easings.easeInOut}`,
  medium: `all ${durations.standard}ms ${easings.easeInOut}`,
  slow: `all ${durations.complex}ms ${easings.easeInOut}`,
  color: `color ${durations.shorter}ms ${easings.easeInOut}`,
  backgroundColor: `background-color ${durations.shorter}ms ${easings.easeInOut}`,
  transform: `transform ${durations.standard}ms ${easings.easeOut}`,
  opacity: `opacity ${durations.shorter}ms ${easings.easeInOut}`,
  boxShadow: `box-shadow ${durations.shorter}ms ${easings.easeInOut}`,
  border: `border ${durations.shorter}ms ${easings.easeInOut}`,
};

// Standard transition SX props
export const transitionSx: { [key: string]: SxProps<Theme> } = {
  hover: {
    transition: cssTransitions.fast,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: (theme) => `0 4px 8px ${theme.palette.action.hover}`,
    },
  },
  hoverScale: {
    transition: cssTransitions.fast,
    '&:hover': {
      transform: 'scale(1.03)',
    },
  },
  press: {
    transition: cssTransitions.fast,
    '&:active': {
      transform: 'scale(0.98)',
    },
  },
  card: {
    transition: cssTransitions.medium,
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: (theme) => theme.shadows[4],
    },
    '&:active': {
      transform: 'translateY(-1px)',
      boxShadow: (theme) => theme.shadows[2],
    },
  },
  button: {
    transition: cssTransitions.fast,
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
};

// Default transition props
const defaultProps = {
  appear: true,
  mountOnEnter: true,
  unmountOnExit: true,
};

// Transition components with standardized durations
export const transitions = {
  Fade: ({ children, ...props }: TransitionProps & { children: ReactNode }) => (
    <MuiFade
      timeout={{
        enter: durations.standard,
        exit: durations.shorter,
      }}
      {...defaultProps}
      {...props}
    >
      {children}
    </MuiFade>
  ),
  
  Grow: ({ children, ...props }: TransitionProps & { children: ReactNode }) => (
    <Grow
      timeout={{
        enter: durations.enteringScreen,
        exit: durations.leavingScreen,
      }}
      {...defaultProps}
      {...props}
    >
      {children}
    </Grow>
  ),
  
  Slide: ({ children, ...props }: TransitionProps & { children: ReactNode, direction?: "down" | "left" | "right" | "up" }) => (
    <Slide
      timeout={{
        enter: durations.enteringScreen,
        exit: durations.leavingScreen,
      }}
      direction="up"
      {...defaultProps}
      {...props}
    >
      {children}
    </Slide>
  ),
  
  Zoom: ({ children, ...props }: TransitionProps & { children: ReactNode }) => (
    <Zoom
      timeout={{
        enter: durations.enteringScreen,
        exit: durations.leavingScreen,
      }}
      {...defaultProps}
      {...props}
    >
      {children}
    </Zoom>
  ),
  
  Collapse: ({ children, ...props }: TransitionProps & { children: ReactNode, orientation?: "vertical" | "horizontal" }) => (
    <Collapse
      timeout={{
        enter: durations.enteringScreen,
        exit: durations.leavingScreen,
      }}
      {...defaultProps}
      {...props}
    >
      {children}
    </Collapse>
  ),
};

export default transitions; 