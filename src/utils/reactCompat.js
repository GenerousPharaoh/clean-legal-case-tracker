/**
 * React Compatibility Module for Classic JSX Runtime
 */

import React from 'react';

// This module ensures React is available globally with all necessary methods
if (typeof window !== 'undefined') {
  // Add the real React to window
  window.React = React;
  
  // Log compatibility check
  console.log('[REACT COMPAT] Loaded React compatibility module');
  
  // Sanity check React.createElement
  try {
    const testElement = React.createElement('div', null, 'test');
    if (testElement && testElement.type === 'div') {
      console.log('[REACT COMPAT] React.createElement verified');
    }
  } catch (e) {
    console.error('[REACT COMPAT] Error in React.createElement check:', e);
  }
}

export default React;
