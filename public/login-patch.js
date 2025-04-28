/**
 * login-patch.js
 * 
 * This script specifically targets the authentication flow to prevent the
 * "this.events[e].clear is not a function" error after login.
 */
(function() {
  console.log('[LOGIN-PATCH] Initializing login-specific error prevention');

  // We need to intercept the authentication flow to prevent the error
  // The error happens specifically after login, so we'll patch navigation events

  // Store original history methods
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  // Function to safely handle navigation after login
  function safelyHandleNavigation(originalFn, args) {
    try {
      // Check if this is a navigation after login
      const url = args[2];
      if (typeof url === 'string' && 
          (url.includes('/dashboard') || url.includes('/auth/callback') || url.includes('/login'))) {
        console.log('[LOGIN-PATCH] Intercepted post-login navigation to:', url);
        
        // Apply aggressive cleanup before navigation
        setTimeout(() => {
          try {
            // Target any potential event manager objects
            Object.keys(window).forEach(key => {
              const obj = window[key];
              if (obj && typeof obj === 'object' && obj.events) {
                // Force cleanup of all events
                Object.keys(obj.events).forEach(eventKey => {
                  try {
                    const event = obj.events[eventKey];
                    if (event) {
                      // Try to clear high priority events
                      if (event.highPriority instanceof Map) {
                        event.highPriority.clear();
                      } else if (event.highPriority) {
                        Object.keys(event.highPriority).forEach(k => {
                          delete event.highPriority[k];
                        });
                      }
                      
                      // Try to clear regular events
                      if (event.regular instanceof Map) {
                        event.regular.clear();
                      } else if (event.regular) {
                        Object.keys(event.regular).forEach(k => {
                          delete event.regular[k];
                        });
                      }
                    }
                    
                    // Delete the entire event entry
                    delete obj.events[eventKey];
                  } catch (e) {
                    console.warn('[LOGIN-PATCH] Error cleaning up event:', e);
                  }
                });
                
                // Reset events object to empty
                obj.events = {};
                console.log('[LOGIN-PATCH] Cleaned up events for object:', key);
              }
            });
            
            console.log('[LOGIN-PATCH] Pre-navigation cleanup complete');
          } catch (cleanupError) {
            console.error('[LOGIN-PATCH] Error during cleanup:', cleanupError);
          }
        }, 0);
      }
      
      // Call the original function
      return originalFn.apply(history, args);
    } catch (error) {
      console.error('[LOGIN-PATCH] Error during navigation interception:', error);
      // Still try to navigate
      return originalFn.apply(history, args);
    }
  }
  
  // Patch history methods
  history.pushState = function() {
    return safelyHandleNavigation(originalPushState, arguments);
  };
  
  history.replaceState = function() {
    return safelyHandleNavigation(originalReplaceState, arguments);
  };
  
  // Also intercept fetch and XMLHttpRequest for auth-related requests
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    try {
      // Check if this is an auth-related request
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
      if (url.includes('/auth') || url.includes('/login') || url.includes('/supabase')) {
        console.log('[LOGIN-PATCH] Intercepted auth-related fetch request');
        
        // Get the original promise
        const originalPromise = originalFetch.apply(this, arguments);
        
        // Return a wrapped promise that will cleanup after auth success
        return originalPromise.then(response => {
          // If this is a successful auth response, apply cleanup
          if (response.ok && (response.status >= 200 && response.status < 300)) {
            setTimeout(() => {
              console.log('[LOGIN-PATCH] Success response from auth request, applying preventive cleanup');
              // Forcibly clear all timeout handlers that might trigger unmount
              const highestId = setTimeout(() => {}, 0);
              for (let i = highestId; i >= highestId - 100; i--) {
                clearTimeout(i);
              }
            }, 0);
          }
          return response;
        });
      }
      
      // Otherwise just call the original
      return originalFetch.apply(this, arguments);
    } catch (error) {
      console.error('[LOGIN-PATCH] Error intercepting fetch:', error);
      return originalFetch.apply(this, arguments);
    }
  };
  
  // Specific fix for the login form submission
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.getAttribute('action')?.includes('/login') || 
        form.getAttribute('id')?.includes('login') ||
        form.getAttribute('class')?.includes('login')) {
      console.log('[LOGIN-PATCH] Intercepted login form submission');
      
      // Apply pre-emptive cleanup before the form is processed
      setTimeout(() => {
        // Add global.clear method to all objects for the login flow
        if (!Object.prototype.hasOwnProperty('clear')) {
          Object.defineProperty(Object.prototype, 'clear', {
            value: function() {
              // Only apply to objects that look like event collections
              if (this.highPriority || this.regular) {
                if (this.highPriority instanceof Map) {
                  this.highPriority.clear();
                } else if (this.highPriority) {
                  Object.keys(this.highPriority).forEach(k => {
                    delete this.highPriority[k];
                  });
                }
                
                if (this.regular instanceof Map) {
                  this.regular.clear();
                } else if (this.regular) {
                  Object.keys(this.regular).forEach(k => {
                    delete this.regular[k];
                  });
                }
              }
              return this;
            },
            configurable: true,
            writable: true,
            enumerable: false
          });
          console.log('[LOGIN-PATCH] Added temporary clear method to Object.prototype');
          
          // Remove it after a short delay
          setTimeout(() => {
            delete Object.prototype.clear;
            console.log('[LOGIN-PATCH] Removed temporary clear method from Object.prototype');
          }, 5000);
        }
      }, 0);
    }
  }, true);
  
  console.log('[LOGIN-PATCH] Login-specific patches applied successfully');
})();
