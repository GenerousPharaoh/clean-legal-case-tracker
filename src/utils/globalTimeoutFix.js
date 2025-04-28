/**
 * Global timeout patch that fixes issues with Material-UI's Timeout class
 * This addresses the error: "Cannot set property clear of #<Object> which has only a getter"
 */

(function() {
  if (typeof window === 'undefined') return;
  
  // Store original setTimeout/clearTimeout
  const originalSetTimeout = window.setTimeout;
  const originalClearTimeout = window.clearTimeout;
  
  // Create a safe Timeout constructor that won't cause errors
  function SafeTimeout() {
    // Private timeout ID
    let timeoutId = null;
    
    // Define clear as a method with a getter
    Object.defineProperty(this, 'clear', {
      configurable: true,
      get: function() {
        return function() {
          if (timeoutId !== null) {
            originalClearTimeout(timeoutId);
            timeoutId = null;
          }
        };
      }
    });
    
    // Define start method
    this.start = function(delay, callback) {
      // Clear any existing timeout
      if (timeoutId !== null) {
        originalClearTimeout(timeoutId);
      }
      
      // Set new timeout
      timeoutId = originalSetTimeout(function() {
        timeoutId = null;
        callback();
      }, delay);
    };
    
    // Add disposeEffect method for React hooks
    this.disposeEffect = function() {
      return this.clear;
    };
    
    return this;
  }
  
  // Add static create method
  SafeTimeout.create = function() {
    return new SafeTimeout();
  };
  
  // Global patch for Timeout class
  // This will override any existing Timeout constructor
  window.Timeout = SafeTimeout;
  
  // Patch for Material-UI useTimeout
  if (typeof window.__mui_use_timeout_patch === 'undefined') {
    window.__mui_use_timeout_patch = true;
    
    // Try to patch module system if it exists
    if (typeof window.require === 'function') {
      const originalRequire = window.require;
      
      window.require = function(path) {
        const module = originalRequire.apply(this, arguments);
        
        // Patch @mui/utils/useTimeout module
        if (path === '@mui/utils/useTimeout' || path === '@mui/utils') {
          if (module && module.Timeout) {
            // Override the Timeout class
            module.Timeout = SafeTimeout;
          }
        }
        
        return module;
      };
    }
    
    // Add global handler to catch runtime errors related to timeouts
    window.addEventListener('error', function(event) {
      if (event && event.error && event.error.message && 
          event.error.message.includes('property clear of #<Object> which has only a getter')) {
        
        console.warn('[GLOBAL TIMEOUT FIX] Caught timeout property error:', event.error.message);
        
        // Suppress the error
        event.preventDefault();
        
        // Try to trace where the error occurred
        if (event.filename) {
          console.log('[GLOBAL TIMEOUT FIX] Error occurred in:', event.filename);
        }
      }
    });
    
    console.log('[GLOBAL TIMEOUT FIX] Applied global timeout fixes');
  }
})(); 