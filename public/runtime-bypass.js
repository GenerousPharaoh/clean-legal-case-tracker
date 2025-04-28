/**
 * runtime-bypass.js
 * 
 * This script provides a runtime bypass solution by directly patching the problematic
 * code in the minified bundle after it's loaded.
 */
(function() {
  console.log('[RUNTIME-BYPASS] Initializing runtime code bypass system');

  // This script will run after the bundle is loaded and executed
  function applyRuntimeBypass() {
    try {
      // Directly patch the problematic function in the r$e object
      // We'll search all objects in the window context that match certain patterns
      
      // 1. First approach: Find any object with an unmount method that uses events
      for (const key in window) {
        if (!window.hasOwnProperty(key)) continue;
        
        const obj = window[key];
        if (obj && typeof obj === 'object' && obj !== null) {
          // Check if this object has an unmount method
          if (typeof obj.unmount === 'function') {
            console.log('[RUNTIME-BYPASS] Found object with unmount method:', key);
            
            // Check if this is likely our problematic object
            // We'll sample the function's content to see if it mentions events or clear
            const fnString = obj.unmount.toString();
            if (fnString.includes('events') && fnString.includes('clear')) {
              console.log('[RUNTIME-BYPASS] Found potential target for patching:', key);
              
              // Replace the unmount method with our safe version
              const originalUnmount = obj.unmount;
              obj.unmount = function(eventName) {
                try {
                  // Check if this call would cause our error
                  if (this.events && this.events[eventName]) {
                    console.log('[RUNTIME-BYPASS] Safely handling unmount for event:', eventName);
                    
                    // Safely handle the collection
                    if (this.events[eventName].highPriority) {
                      if (typeof this.events[eventName].highPriority.clear === 'function') {
                        this.events[eventName].highPriority.clear();
                      } else if (this.events[eventName].highPriority instanceof Map) {
                        const keys = Array.from(this.events[eventName].highPriority.keys());
                        keys.forEach(k => this.events[eventName].highPriority.delete(k));
                      } else if (typeof this.events[eventName].highPriority === 'object') {
                        Object.keys(this.events[eventName].highPriority).forEach(k => {
                          delete this.events[eventName].highPriority[k];
                        });
                      }
                    }
                    
                    if (this.events[eventName].regular) {
                      if (typeof this.events[eventName].regular.clear === 'function') {
                        this.events[eventName].regular.clear();
                      } else if (this.events[eventName].regular instanceof Map) {
                        const keys = Array.from(this.events[eventName].regular.keys());
                        keys.forEach(k => this.events[eventName].regular.delete(k));
                      } else if (typeof this.events[eventName].regular === 'object') {
                        Object.keys(this.events[eventName].regular).forEach(k => {
                          delete this.events[eventName].regular[k];
                        });
                      }
                    }
                    
                    // Delete the event completely
                    delete this.events[eventName];
                    return;
                  }
                  
                  // If it's not our problematic case, call the original
                  return originalUnmount.apply(this, arguments);
                } catch (err) {
                  console.warn('[RUNTIME-BYPASS] Caught error in patched unmount, safely continuing:', err);
                  
                  // Make sure we clean up the event to prevent future errors
                  if (this.events && this.events[eventName]) {
                    delete this.events[eventName];
                  }
                }
              };
              
              console.log('[RUNTIME-BYPASS] Successfully patched unmount method in object:', key);
            }
          }
        }
      }
      
      // 2. Second approach: Look for the specific minified function pattern
      // This will target the specific function mentioned in the error (r$e.unmount)
      const minifiedPattern = /r\$e/;
      for (const key in window) {
        if (!window.hasOwnProperty(key)) continue;
        
        // Look for any object that might contain r$e
        if (typeof window[key] === 'object' && window[key] !== null) {
          // Check all properties of this object
          for (const propKey in window[key]) {
            if (!window[key].hasOwnProperty(propKey)) continue;
            
            // If the property matches our pattern
            if (minifiedPattern.test(propKey)) {
              const target = window[key][propKey];
              
              // If it has an unmount method, patch it
              if (target && typeof target.unmount === 'function') {
                console.log('[RUNTIME-BYPASS] Found exact target minified function r$e.unmount');
                
                // Replace the unmount method
                const originalUnmount = target.unmount;
                target.unmount = function(eventName) {
                  try {
                    // Check if this would cause our error
                    if (this.events && this.events[eventName]) {
                      console.log('[RUNTIME-BYPASS] Intercepted critical unmount call for r$e');
                      
                      // Don't even try to use clear, just delete the event object
                      delete this.events[eventName];
                      return;
                    }
                    
                    // Otherwise call original
                    return originalUnmount.apply(this, arguments);
                  } catch (err) {
                    console.warn('[RUNTIME-BYPASS] Caught error in r$e.unmount, safely continuing:', err);
                    
                    // Clean up event
                    if (this.events && this.events[eventName]) {
                      delete this.events[eventName];
                    }
                  }
                };
                
                console.log('[RUNTIME-BYPASS] Successfully patched r$e.unmount');
              }
            }
          }
        }
      }
      
      // 3. Third approach: Monitor runtime errors and auto-recover
      window.addEventListener('error', function(event) {
        // Only intercept our specific error
        if (event && event.error && event.error.message && 
            event.error.message.includes('clear is not a function') &&
            event.error.stack && event.error.stack.includes('r$e.unmount')) {
          
          console.warn('[RUNTIME-BYPASS] Caught runtime error in r$e.unmount, recovering app state');
          event.preventDefault();
          
          // Try to immediately navigate to dashboard to bypass the error
          setTimeout(function() {
            try {
              // First try to prevent the UI from crashing
              const rootElem = document.getElementById('root');
              if (rootElem) {
                rootElem.innerHTML = `
                  <div style="padding: 2rem; text-align: center;">
                    <h2>Recovering Application</h2>
                    <p>Please wait while we restore your session...</p>
                    <div style="margin: 2rem 0;">
                      <button onclick="window.location.href='/dashboard'" 
                        style="padding: 0.75rem 1.5rem; background: #4a90e2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Go to Dashboard
                      </button>
                    </div>
                  </div>
                `;
              }
              
              // Then redirect
              setTimeout(function() {
                window.location.href = '/dashboard';
              }, 1500);
            } catch (e) {
              console.error('[RUNTIME-BYPASS] Error during recovery:', e);
              // Last resort: just redirect
              window.location.href = '/dashboard';
            }
          }, 0);
          
          return true;
        }
      }, true);
      
      console.log('[RUNTIME-BYPASS] Runtime bypass system initialized successfully');
    } catch (err) {
      console.error('[RUNTIME-BYPASS] Error applying runtime bypass:', err);
    }
  }
  
  // Attempt the bypass when the page loads and also periodically
  // to catch code that loads dynamically
  setTimeout(applyRuntimeBypass, 1000);
  setTimeout(applyRuntimeBypass, 3000);
  window.addEventListener('load', function() {
    setTimeout(applyRuntimeBypass, 500);
  });
})();
