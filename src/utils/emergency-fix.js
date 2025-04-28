console.log('Applying emergency Map.clear polyfill...');

// Direct patch method without prototype modification
(function() {
  if (typeof window === 'undefined') return;

  // Store original console error
  const originalConsoleError = console.error;
  
  // Patch console.error to suppress the specific error
  console.error = function(...args) {
    // Check if this is the error we want to suppress
    const errorMessage = args.join(' ');
    if (errorMessage.includes('this.events[e].clear is not a function') || 
        errorMessage.includes('setting getter-only property "clear"')) {
      // Suppress this specific error
      console.log('[SUPPRESSED ERROR]', errorMessage);
      return;
    }
    
    // Pass through other errors to original handler
    return originalConsoleError.apply(this, args);
  };
  
  // Wait for React to be available
  const checkInterval = setInterval(() => {
    if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
      clearInterval(checkInterval);
      applyReactFix();
    }
  }, 100);
  
  // Stop checking after 10 seconds
  setTimeout(() => clearInterval(checkInterval), 10000);
  
  function applyReactFix() {
    try {
      // Direct fix for React's event handlers - this avoids prototype modification
      
      // Add this to window to make it available anywhere
      window.__fixReactEvents = function(element) {
        if (!element || typeof element !== 'object') return;
        
        try {
          // Get the events object without relying on specific property names
          const eventProps = ['_reactEvents', '__reactEvents', '_events', 'events'];
          
          eventProps.forEach(propName => {
            if (element[propName]) {
              const events = element[propName];
              
              // Iterate through event types
              Object.keys(events).forEach(eventType => {
                const eventHandlers = events[eventType];
                
                // If there's no clear method, add a no-op function
                if (eventHandlers && !eventHandlers.clear) {
                  // Define a clear method that doesn't attempt to modify a getter-only property
                  Object.defineProperty(eventHandlers, '_safeEventClear', {
                    value: function() {
                      try {
                        // Try an array-based approach first
                        if (Array.isArray(this)) {
                          // Just empty the array, keeping the object reference intact
                          while (this.length > 0) this.pop();
                          return;
                        }
                        
                        // For Map-like structures, call delete on each key
                        if (typeof this.delete === 'function' && typeof this.forEach === 'function') {
                          const keysToDelete = [];
                          this.forEach((_, key) => keysToDelete.push(key));
                          keysToDelete.forEach(key => this.delete(key));
                          return;
                        }
                        
                        // For plain objects, delete each property
                        const keys = Object.keys(this);
                        keys.forEach(key => {
                          try { delete this[key]; } catch (e) {}
                        });
                      } catch (err) {
                        console.log('[SAFE EVENT CLEAR ERROR]', err);
                      }
                    },
                    configurable: true,
                    writable: true
                  });
                  
                  // Create a getter for clear that returns our safe method
                  // This won't try to set the property directly
                  try {
                    Object.defineProperty(eventHandlers, 'clear', {
                      get: function() { 
                        return this._safeEventClear;
                      },
                      configurable: true
                    });
                  } catch (e) {
                    // If we can't define the property, we'll silently fail
                    // and let the error handler below catch the problem
                  }
                }
              });
            }
          });
        } catch (err) {
          // Silently ignore errors in the fixer itself
          console.log('[EVENT FIX ERROR]', err);
        }
      };
      
      // Apply the fix to all current DOM elements
      const applyFixToAllElements = () => {
        document.querySelectorAll('*').forEach(el => {
          try {
            window.__fixReactEvents(el);
          } catch (err) {
            // Ignore errors for individual elements
          }
        });
      };
      
      // Apply now and whenever the DOM changes
      applyFixToAllElements();
      
      // Set up a MutationObserver to catch new elements
      if (window.MutationObserver) {
        const observer = new MutationObserver(mutations => {
          // For each added node, apply our fix
          mutations.forEach(mutation => {
            if (mutation.addedNodes) {
              mutation.addedNodes.forEach(node => {
                try {
                  if (node.querySelectorAll) {
                    node.querySelectorAll('*').forEach(el => window.__fixReactEvents(el));
                  }
                  window.__fixReactEvents(node);
                } catch (err) {
                  // Ignore errors for individual elements
                }
              });
            }
          });
        });
        
        // Start observing the document
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true
        });
      }
      
      console.log('React event patch applied successfully');
    } catch (err) {
      console.log('Error applying React patch:', err);
    }
  }
  
  // Also monkey-patch React's event system directly if possible
  // This is a last resort if our other methods fail
  document.addEventListener('DOMContentLoaded', function() {
    // This runs after React has likely initialized
    try {
      if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
        const internals = window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        
        // Look for the events system
        if (internals.Events) {
          const eventSystemKeys = Object.keys(internals.Events);
          const originalEventFunctions = {};
          
          // Backup and monkey-patch event functions
          eventSystemKeys.forEach(key => {
            if (typeof internals.Events[key] === 'function') {
              originalEventFunctions[key] = internals.Events[key];
              
              // Replace with our safe version
              internals.Events[key] = function() {
                try {
                  // Try to apply our fix before the original function runs
                  if (arguments[0] && typeof arguments[0] === 'object') {
                    window.__fixReactEvents(arguments[0]);
                  }
                  
                  // Call the original function
                  return originalEventFunctions[key].apply(this, arguments);
                } catch (err) {
                  console.log('[EVENT SYSTEM ERROR]', err);
                  // Try the original as fallback
                  return originalEventFunctions[key].apply(this, arguments);
                }
              };
            }
          });
          
          console.log('React Events system successfully patched');
        }
      }
    } catch (err) {
      console.log('Error patching React Events system:', err);
    }
  });
})(); 