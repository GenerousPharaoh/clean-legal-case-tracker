/**
 * React Compatibility Script
 * This script ensures React is defined globally for older JSX transform compatibility
 * It must be included before any other React scripts for maximum compatibility
 */

(function() {
  // Store the existing React reference if it exists
  var _React = window.React;

  // Define a global React variable that will be replaced by the actual React
  // This prevents "React is not defined" errors even before React is loaded
  window.React = window.React || {
    createElement: function() { 
      console.warn('React compatibility placeholder called before React was loaded');
      return null; 
    },
    Fragment: {},
    StrictMode: {},
    version: '0.0.0-placeholder',
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {},
    // Add any other properties that might be accessed early
    isValidElement: function() { return false; },
    Children: { map: function() {}, forEach: function() {}, count: function() {}, toArray: function() {}, only: function() {} },
  };

  // If React was already defined, restore its value
  if (_React) {
    window.React = _React;
  }

  // Log that the compatibility script has loaded
  console.log('React compatibility script loaded');
})();
