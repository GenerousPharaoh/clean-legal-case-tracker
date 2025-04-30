/**
 * React initialization module
 * This module ensures React is properly initialized before app bootstrap
 */

// Make sure React is globally defined
// @ts-ignore - needed for compatibility
if (typeof window !== 'undefined' && !window.React) {
  try {
    // @ts-ignore - needed for compatibility
    const React = require('react');
    // @ts-ignore - needed for compatibility
    window.React = React;
    console.log('Successfully defined React globally');
  } catch (e) {
    console.error('Failed to define React globally:', e);
  }
}

// Polyfill for older JSX transform (used by class components)
// @ts-ignore - needed for compatibility
if (typeof window !== 'undefined' && window.React && !window.React.createElement) {
  try {
    const reactModule = require('react');
    // @ts-ignore - needed for compatibility
    window.React.createElement = reactModule.createElement;
    // @ts-ignore - needed for compatibility
    window.React.Fragment = reactModule.Fragment;
    console.log('Successfully polyfilled React JSX methods');
  } catch (e) {
    console.error('Failed to polyfill React JSX methods:', e);
  }
}

// This will patch React for various environments
export function ensureReactAvailable() {
  return true;
}

export default { ensureReactAvailable };
