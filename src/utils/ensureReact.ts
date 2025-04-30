/**
 * This utility ensures React is globally available for class components
 * This helps prevent "React is not defined" errors in production builds
 */
import * as React from 'react';

// Make React available globally for JSX and class components
if (typeof window !== 'undefined') {
  // @ts-ignore - Necessary for compatibility
  window.React = React;
  
  // Also directly define React globally for older JSX transform compatibility
  try {
    // @ts-ignore - Necessary for compatibility
    if (typeof global !== 'undefined' && !global.React) {
      // @ts-ignore - Necessary for compatibility
      global.React = React;
    }
    
    // For browsers without global object
    // @ts-ignore - Necessary for compatibility
    if (typeof self !== 'undefined' && !self.React) {
      // @ts-ignore - Necessary for compatibility
      self.React = React;
    }
    
    // Last resort: define globally as a var
    if (typeof React === 'undefined') {
      // @ts-ignore - Necessary for compatibility
      window.React = React;
    }
  } catch (e) {
    console.warn('Failed to globally define React:', e);
  }
}

export default React;
