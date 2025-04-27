// Common CSS transitions used throughout the app
export const cssTransitions = {
  // Very fast transition - best for resize operations and interface elements
  ultraFast: 'all 50ms ease',
  
  // Fast transition - good for small UI elements
  fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Medium transition - good for panels appearing/disappearing
  medium: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Slow transition - good for larger UI elements
  slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
};

// React Transition Group transitions
// Provides consistent transition configurations across components
export const transitions = {
  Fade: {
    appear: true,
    timeout: {
      appear: 150,
      enter: 150,
      exit: 100,
    }
  },
  Collapse: {
    appear: true,
    timeout: {
      appear: 200,
      enter: 200,
      exit: 150,
    },
    unmountOnExit: true
  },
  Zoom: {
    appear: true,
    timeout: {
      appear: 200,
      enter: 200,
      exit: 150,
    }
  },
  Slide: {
    appear: true,
    timeout: {
      appear: 200,
      enter: 200,
      exit: 150,
    }
  }
}; 