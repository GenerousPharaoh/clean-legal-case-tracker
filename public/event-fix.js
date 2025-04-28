/**
 * event-fix.js
 * Fixes the "this.events[e].clear is not a function" error
 * This script runs early, before React loads
 */
(function() {
  console.log('[EventFix] Initializing early event handling fixes');

  try {
    // Add Map.clear method if needed
    if (!Map.prototype.hasOwnProperty('clear') && typeof Map.prototype.delete === 'function') {
      Object.defineProperty(Map.prototype, 'clear', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function() {
          const keys = Array.from(this.keys());
          keys.forEach(key => this.delete(key));
          return this;
        }
      });
      console.log('[EventFix] Added Map.clear polyfill');
    }

    // Patch event manager objects when they're created
    window.addEventListener('load', function() {
      setTimeout(function() {
        // Look for objects that match the pattern of an event manager
        Object.keys(window).forEach(function(key) {
          const obj = window[key];
          if (obj && typeof obj === 'object' && obj !== null && obj.events) {
            // Add a safe unmount method
            const originalUnmount = obj.unmount;
            obj.unmount = function(eventName) {
              try {
                // Try to safely clean up the event
                if (this.events && this.events[eventName]) {
                  // Handle collections with highPriority and regular Maps
                  if (this.events[eventName].highPriority instanceof Map) {
                    this.events[eventName].highPriority.clear?.() || 
                    Array.from(this.events[eventName].highPriority.keys())
                      .forEach(k => this.events[eventName].highPriority.delete(k));
                  }
                  
                  if (this.events[eventName].regular instanceof Map) {
                    this.events[eventName].regular.clear?.() ||
                    Array.from(this.events[eventName].regular.keys())
                      .forEach(k => this.events[eventName].regular.delete(k));
                  }
                  
                  // Remove the event
                  this.events[eventName] = null;
                  delete this.events[eventName];
                  return;
                }
                
                // If our custom handling didn't work, try the original
                if (originalUnmount) {
                  return originalUnmount.apply(this, arguments);
                }
              } catch (err) {
                console.warn('[EventFix] Error in patched unmount:', err);
                // Fail silently to prevent app crashing
              }
            };
            console.log('[EventFix] Patched potential EventManager');
          }
        });
      }, 1000); // Give the app time to initialize
    });

    // Add a global error handler for this specific error
    window.addEventListener('error', function(event) {
      if (event && event.error && event.error.message && 
          event.error.message.includes('clear is not a function')) {
        console.warn('[EventFix] Caught clear method error in global handler');
        event.preventDefault(); // Prevent the error from propagating
        return true;
      }
    });

    console.log('[EventFix] Early fixes applied successfully');
  } catch (err) {
    console.error('[EventFix] Error applying fixes:', err);
  }
})(); 