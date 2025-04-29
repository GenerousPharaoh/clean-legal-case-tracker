/**
 * Ensure React is globally available for JSX components
 * This helps prevent "React is not defined" errors at runtime
 */

import React from 'react';

// Make React available globally for legacy code that might use it without importing
if (typeof window !== 'undefined') {
  window.React = React;
}

// Log that we've ensured React is available
console.log('[React] Ensuring React is available globally for all components');

export default React;
