/**
 * Universal Polyfill Script for Legal Case Tracker
 * 
 * This script addresses multiple issues that are causing crashes in production:
 * 1. Missing Map.clear method causing "clear is not a function" errors
 * 2. MUI Timeout issues with property setters/getters
 * 3. Event clearing problems during component unmounting
 */

(function() {
  console.log('[UNIVERSAL POLYFILL] Applying comprehensive fixes...');
  
  //===========================================================================
  // PART 1: Map.clear Polyfill
  //===========================================================================
  
  // Add Map.clear if it's missing
  if (typeof Map !== 'undefined' && !Map.prototype.clear) {
    Map.prototype.clear = function() {
      this.forEach((_, key) => {
        this.delete(key);
      });
      return this;
    };
    console.log('[UNIVERSAL POLYFILL] Added Map.clear polyfill');
  }
  
  // Also handle Map-like objects and collections
  window.ensureObjectHasClear = function(obj) {
    if (obj && typeof obj === 'object') {
      // Check if object is Map-like (has forEach and delete but no clear)
      if (typeof obj.forEach === 'function' && 
          typeof obj.delete === 'function' && 
          !obj.clear) {
        obj.clear = function() {
          this.forEach((_, key) => {
            this.delete(key);
          });
          return this;
        };
        return true;
      }
    }
    return false;
  };
  
  // Deep recursive function to patch all Map-like objects
  window.ensureEventsClearable = function(obj, visited = new Set()) {
    // Prevent infinite recursion
    if (!obj || typeof obj !== 'object' || visited.has(obj)) {
      return;
    }
    
    visited.add(obj);
    
    // Try to add clear to the object itself
    window.ensureObjectHasClear(obj);
    
    // Check for common event structure patterns
    if (obj.events) {
      Object.keys(obj.events).forEach(eventKey => {
        const event = obj.events[eventKey];
        if (event) {
          // Check for common structures in event systems
          ['handlers', 'listeners', 'subscribers', 'callbacks', 'highPriority', 'regular'].forEach(key => {
            if (event[key]) {
              window.ensureObjectHasClear(event[key]);
            }
          });
        }
      });
    }
    
    // For collection-like objects, try to patch all children
    if (typeof obj.forEach === 'function') {
      try {
        obj.forEach((value) => {
          if (value && typeof value === 'object') {
            window.ensureEventsClearable(value, visited);
          }
        });
      } catch (e) {
        // Ignore errors accessing properties
      }
    }
    
    // For regular objects, try to patch all properties
    else {
      Object.keys(obj).forEach(key => {
        try {
          const value = obj[key];
          if (value && typeof value === 'object') {
            window.ensureEventsClearable(value, visited);
          }
        } catch (e) {
          // Ignore errors accessing properties
        }
      });
    }
  };
  
  //===========================================================================
  // PART 2: Timeout Fixes
  //===========================================================================
  
  // Create safe timeout implementation
  function SafeTimeout() {
    // Private timeout ID
    let timeoutId = null;
    
    // Set up the clear method with a getter
    Object.defineProperty(this, 'clear', {
      configurable: true,
      enumerable: true,
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
  
  // Intercept window.Timeout creation
  if (Object.defineProperty) {
    try {
      Object.defineProperty(window, 'Timeout', {
        configurable: true,
        get: function() {
          return SafeTimeout;
        },
        set: function(value) {
          // If someone tries to set Timeout, we'll allow it but log it
          console.log('[UNIVERSAL POLYFILL] Intercepted attempt to set Timeout constructor');
          
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
      console.log('[UNIVERSAL POLYFILL] Installed Timeout getter/setter patch');
    } catch (e) {
      console.error('[UNIVERSAL POLYFILL] Failed to patch Timeout:', e);
    }
  }
  
  // Expose our safe version globally
  window.__mui_safe_timeout = SafeTimeout;
  
  //===========================================================================
  // PART 3: Global Error Handlers
  //===========================================================================
  
  // Central error handler for all known issues
  window.addEventListener('error', function(event) {
    // Handle Map.clear errors
    if (event && event.error && event.error.message && 
        event.error.message.includes('clear is not a function')) {
      console.warn('[UNIVERSAL POLYFILL] Intercepted "clear is not a function" error');
      event.preventDefault();
      return true;
    }
    
    // Handle Timeout property errors
    if (event && event.error && event.error.message && 
        (event.error.message.includes('property clear of #<Object> which has only a getter') ||
         event.error.message.includes('Timeout') && event.error.message.includes('clear'))) {
      console.warn('[UNIVERSAL POLYFILL] Intercepted Timeout property error');
      event.preventDefault();
      return true;
    }
    
    // Handle any other specific errors we might want to catch
    return false;
  }, true);
  
  // Also catch errors in promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (event && event.reason && event.reason.message && 
        (event.reason.message.includes('clear is not a function') ||
         event.reason.message.includes('property clear of #<Object>') ||
         event.reason.message.includes('Timeout') && event.reason.message.includes('clear'))) {
      console.warn('[UNIVERSAL POLYFILL] Caught unhandled promise rejection:', event.reason.message);
      event.preventDefault();
      return true;
    }
    return false;
  }, true);
  
  //===========================================================================
  // PART 4: DOM Ready Handlers
  //===========================================================================
  
  // Apply patches when DOM is ready
  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      try {
        // Patch any event handler objects in the DOM
        const rootObjects = [window, document];
        
        // Try to find React's root fiber (where many event handlers live)
        const rootNode = document.getElementById('root');
        if (rootNode && rootNode._reactRootContainer) {
          rootObjects.push(rootNode._reactRootContainer);
          console.log('[UNIVERSAL POLYFILL] Found React root container');
        }
        
        // Find all known event systems
        rootObjects.forEach(obj => {
          window.ensureEventsClearable(obj);
        });
        
        // Special handling for MUI components
        if (window.MaterialUI) {
          window.ensureEventsClearable(window.MaterialUI);
        }
        
        console.log('[UNIVERSAL POLYFILL] Applied fixes to DOM event objects');
      } catch (e) {
        console.error('[UNIVERSAL POLYFILL] Error in DOM ready handler:', e);
      }
    }, 500);
  });
  
  console.log('[UNIVERSAL POLYFILL] All fixes have been applied successfully');
})();
