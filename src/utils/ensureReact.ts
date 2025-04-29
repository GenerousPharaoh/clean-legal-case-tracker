/**
 * This utility ensures React is globally available for class components
 * This helps prevent "React is not defined" errors in production builds
 */
import * as React from 'react';

// Ensure React is globally available for JSX
if (typeof window !== 'undefined' && !window.React) {
  (window as any).React = React;
}

export default React;
