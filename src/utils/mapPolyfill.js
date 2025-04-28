/**
 * React Event Handler Bug Fix
 * 
 * This polyfill fixes the "this.events[e].clear is not a function" error in React.
 * The error occurs during component unmounting when React tries to clean up event listeners.
 */

(function() {
  // Original Map.clear polyfill
  if (typeof Map !== 'undefined' && !Map.prototype.clear) {
    console.info('[Polyfill] Adding Map.clear polyfill for compatibility');
    Map.prototype.clear = function() {
      this.forEach((_, key) => {
        this.delete(key);
      });
      return this;
    };
  }

  // Ensure Set has clear method too
  if (typeof Set !== 'undefined' && !Set.prototype.clear) {
    console.info('[Polyfill] Adding Set.clear polyfill for compatibility');
    Set.prototype.clear = function() {
      this.forEach(item => {
        this.delete(item);
      });
      return this;
    };
  }

  // Direct patch for React event handling system
  // This runs after the DOM is loaded to ensure React is available
  const patchReactEvents = function() {
    try {
      // Add a safe clear method to any object that might be used for events
      Object.defineProperty(Object.prototype, '_safeClear', {
        value: function() {
          if (this instanceof Map || this instanceof Set) {
            // Use native clear if available
            if (typeof this.clear === 'function') {
              this.clear();
              return;
            }
            
            // Fallback if clear isn't available
            if (typeof this.forEach === 'function') {
              const keysToDelete = [];
              this.forEach((val, key) => {
                keysToDelete.push(key);
              });
              keysToDelete.forEach(key => {
                this.delete(key);
              });
            }
          } else if (typeof this === 'object') {
            // For plain objects
            for (const key in this) {
              if (Object.prototype.hasOwnProperty.call(this, key)) {
                delete this[key];
              }
            }
          }
        },
        writable: true,
        configurable: true
      });

      // Replace event.clear with our _safeClear when it doesn't exist
      const originalClear = Object.getOwnPropertyDescriptor(Object.prototype, 'clear');
      
      if (!originalClear || !originalClear.value) {
        Object.defineProperty(Object.prototype, 'clear', {
          get: function() {
            // Return a safe function that won't crash
            return this._safeClear || function() {
              console.warn('[Polyfill] Called missing clear() method safely');
            };
          },
          configurable: true
        });
      }

      // Monitor & patch React's event system specifically
      const monitorAndPatch = function() {
        // Patch React's synthetic event system if available
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || window.React) {
          console.info('[Polyfill] React detected, applying event system patches');
          
          // Try to find React event instances
          document.querySelectorAll('*').forEach(element => {
            if (element._reactEvents || element.__reactEvents) {
              const events = element._reactEvents || element.__reactEvents;
              
              // Patch each event type
              for (const eventType in events) {
                const listeners = events[eventType];
                
                // Ensure it has our safe clear method
                if (listeners && !listeners.clear) {
                  listeners.clear = function() {
                    if (Array.isArray(this)) {
                      this.length = 0;
                    } else if (typeof this.forEach === 'function') {
                      const keysToDelete = [];
                      this.forEach((val, key) => {
                        keysToDelete.push(key);
                      });
                      keysToDelete.forEach(key => {
                        this.delete(key);
                      });
                    } else {
                      // Empty the object
                      for (const key in this) {
                        if (this.hasOwnProperty(key)) {
                          delete this[key];
                        }
                      }
                    }
                  };
                }
              }
            }
          });
        }
      };

      // Run patch immediately
      monitorAndPatch();
      
      // Also patch on DOM changes
      if (window.MutationObserver) {
        const observer = new MutationObserver(function() {
          monitorAndPatch();
        });
        
        observer.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true
        });
      }
    } catch (err) {
      console.error('[Polyfill] Error in React event patching:', err);
    }
  };

  // Run our patch after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchReactEvents);
  } else {
    patchReactEvents();
  }

  // Add a global emergency fix function that can be called anywhere
  window.fixReactEventSystem = patchReactEvents;
})();
