/**
 * This file contains a fix for Material-UI's useTimeout component
 * Addresses the error: "Cannot set property clear of #<Object> which has only a getter"
 */

(function() {
  if (typeof window === 'undefined') return;

  // Wait for modules to load
  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      try {
        // Create a patched version of the Timeout class
        const PatchedTimeout = function() {
          this._id = null;
          
          // Create a safe version of clear that doesn't rely on property setting
          this._clearTimeout = function() {
            if (this._id !== null) {
              window.clearTimeout(this._id);
              this._id = null;
            }
          };
          
          // Getter for clear method
          Object.defineProperty(this, 'clear', {
            get: function() {
              return this._clearTimeout;
            },
            configurable: true
          });
          
          // Create disposeEffect method
          this.disposeEffect = function() {
            return this._clearTimeout.bind(this);
          };
          
          // Create start method
          this.start = function(delay, fn) {
            this._clearTimeout();
            this._id = window.setTimeout(() => {
              this._id = null;
              fn();
            }, delay);
          };
          
          return this;
        };
        
        // Add static create method
        PatchedTimeout.create = function() {
          return new PatchedTimeout();
        };
        
        // Try to patch @mui/utils/useTimeout directly using dynamic import instead of require
        try {
          // Use dynamic import instead of window.require
          if (typeof import === 'function') {
            import('@mui/utils').then(muiUtils => {
              if (muiUtils && muiUtils.Timeout) {
                // Replace the Timeout class
                muiUtils.Timeout = PatchedTimeout;
                console.log('[MUI FIX] Successfully patched @mui/utils Timeout class');
              }
            }).catch(e => {
              console.log('[MUI FIX] Could not patch using dynamic import:', e.message);
            });
          }
        } catch (e) {
          console.log('[MUI FIX] Could not patch using dynamic import:', e.message);
        }
        
        // Global patch for any script that might create a Timeout
        window.__patchedMUITimeout = PatchedTimeout;
        
        // Monkey patch for scripts that directly reference the Timeout class
        // Look for scripts with useTimeout or Timeout
        document.querySelectorAll('script').forEach(function(script) {
          if (script.textContent && 
              (script.textContent.includes('new Timeout') || 
               script.textContent.includes('useTimeout'))) {
            
            // Inject our patched version
            const fixScript = document.createElement('script');
            fixScript.textContent = `
              try {
                // Replace Timeout constructor
                const originalTimeout = window.Timeout || {};
                window.Timeout = window.__patchedMUITimeout || ${PatchedTimeout.toString()};
                
                // Keep any static methods from the original
                if (originalTimeout) {
                  Object.keys(originalTimeout).forEach(key => {
                    if (typeof originalTimeout[key] === 'function' && key !== 'create') {
                      window.Timeout[key] = originalTimeout[key];
                    }
                  });
                }
                
                console.log('[MUI FIX] Injected patched Timeout class');
              } catch (e) {
                console.error('[MUI FIX] Error injecting patch:', e);
              }
            `;
            
            // Insert right after the original script
            script.parentNode.insertBefore(fixScript, script.nextSibling);
          }
        });
        
        console.log('[MUI FIX] Material-UI Timeout patch applied');
      } catch (e) {
        console.error('[MUI FIX] Error applying patch:', e);
      }
    }, 0);
  });
})(); 