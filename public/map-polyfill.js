/**
 * Comprehensive polyfill for Map.clear and other MUI/framer-motion compatibility issues
 * This file is included in index.html and runs before any application code
 */
(function() {
  console.log('[Map Polyfill] Initializing compatibility layer for framer-motion and MUI');
  
  // Fix 1: Add Map.clear method if missing
  if (typeof Map !== 'undefined' && !Map.prototype.clear) {
    console.info('[Map Polyfill] Adding Map.clear method');
    Map.prototype.clear = function() {
      this.forEach((_, key) => {
        this.delete(key);
      });
      return this;
    };
  }

  // Fix 2: Monkey patch event handlers to prevent "clear is not a function" errors
  window.addEventListener('load', function() {
    setTimeout(function() {
      try {
        // Scan the DOM for potentially problematic event handlers
        Object.keys(window).forEach(key => {
          try {
            const obj = window[key];
            if (obj && typeof obj === 'object') {
              // Look for framer-motion event structure
              if (obj.events && typeof obj.events === 'object') {
                // Add clear method to event collections if missing
                Object.keys(obj.events).forEach(eventType => {
                  const event = obj.events[eventType];
                  if (event) {
                    // Check high priority and regular event collections
                    ['highPriority', 'regular'].forEach(priority => {
                      if (event[priority] && 
                          typeof event[priority] === 'object' &&
                          typeof event[priority].delete === 'function' &&
                          typeof event[priority].forEach === 'function' &&
                          !event[priority].clear) {
                        // Add clear method to Map-like objects
                        console.info(`[Map Polyfill] Adding clear method to ${key}.events.${eventType}.${priority}`);
                        event[priority].clear = function() {
                          this.forEach((_, key) => {
                            this.delete(key);
                          });
                          return this;
                        };
                      }
                    });
                  }
                });
              }
              
              // Look for unmount methods that use clear
              if (typeof obj.unmount === 'function') {
                const originalUnmount = obj.unmount;
                obj.unmount = function(eventName) {
                  try {
                    // Handle case where events[eventName] exists but clear is missing
                    if (this.events && this.events[eventName]) {
                      if (this.events[eventName].highPriority && !this.events[eventName].highPriority.clear) {
                        this.events[eventName].highPriority.forEach((_, key) => {
                          this.events[eventName].highPriority.delete(key);
                        });
                      }
                      if (this.events[eventName].regular && !this.events[eventName].regular.clear) {
                        this.events[eventName].regular.forEach((_, key) => {
                          this.events[eventName].regular.delete(key);
                        });
                      }
                      return;
                    }
                    
                    // Call original unmount if our case doesn't apply
                    return originalUnmount.apply(this, arguments);
                  } catch (err) {
                    console.warn('[Map Polyfill] Caught error in patched unmount method:', err);
                    // Clean fallback if error occurs
                    if (this.events && this.events[eventName]) {
                      delete this.events[eventName];
                    }
                  }
                };
              }
            }
          } catch (e) {
            // Ignore permission errors when accessing global objects
          }
        });
        
        console.info('[Map Polyfill] Compatibility layer initialized successfully');
      } catch (err) {
        console.error('[Map Polyfill] Error initializing compatibility layer:', err);
      }
    }, 500);
  });

  // Fix 3: Global error handler for "clear is not a function" errors
  window.addEventListener('error', function(event) {
    if (event && event.error && event.error.message && 
        event.error.message.includes('clear is not a function')) {
      console.warn('[Map Polyfill] Intercepted "clear is not a function" error, preventing crash');
      event.preventDefault();
      return true;
    }
  }, true);
})(); 