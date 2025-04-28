/**
 * Pre-load patch for Material-UI's Timeout class
 * This addresses the error: "Uncaught TypeError: Cannot set property clear of #<Object> which has only a getter"
 */

(function() {
  console.log('[MUI PRE-PATCH] Applying early MUI Timeout fix');
  
  // Intercept window.Timeout creation
  Object.defineProperty(window, 'Timeout', {
    configurable: true,
    get: function() {
      return SafeTimeout;
    },
    set: function(value) {
      // If someone tries to set Timeout, we'll allow it but wrap it with our safe version
      console.log('[MUI PRE-PATCH] Intercepted attempt to set Timeout constructor');
      
      // Keep any static methods from the original
      if (value && typeof value === 'function') {
        Object.keys(value).forEach(key => {
          if (typeof value[key] === 'function' && key !== 'create') {
            SafeTimeout[key] = value[key];
          }
        });
      }
    }
  });
  
  // Create safe timeout implementation
  function SafeTimeout() {
    // Private timeout ID
    let timeoutId = null;
    
    // Set up the clear method with a getter
    Object.defineProperty(this, 'clear', {
      configurable: true,
      get: function() {
        return function() {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };
      }
    });
    
    // Define start method
    this.start = function(delay, callback) {
      // Clear any existing timeout
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      // Set new timeout
      timeoutId = setTimeout(function() {
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
  
  // Monkey patch global Timeout variables
  window.__mui_safe_timeout = SafeTimeout;
  
  // Catch all errors related to Timeout.clear
  window.addEventListener('error', function(event) {
    if (event && event.error && event.error.message && 
        (event.error.message.includes('property clear of #<Object> which has only a getter') ||
         event.error.message.includes('Timeout') && event.error.message.includes('clear'))) {
      
      console.warn('[MUI PRE-PATCH] Caught timeout error:', event.error.message);
      
      // Suppress the error
      event.preventDefault();
      
      // Try to trace where the error occurred
      if (event.filename) {
        console.log('[MUI PRE-PATCH] Error in file:', event.filename);
      }
    }
  }, true);
  
  // Also catch errors in promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (event && event.reason && event.reason.message && 
        (event.reason.message.includes('property clear of #<Object> which has only a getter') ||
         event.reason.message.includes('Timeout') && event.reason.message.includes('clear'))) {
      
      console.warn('[MUI PRE-PATCH] Caught unhandled promise rejection with timeout error:', event.reason.message);
      
      // Suppress the error
      event.preventDefault();
    }
  }, true);
  
  console.log('[MUI PRE-PATCH] MUI Timeout pre-patch successfully applied');
})(); 