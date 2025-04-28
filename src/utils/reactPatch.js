/**
 * This file patches ReactDOM's unmount function to prevent the
 * "this.events[e].clear is not a function" error.
 */

(function patchReactDOM() {
  // Wait until React and ReactDOM are loaded
  if (typeof window === 'undefined') return;

  const waitForReact = setInterval(() => {
    if (window.React && window.ReactDOM) {
      clearInterval(waitForReact);
      applyPatch();
    }
  }, 50);

  // Stop trying after 10 seconds
  setTimeout(() => clearInterval(waitForReact), 10000);

  function applyPatch() {
    try {
      console.info('[ReactPatch] Patching ReactDOM unmount');
      
      // Find the original unmount function
      let originalUnmount;
      
      // ReactDOM v18+
      if (ReactDOM.createRoot) {
        const originalCreateRoot = ReactDOM.createRoot;
        
        ReactDOM.createRoot = function() {
          const root = originalCreateRoot.apply(this, arguments);
          const originalUnmount = root.unmount;
          
          root.unmount = function() {
            try {
              // Apply our safety wrapper
              safeUnmount(originalUnmount, this, arguments);
            } catch (err) {
              console.error('[ReactPatch] Error in patched unmount (v18):', err);
              // Call original as fallback
              return originalUnmount.apply(this, arguments);
            }
          };
          
          return root;
        };
      }
      
      // Find the internal reconciler that does the unmounting
      const findAndPatchReconciler = () => {
        // Monkey patch to find the reconciler instance
        const originalCreateElement = React.createElement;
        let renderedElement = null;
        
        React.createElement = function() {
          renderedElement = originalCreateElement.apply(this, arguments);
          // Restore original immediately
          React.createElement = originalCreateElement;
          return renderedElement;
        };
        
        // Render a dummy element to get React internals
        const div = document.createElement('div');
        ReactDOM.render(React.createElement('div'), div);
        ReactDOM.unmountComponentAtNode(div);
        
        // Now find the reconciler through React's internals
        if (renderedElement && renderedElement._owner) {
          const fiber = renderedElement._owner;
          let current = fiber;
          
          // Walk up the fiber tree to find the hostRoot fiber
          while (current && current.tag !== 3) { // HostRoot tag is 3
            current = current.return;
          }
          
          if (current && current.stateNode) {
            const container = current.stateNode;
            
            // Patch the unmountComponentAtNode
            if (ReactDOM.unmountComponentAtNode) {
              const originalUnmountComponentAtNode = ReactDOM.unmountComponentAtNode;
              
              ReactDOM.unmountComponentAtNode = function(container) {
                try {
                  // Safety wrapper for unmounting
                  return safeUnmount(originalUnmountComponentAtNode, this, [container]);
                } catch (err) {
                  console.error('[ReactPatch] Error in patched unmountComponentAtNode:', err);
                  // Call original as fallback
                  return originalUnmountComponentAtNode.apply(this, [container]);
                }
              };
            }
          }
        }
      };
      
      findAndPatchReconciler();
      
      // Call the window.fixReactEventSystem from our mapPolyfill
      if (typeof window.fixReactEventSystem === 'function') {
        window.fixReactEventSystem();
      }
      
      console.info('[ReactPatch] ReactDOM patches applied successfully');
    } catch (err) {
      console.error('[ReactPatch] Failed to patch ReactDOM:', err);
    }
  }
  
  function safeUnmount(originalFn, thisArg, args) {
    try {
      // Safety check before unmounting
      ensureAllComponentsHaveClearMethod();
      
      // Call original
      return originalFn.apply(thisArg, args);
    } catch (err) {
      console.error('[ReactPatch] Error in unmount, applying emergency fix:', err);
      
      // Emergency fix - apply our own cleanup
      applyEmergencyCleanup();
      
      // Try again
      return originalFn.apply(thisArg, args);
    }
  }
  
  function ensureAllComponentsHaveClearMethod() {
    document.querySelectorAll('*').forEach(el => {
      if (!el) return;
      
      // React 16+: _reactEvents
      if (el._reactEvents) {
        Object.keys(el._reactEvents).forEach(eventType => {
          const events = el._reactEvents[eventType];
          if (events && !events.clear) {
            events.clear = function() {
              if (Array.isArray(this)) {
                this.length = 0;
              } else {
                Object.keys(this).forEach(key => {
                  delete this[key];
                });
              }
            };
          }
        });
      }
      
      // React 17+: __reactEvents
      if (el.__reactEvents) {
        Object.keys(el.__reactEvents).forEach(eventType => {
          const events = el.__reactEvents[eventType];
          if (events && !events.clear) {
            events.clear = function() {
              if (Array.isArray(this)) {
                this.length = 0;
              } else {
                Object.keys(this).forEach(key => {
                  delete this[key];
                });
              }
            };
          }
        });
      }
    });
  }
  
  function applyEmergencyCleanup() {
    // Remove all event listeners from all elements
    document.querySelectorAll('*').forEach(el => {
      if (!el) return;
      
      // Remove potential event data
      if (el._reactEvents) {
        Object.keys(el._reactEvents).forEach(k => delete el._reactEvents[k]);
        delete el._reactEvents;
      }
      
      if (el.__reactEvents) {
        Object.keys(el.__reactEvents).forEach(k => delete el.__reactEvents[k]);
        delete el.__reactEvents;
      }
      
      // React 16-17 properties
      delete el._reactListening;
      delete el.__reactFiber;
      delete el.__reactProps;
    });
    
    console.info('[ReactPatch] Emergency cleanup applied');
  }
})(); 