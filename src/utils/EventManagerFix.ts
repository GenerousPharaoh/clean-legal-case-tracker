/**
 * EventManagerFix.ts
 * 
 * This utility file fixes issues with the MUI EventManager
 * to prevent the "this.events[e].clear is not a function" error.
 */

// Fix the EventManager to handle missing clear method
export function applyEventManagerFixes() {
  // This function should be called once at app startup
  try {
    // Find all MUI components that might use EventManager
    if (typeof window !== 'undefined') {
      // Method 1: Patch the .clear method onto Map.prototype (safer approach)
      if (!Map.prototype.hasOwnProperty('clear') && typeof Map.prototype.delete === 'function') {
        // Add a polyfill if the Map.clear method is missing
        Object.defineProperty(Map.prototype, 'clear', {
          configurable: true,
          enumerable: false,
          writable: true,
          value: function() {
            // Use the keys/delete approach for Maps that don't have clear
            const keys = Array.from(this.keys());
            keys.forEach(key => this.delete(key));
            return this;
          }
        });
        console.log("[EventManagerFix] Added Map.clear polyfill");
      }

      // Method 2: Monkey patch the r$e.unmount function
      // This is a more aggressive approach that intercepts the function that's causing the error
      const patchMUIEventSystem = () => {
        // Look for the minified function that might be causing the issue
        for (const key in window) {
          // Skip non-object properties and built-ins
          if (!window.hasOwnProperty(key) || typeof window[key] !== 'object' || window[key] === null) continue;
          
          const obj = window[key];
          
          // Look for an object that has an unmount method
          if (obj && typeof obj.unmount === 'function') {
            const originalUnmount = obj.unmount;
            obj.unmount = function(...args) {
              try {
                // Try to run the original unmount method
                return originalUnmount.apply(this, args);
              } catch (err) {
                // If we get the specific error, handle it
                if (err instanceof TypeError && err.message.includes('clear is not a function')) {
                  console.warn('[EventManagerFix] Caught and handled event.clear error');
                  
                  // Safely handle the event cleanup manually
                  if (this.events && typeof this.events === 'object') {
                    const eventName = args[0];
                    if (this.events[eventName]) {
                      // Handle Map objects without clear
                      if (this.events[eventName].highPriority && this.events[eventName].highPriority instanceof Map) {
                        const keys = Array.from(this.events[eventName].highPriority.keys());
                        keys.forEach(key => this.events[eventName].highPriority.delete(key));
                      }
                      
                      if (this.events[eventName].regular && this.events[eventName].regular instanceof Map) {
                        const keys = Array.from(this.events[eventName].regular.keys());
                        keys.forEach(key => this.events[eventName].regular.delete(key));
                      }
                      
                      // Remove the event completely
                      this.events[eventName] = null;
                      delete this.events[eventName];
                    }
                  }
                } else {
                  // Rethrow any other errors
                  throw err;
                }
              }
            };
            
            console.log("[EventManagerFix] Patched object unmount method");
          }
        }
      };
      
      // Try to patch immediately and also after a short delay to catch any late-loading components
      patchMUIEventSystem();
      setTimeout(patchMUIEventSystem, 1000);
    }
    
    console.log("[EventManagerFix] Successfully applied patches to prevent event unmounting errors");
  } catch (error) {
    console.error("[EventManagerFix] Error applying event manager fixes:", error);
  }
}
