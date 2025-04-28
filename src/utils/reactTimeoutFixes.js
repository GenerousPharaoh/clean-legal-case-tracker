/**
 * Comprehensive fixes for React timeout issues
 * This file provides solutions for the following issues:
 * 1. "Cannot set property clear of #<Object> which has only a getter" error
 * 2. Memory leaks with useTimeout in dialogs/modals when components unmount
 * 3. Compatibility issues with Material UI and other libraries
 */

import { useRef, useEffect, useCallback } from 'react';

/**
 * React hook for safely using setTimeout in components
 * - Automatically cleans up timeouts on unmount
 * - Tracks all timeouts in a component
 * - Prevents memory leaks
 * 
 * @returns {Object} Timeout management functions
 */
export function useSafeTimeout() {
  const timeoutIds = useRef([]);
  
  const clearAllTimeouts = useCallback(() => {
    timeoutIds.current.forEach(id => {
      clearTimeout(id);
    });
    timeoutIds.current = [];
  }, []);
  
  // Set a timeout and track its ID
  const setTimeout = useCallback((callback, ms, ...args) => {
    const id = window.setTimeout(() => {
      // Remove this ID from the list when it executes
      timeoutIds.current = timeoutIds.current.filter(i => i !== id);
      // Call the original callback
      callback(...args);
    }, ms);
    
    // Store the ID
    timeoutIds.current.push(id);
    return id;
  }, []);
  
  // Clear a specific timeout
  const clearTimeout = useCallback((id) => {
    window.clearTimeout(id);
    timeoutIds.current = timeoutIds.current.filter(i => i !== id);
  }, []);
  
  // Clean up all timeouts when component unmounts
  useEffect(() => {
    return clearAllTimeouts;
  }, [clearAllTimeouts]);
  
  return {
    setTimeout,
    clearTimeout,
    clearAllTimeouts
  };
}

/**
 * Apply timeout patches across the React application
 * Should be called once at the application entry point
 */
export function patchReactTimeouts() {
  if (typeof window === 'undefined') return;
  
  // Save references to original methods
  const originalSetTimeout = window.setTimeout;
  const originalClearTimeout = window.clearTimeout;
  
  /**
   * Safe timeout tracking with automatic cleanup
   */
  const timeoutRegistry = {
    timeouts: new Map(),
    
    // Register a timeout ID with optional owner component
    register(id, owner = null) {
      this.timeouts.set(id, { owner });
      return id;
    },
    
    // Unregister a timeout ID
    unregister(id) {
      this.timeouts.delete(id);
    },
    
    // Clear all timeouts for a specific owner
    clearForOwner(owner) {
      this.timeouts.forEach((data, id) => {
        if (data.owner === owner) {
          originalClearTimeout(id);
          this.timeouts.delete(id);
        }
      });
    },
    
    // Get all timeout IDs
    getAllIds() {
      return Array.from(this.timeouts.keys());
    }
  };
  
  // Patch setTimeout to return an object with a 'clear' method
  window.setTimeout = function patchedSetTimeout(callback, delay, ...args) {
    // Create a new callback that unregisters itself when called
    const wrappedCallback = (...callbackArgs) => {
      timeoutRegistry.unregister(timeoutId);
      return callback(...callbackArgs);
    };
    
    // Set the timeout with our wrapped callback
    const timeoutId = originalSetTimeout(wrappedCallback, delay, ...args);
    
    // Register the timeout
    timeoutRegistry.register(timeoutId);
    
    // Return an enhanced timeout object
    const timeoutObj = {
      id: timeoutId,
      clear() {
        originalClearTimeout(this.id);
        timeoutRegistry.unregister(this.id);
      }
    };
    
    // Define non-enumerable property so we can find it later
    Object.defineProperty(timeoutObj, '_isEnhancedTimeout', {
      value: true,
      enumerable: false
    });
    
    return timeoutObj;
  };
  
  // Add global utility to safely handle timeout objects
  window.__reactSafeTimeout = {
    // Creates a timeout and registers it with an owner
    create(callback, delay, owner = null, ...args) {
      const id = originalSetTimeout(callback, delay, ...args);
      return timeoutRegistry.register(id, owner);
    },
    
    // Clears all timeouts for an owner
    clearAllFor(owner) {
      timeoutRegistry.clearForOwner(owner);
    },
    
    // Returns an API for a specific owner
    getOwnerAPI(owner) {
      return {
        setTimeout(callback, delay, ...args) {
          return window.__reactSafeTimeout.create(callback, delay, owner, ...args);
        },
        clearAllTimeouts() {
          window.__reactSafeTimeout.clearAllFor(owner);
        }
      };
    },
    
    // Fix getter-only properties on timeout-like objects
    fixTimeoutObject(obj) {
      if (!obj || typeof obj !== 'object') return obj;
      
      // If it already has a clear method that's not a getter, leave it alone
      const descriptor = Object.getOwnPropertyDescriptor(obj, 'clear');
      if (!descriptor || (descriptor && !descriptor.get)) return obj;
      
      if (descriptor && descriptor.get && !descriptor.set) {
        const originalClear = obj.clear;
        
        // Return a proxy object that can handle the getter-only property
        return new Proxy(obj, {
          get(target, prop) {
            if (prop === 'clear') {
              return function safeProxyClear(...args) {
                try {
                  return originalClear.apply(target, args);
                } catch (err) {
                  console.log('[TIMEOUT FIX] Safely handled clear() error:', err.message);
                  // Fallback for common timeout pattern
                  if (target.id) {
                    originalClearTimeout(target.id);
                    target.id = null;
                  }
                  if (target._id) {
                    originalClearTimeout(target._id);
                    target._id = null;
                  }
                }
              };
            }
            return target[prop];
          }
        });
      }
      
      return obj;
    }
  };
}

/**
 * Hook for components that need to create and manage their own timeouts
 * Especially useful for components that might be unmounted before timeouts complete
 * 
 * @param {Object} owner - Optional owner identifier
 * @returns {Object} Safe timeout functions for this component
 */
export function useComponentTimeout(owner = {}) {
  const ownerId = useRef(owner || {}).current;
  
  useEffect(() => {
    // Clean up all timeouts for this component when it unmounts
    return () => {
      if (window.__reactSafeTimeout) {
        window.__reactSafeTimeout.clearAllFor(ownerId);
      }
    };
  }, [ownerId]);
  
  return {
    setTimeout(callback, delay, ...args) {
      if (window.__reactSafeTimeout) {
        return window.__reactSafeTimeout.create(callback, delay, ownerId, ...args);
      }
      return window.setTimeout(callback, delay, ...args);
    },
    
    clearAllTimeouts() {
      if (window.__reactSafeTimeout) {
        window.__reactSafeTimeout.clearAllFor(ownerId);
      }
    }
  };
}

// Apply the patches when this module is imported
if (typeof window !== 'undefined') {
  patchReactTimeouts();
}

export default {
  useSafeTimeout,
  useComponentTimeout,
  patchReactTimeouts
}; 