// Emergency fix for "this.events[e].clear is not a function" error
(function() {
  console.log("Applying emergency Map.clear polyfill...");
  
  // Add the clear method to Map prototype if missing
  if (typeof Map !== 'undefined' && !Map.prototype.clear) {
    Map.prototype.clear = function() {
      this.forEach((_, key) => {
        this.delete(key);
      });
      return this;
    };
    console.log("Added Map.clear polyfill");
  }
  
  // Global error handler for the specific error
  window.addEventListener('error', function(event) {
    if (event && event.error && event.error.message && 
        event.error.message.includes('clear is not a function')) {
      console.warn("Intercepted 'clear is not a function' error, preventing crash");
      event.preventDefault();
      return true;
    }
  }, true);

  // Apply the fix to any event handler objects in the DOM
  window.addEventListener('load', function() {
    setTimeout(function() {
      try {
        // Find objects with event handlers that might need patching
        for (const key in window) {
          try {
            const obj = window[key];
            if (obj && typeof obj === 'object') {
              // Look for objects with an events property
              if (obj.events && typeof obj.events === 'object') {
                // Iterate through event types
                for (const eventType in obj.events) {
                  const event = obj.events[eventType];
                  if (event) {
                    // Add clear method to any Maps without it
                    ['highPriority', 'regular'].forEach(function(priority) {
                      if (event[priority] && 
                          typeof event[priority].forEach === 'function' &&
                          typeof event[priority].delete === 'function' &&
                          !event[priority].clear) {
                        event[priority].clear = function() {
                          this.forEach((_, key) => {
                            this.delete(key);
                          });
                          return this;
                        };
                      }
                    });
                  }
                }
              }
              
              // Look for unmount methods that might use clear
              if (typeof obj.unmount === 'function') {
              const originalUnmount = obj.unmount;
              obj.unmount = function(eventName) {
                try {
                    // Safe implementation that won't throw errors
                  if (this.events && this.events[eventName]) {
                      // Handle case where clear is missing
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
                    // Call original if our case doesn't apply
                  return originalUnmount.apply(this, arguments);
                } catch (err) {
                  console.warn("Caught error in patched unmount method:", err);
                    // Clean fallback if error occurs
                  if (this.events && this.events[eventName]) {
                    delete this.events[eventName];
                  }
                }
              };
              }
            }
          } catch (e) {
            // Ignore permission errors
          }
        }
      } catch (err) {
        console.error("Error applying emergency fixes:", err);
      }
    }, 500);
  });
})();

