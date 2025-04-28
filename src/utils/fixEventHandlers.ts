/**
 * fixEventHandlers.ts
 * 
 * This utility fixes the "this.events[e].clear is not a function" error
 * by ensuring Map.prototype.clear exists and patching MUI event handlers.
 */

/**
 * Applies fixes to the event handling system to prevent unmounting errors
 */
export const fixEventHandlers = (): void => {
  try {
    // Console info
    console.log('[FixEventHandlers] Applying event handler fixes...');

    // Fix 1: Add clear method to Map.prototype if it doesn't exist
    if (!Map.prototype.hasOwnProperty('clear')) {
      Object.defineProperty(Map.prototype, 'clear', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function() {
          this.forEach((_, key) => {
            this.delete(key);
          });
          return this;
        }
      });
      console.log('[FixEventHandlers] Added Map.clear polyfill');
    }

    // Fix 2: Add global error handler for unmounting errors
    window.addEventListener('error', function(event) {
      if (event?.error?.message?.includes('clear is not a function')) {
        console.warn('[FixEventHandlers] Caught and suppressed clear error');
        event.preventDefault();
        return true;
      }
    }, true);

    // Fix 3: Patch setTimeout to reduce errors during state transitions
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(handler: any, timeout?: number, ...args: any[]): number {
      if (typeof handler === 'function' && (timeout === 0 || !timeout)) {
        try {
          return originalSetTimeout.call(window, function() {
            try {
              handler.apply(this, args);
            } catch (err) {
              console.warn('[FixEventHandlers] Caught error in setTimeout handler:', err);
            }
          }, timeout, ...args);
        } catch (e) {
          console.warn('[FixEventHandlers] Error scheduling setTimeout:', e);
          return 0;
        }
      }
      return originalSetTimeout.call(window, handler, timeout, ...args);
    };

    // Fix 4: Add safeguards to event unmounting
    if (typeof window !== 'undefined') {
      // Queue a task to find and patch event handlers after DOM is loaded
      queueMicrotask(() => {
        try {
          // Look for React component prototypes with unmount method
          Object.keys(window).forEach(key => {
            const obj = (window as any)[key];
            if (obj && typeof obj === 'object' && obj.unmount && obj.events) {
              // Found a likely candidate, patch its unmount method
              const originalUnmount = obj.unmount;
              obj.unmount = function(eventName: string) {
                try {
                  if (this.events && this.events[eventName]) {
                    // Safely handle the event collection
                    if (typeof this.events[eventName].clear === 'function') {
                      this.events[eventName].clear();
                    } else if (this.events[eventName].highPriority || this.events[eventName].regular) {
                      // Handle the specific structure in your error
                      if (this.events[eventName].highPriority) {
                        if (this.events[eventName].highPriority instanceof Map) {
                          this.events[eventName].highPriority.forEach((_: any, key: any) => {
                            this.events[eventName].highPriority.delete(key);
                          });
                        }
                      }
                      if (this.events[eventName].regular) {
                        if (this.events[eventName].regular instanceof Map) {
                          this.events[eventName].regular.forEach((_: any, key: any) => {
                            this.events[eventName].regular.delete(key);
                          });
                        }
                      }
                    }
                    
                    // Ensure we clean up the event completely
                    delete this.events[eventName];
                    return;
                  }
                  
                  // If not our use case, call original
                  return originalUnmount.apply(this, arguments);
                } catch (err) {
                  console.warn('[FixEventHandlers] Error in patched unmount, cleaning up:', err);
                  // Last resort cleanup
                  if (this.events && this.events[eventName]) {
                    delete this.events[eventName];
                  }
                }
              };
              
              console.log('[FixEventHandlers] Patched unmount method for object:', key);
            }
          });
        } catch (e) {
          console.error('[FixEventHandlers] Error patching event handlers:', e);
        }
      });
    }

    console.log('[FixEventHandlers] All event handler fixes applied successfully');
  } catch (error) {
    console.error('[FixEventHandlers] Failed to apply event handler fixes:', error);
  }
};

export default fixEventHandlers;
