/**
 * This file directly patches React's useTimeout implementation to bypass
 * the "Cannot set property clear of #<Object> which has only a getter" error
 */

(function() {
  if (typeof window === 'undefined') return;

  // Wait until the DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Give React a moment to initialize
    setTimeout(patchTimeoutComponent, 100);
  });
  
  function patchTimeoutComponent() {
    try {
      // Flag to prevent recursive setTimeout calls
      let isPatching = false;
      
      // Function to find the problematic timeout component 
      const findAndPatchTimeouts = () => {
        // Prevent recursive calls
        if (isPatching) return;
        isPatching = true;
        
        try {
          // Look for objects with the problematic clear property
          const timeoutObjects = [];
          
          // Walk the window object to find potential React instances
          const walkObject = (obj, path = "", depth = 0) => {
            if (depth > 3) return; // Limit recursion depth
            
            try {
              // Check if this object has a problematic setter
              if (obj && typeof obj === 'object') {
                const descriptor = Object.getOwnPropertyDescriptor(obj, 'clear');
                if (descriptor && descriptor.get && !descriptor.set) {
                  timeoutObjects.push({ object: obj, path });
                }
                
                // Look for timeout-related properties
                if (obj.timeoutID !== undefined || 
                    obj._timeoutID !== undefined || 
                    (typeof obj.clear === 'function' && 
                    (obj.hasOwnProperty('id') || obj.hasOwnProperty('_id')))) {
                  timeoutObjects.push({ object: obj, path: path + '.timeout' });
                }
                
                // Traverse child properties
                if (depth < 2) { // Limit object traversal depth to avoid performance issues
                  Object.keys(obj).forEach(key => {
                    try {
                      // Skip DOM nodes and functions
                      if (obj[key] && 
                          typeof obj[key] === 'object' && 
                          !(obj[key] instanceof Node) && 
                          !(obj[key] instanceof Window)) {
                        walkObject(obj[key], path + "." + key, depth + 1);
                      }
                    } catch (e) {
                      // Silently skip properties that can't be accessed
                    }
                  });
                }
              }
            } catch (e) {
              // Ignore errors while traversing objects
            }
          };
          
          // Function to patch MUI useTimeout implementation
          const patchMUIUseTimeout = () => {
            // Look in potential global namespaces where MUI might be exposed
            const potentialMUIObjects = [
              window.MaterialUI,
              window.MUI,
              window['@mui']
            ].filter(Boolean);
            
            // Check common patterns for React components
            if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && 
                window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers) {
              const renderers = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers;
              renderers.forEach(renderer => {
                try {
                  walkObject(renderer, "renderer", 0);
                } catch (e) {
                  // Skip errors
                }
              });
            }
            
            potentialMUIObjects.forEach(mui => {
              try {
                walkObject(mui, "mui", 0);
              } catch (e) {
                // Skip errors
              }
            });
          };
          
          // Search for React components in the DOM
          const findReactComponents = () => {
            // Find all root React nodes
            document.querySelectorAll('[data-reactroot]').forEach(root => {
              // Get React internal instance
              const key = Object.keys(root).find(key => 
                key.startsWith('__reactInternalInstance$') || 
                key.startsWith('__reactFiber$')
              );
              
              if (root[key]) {
                try {
                  walkObject(root[key], "reactInstance", 0);
                } catch (e) {
                  // Skip errors
                }
              }
            });
          };
          
          // Apply patches
          patchMUIUseTimeout();
          findReactComponents();
          
          // For each found timeout object, apply our patch
          let patchedCount = 0;
          timeoutObjects.forEach(({ object }) => {
            // Only apply patch to objects that haven't been patched already
            if (object && typeof object.clear === 'function' && !object._safeTimeoutPatched) {
              // Create safe clear function
              const originalClear = object.clear;
              
              // Mark this object as patched to avoid double-patching
              object._safeTimeoutPatched = true;
              
              // Create a proxy method that wraps the original
              const safeProxy = function(...args) {
                try {
                  // Call original
                  return originalClear.apply(object, args);
                } catch (err) {
                  console.log('[TIMEOUT PATCH] Safely handled error in clear():', err.message);
                  // Fallback implementation
                  if (object.id) {
                    clearTimeout(object.id);
                    object.id = null;
                  }
                  if (object._id) {
                    clearTimeout(object._id);
                    object._id = null;
                  }
                }
              };
              
              // Store the proxy on the object but don't try to replace the getter
              object._safeClearProxy = safeProxy;
              
              // Create a custom handler for any future uses of clear()
              const handler = {
                get: function(target, prop) {
                  if (prop === 'clear') {
                    return target._safeClearProxy;
                  }
                  return target[prop];
                }
              };
              
              // If possible, wrap the entire object in a Proxy
              try {
                // This won't modify the original object but will intercept calls to .clear
                const proxiedObject = new Proxy(object, handler);
                
                // Try to replace references to this object where possible
                // This is a best-effort approach and may not work in all cases
                if (object.__proto__ && object.__proto__.__proto__) {
                  const parent = Object.keys(object.__proto__.__proto__).find(key => 
                    object.__proto__.__proto__[key] === object
                  );
                  
                  if (parent) {
                    try {
                      object.__proto__.__proto__[parent] = proxiedObject;
                    } catch (e) {
                      // Cannot replace reference, continue with monkey patch
                    }
                  }
                }
                
                patchedCount++;
              } catch (e) {
                console.log('[TIMEOUT PATCH] Unable to proxy timeout object:', e.message);
              }
            }
          });
          
          if (patchedCount > 0) {
            console.log(`[TIMEOUT PATCH] Patched ${patchedCount} timeout objects`);
          }
        } finally {
          // Always reset the flag
          isPatching = false;
        }
      };
      
      // Create a safer implementation of setTimeout that won't cause recursion
      const originalSetTimeout = window.setTimeout;
      
      // Track if we already have a patch scheduled
      let patchPending = false;
      
      // A non-recursive, time-limited way to schedule our patches
      const schedulePatch = () => {
        if (patchPending || isPatching) return;
        patchPending = true;
        
        // Use requestAnimationFrame instead of setTimeout to avoid recursion
        requestAnimationFrame(() => {
          findAndPatchTimeouts();
          patchPending = false;
        });
      };
      
      // Replace setTimeout with a version that schedules our patch after each call
      window.setTimeout = function(...args) {
        const id = originalSetTimeout.apply(this, args);
        schedulePatch();
        return id;
      };
      
      // Run initially
      findAndPatchTimeouts();
      
      // Add a global function to re-run the patch
      window.__patchReactTimeouts = findAndPatchTimeouts;
      
      console.log('[TIMEOUT PATCH] Timeout patches applied');
    } catch (err) {
      console.error('[TIMEOUT PATCH] Error patching timeout:', err);
    }
  }
})(); 