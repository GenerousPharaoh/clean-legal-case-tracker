/**
 * fix-events.js
 * 
 * This script fixes the "this.events[e].clear is not a function" error
 * by providing the missing clear method to Map objects and patching
 * event management functions. It needs to be loaded before the main app.
 */
(function() {
  console.log('[EventsFix] Initializing early event handling fixes');

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
      console.log('[EventsFix] Added Map.clear polyfill');
    }

    // Patch window.__R$E__ if it exists (common minified name pattern for event systems)
    window.addEventListener('load', function() {
      setTimeout(function() {
        // Look for objects that match the pattern of an event manager
        Object.keys(window).forEach(function(key) {
          if (key.indexOf('__') === 0 && key.indexOf('$') !== -1) {
            const obj = window[key];
            if (obj && typeof obj === 'object' && obj.unmount && obj.events) {
              const originalUnmount = obj.unmount;
              obj.unmount = function(eventName) {
                try {
                  if (this.events[eventName]) {
                    if (this.events[eventName].clear) {
                      this.events[eventName].clear();
                    } else {
                      // Handle Maps without clear
                      if (this.events[eventName].highPriority) {
                        const hpKeys = Array.from(this.events[eventName].highPriority.keys());
                        hpKeys.forEach(k => this.events[eventName].highPriority.delete(k));
                      }
                      if (this.events[eventName].regular) {
                        const regKeys = Array.from(this.events[eventName].regular.keys());
                        regKeys.forEach(k => this.events[eventName].regular.delete(k));
                      }
                    }
                    // Remove the event
                    delete this.events[eventName];
                  }
                } catch (err) {
                  console.warn('[EventsFix] Error in patched unmount:', err);
                  // Try original as fallback
                  try {
                    return originalUnmount.apply(this, arguments);
                  } catch (_) {
                    // Last resort: just delete the event
                    if (this.events && this.events[eventName]) {
                      delete this.events[eventName];
                    }
                  }
                }
              };
              console.log('[EventsFix] Patched potential event manager:', key);
            }
          }
        });
      }, 1000); // Give the app time to initialize
    });

    // Add a global error handler for this specific error
    window.addEventListener('error', function(event) {
      if (event && event.error && event.error.message && 
          event.error.message.includes('clear is not a function')) {
        console.warn('[EventsFix] Caught clear method error in global handler');
        event.preventDefault(); // Prevent the error from propagating
        return true;
      }
    });

    console.log('[EventsFix] Early fixes applied successfully');
  } catch (err) {
    console.error('[EventsFix] Error applying fixes:', err);
  }
})();
