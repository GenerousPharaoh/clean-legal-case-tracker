/**
 * Direct Map.clear fix - Simple script to be added to index.html
 * This addresses the error: "TypeError: this.events[e].clear is not a function"
 */
(function() {
  console.log('[MAP-CLEAR-FIX] Initializing...');

  // Function to ensure an object has a clear method if it's Map-like
  function ensureHasClear(obj) {
    if (obj && typeof obj === 'object' && typeof obj.forEach === 'function' && 
        typeof obj.delete === 'function' && !obj.clear) {
      // Add clear method if missing
      obj.clear = function() {
        try {
          // Use forEach/delete to clear the map
          this.forEach((_, key) => {
            this.delete(key);
          });
        } catch (e) {
          console.warn('[MAP-CLEAR-FIX] Error in polyfill clear:', e);
        }
        return this;
      };
      return true;
    }
    return false;
  }

  // Add clear method to Map prototype if it's missing
  if (typeof Map !== 'undefined' && !Map.prototype.clear) {
    Map.prototype.clear = function() {
      this.forEach((_, key) => {
        this.delete(key);
      });
      return this;
    };
    console.log('[MAP-CLEAR-FIX] Added clear method to Map prototype');
  }

  // Global error handler for the specific error
  window.addEventListener('error', function(event) {
    if (event && event.error && event.error.message && 
        event.error.message.includes('clear is not a function')) {
      console.warn('[MAP-CLEAR-FIX] Caught clear error:', event.error.message);
      
      // Try to find the object in the error stack
      try {
        // Find any event handler systems
        if (window.MUI) {
          Object.values(window.MUI).forEach(obj => {
            if (obj && typeof obj === 'object' && obj.events) {
              Object.values(obj.events).forEach(collection => {
                ensureHasClear(collection);
                if (collection.highPriority) ensureHasClear(collection.highPriority);
                if (collection.regular) ensureHasClear(collection.regular);
              });
            }
          });
        }
      } catch (e) {
        console.error('[MAP-CLEAR-FIX] Error in error handler:', e);
      }
      
      event.preventDefault();
      return true;
    }
  }, true);

  // Patch all objects when DOM is ready
  window.addEventListener('DOMContentLoaded', function() {
    console.log('[MAP-CLEAR-FIX] DOM ready, applying fixes');
    setTimeout(function() {
      try {
        // Scan for libraries that might use Map-like objects
        const libs = ['MUI', 'React', 'ReactDOM', 'framer', 'motion'];
        
        libs.forEach(libName => {
          if (window[libName]) {
            console.log(`[MAP-CLEAR-FIX] Patching ${libName} objects`);
            patchLibrary(window[libName]);
          }
        });
        
        // Search for event handlers on DOM elements
        document.querySelectorAll('*').forEach(elem => {
          if (elem._reactEvents) {
            Object.values(elem._reactEvents).forEach(evt => {
              ensureHasClear(evt);
            });
          }
        });
        
        console.log('[MAP-CLEAR-FIX] Fixes applied to DOM');
      } catch (e) {
        console.error('[MAP-CLEAR-FIX] Error in DOMContentLoaded handler:', e);
      }
    }, 500);
  });
  
  // Function to recursively patch a library
  function patchLibrary(lib, depth = 0, visited = new Set()) {
    if (!lib || typeof lib !== 'object' || visited.has(lib) || depth > 3) return;
    visited.add(lib);
    
    // Patch the object itself
    if (lib.events) {
      Object.values(lib.events).forEach(event => {
        ensureHasClear(event);
        if (event.highPriority) ensureHasClear(event.highPriority);
        if (event.regular) ensureHasClear(event.regular);
      });
    }
    
    // Recursively patch properties
    Object.keys(lib).forEach(key => {
      try {
        const value = lib[key];
        if (value && typeof value === 'object' && !visited.has(value)) {
          patchLibrary(value, depth + 1, visited);
        }
      } catch (e) {
        // Ignore property access errors
      }
    });
  }

  // Monkey patch the unmount method that's causing the error
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Call the original method
    originalAddEventListener.call(this, type, listener, options);
    
    // If this element has events, ensure they all have clear methods
    if (this.events) {
      Object.values(this.events).forEach(event => {
        ensureHasClear(event);
        if (event.highPriority) ensureHasClear(event.highPriority);
        if (event.regular) ensureHasClear(event.regular);
      });
    }
  };
  
  console.log('[MAP-CLEAR-FIX] Initialized successfully');
})();
