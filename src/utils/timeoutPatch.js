/**
 * This file patches the Material-UI useIsFocusVisible component to fix the error:
 * "Uncaught TypeError: Cannot set property clear of #<Object> which has only a getter"
 */

(function() {
  if (typeof window === 'undefined') return;

  // Add a specific patch for Material-UI's useIsFocusVisible component
  window.addEventListener('DOMContentLoaded', function() {
    // Create a safe version of the Timeout class specifically for hadFocusVisibleRecentlyTimeout
    try {
      // Fix for the specific line that's causing the error: new _useTimeout.Timeout()
      // Look for this pattern in the loaded scripts
      if (typeof window.hadFocusVisibleRecentlyTimeout !== 'undefined') {
        // The variable already exists, we need to patch it
        const originalTimeout = window.hadFocusVisibleRecentlyTimeout;
        
        // Create a replacement with properly defined methods
        const safeTimeout = {
          _id: null,
          
          // Define clear as a method, not a property
          clear: function() {
            if (this._id !== null) {
              window.clearTimeout(this._id);
              this._id = null;
            }
          },
          
          // Define the start method
          start: function(delay, fn) {
            this.clear();
            this._id = window.setTimeout(() => {
              this._id = null;
              fn();
            }, delay);
          }
        };
        
        // Replace the original timeout with our safe version
        window.hadFocusVisibleRecentlyTimeout = safeTimeout;
        
        console.log('[FOCUS PATCH] Patched hadFocusVisibleRecentlyTimeout successfully');
      }
      
      // More aggressive approach: override the Timeout initialization in Material-UI's focus visible code
      // We need to find and patch the line that's causing the issue: const hadFocusVisibleRecentlyTimeout = new _useTimeout.Timeout();
      const originalDefineProperty = Object.defineProperty;
      
      // Override Object.defineProperty to intercept the creation of hadFocusVisibleRecentlyTimeout
      Object.defineProperty = function(obj, prop, descriptor) {
        // Check if this is the problematic property
        if (prop === 'hadFocusVisibleRecentlyTimeout') {
          console.log('[FOCUS PATCH] Intercepted hadFocusVisibleRecentlyTimeout definition');
          
          // Create a safe version of the timeout instead
          const safeTimeout = {
            _id: null,
            clear: function() {
              if (this._id !== null) {
                window.clearTimeout(this._id);
                this._id = null;
              }
            },
            start: function(delay, fn) {
              this.clear();
              this._id = window.setTimeout(() => {
                this._id = null;
                fn();
              }, delay);
            }
          };
          
          // Modify the descriptor to use our safe timeout
          descriptor.value = safeTimeout;
        }
        
        // Call the original defineProperty
        return originalDefineProperty.call(this, obj, prop, descriptor);
      };
      
      console.log('[FOCUS PATCH] Installed focus visible patch');
    } catch (e) {
      console.error('[FOCUS PATCH] Error applying focus visible patch:', e);
    }
  });
})(); 