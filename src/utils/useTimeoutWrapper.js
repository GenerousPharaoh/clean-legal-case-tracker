/**
 * A hook to safely manage timeouts in React components
 * This prevents memory leaks and addresses the "Cannot set property 'clear' of #<Object> which has only a getter" error
 */

import { useRef, useEffect, useCallback } from 'react';

/**
 * React hook that provides a safe way to use setTimeout
 * Automatically cleans up timeouts when the component unmounts
 * 
 * @returns {Object} An object with methods to manage timeouts
 */
export function useTimeout() {
  // Store all active timeouts in a ref to preserve them between renders
  const timeoutsRef = useRef([]);
  
  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);
  
  // Set a new timeout and store its ID
  const setTimeout = useCallback((callback, delay, ...args) => {
    // Safety check for callback
    if (typeof callback !== 'function') {
      console.warn('setTimeout requires a function as first argument');
      return null;
    }
    
    // Create a wrapper that removes the timeout ID from our array when it completes
    const wrappedCallback = (...callbackArgs) => {
      const id = timeoutRef;
      // Remove this timeout ID from our tracking array
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
      // Call the original callback
      return callback(...callbackArgs);
    };
    
    // Create the timeout and store its ID
    const timeoutRef = window.setTimeout(wrappedCallback, delay, ...args);
    timeoutsRef.current.push(timeoutRef);
    
    // Return the timeout ID so it can be cleared manually if needed
    return timeoutRef;
  }, []);
  
  // Clear a specific timeout by ID
  const clearTimeout = useCallback((id) => {
    window.clearTimeout(id);
    timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
  }, []);
  
  // Cleanup all timeouts when component unmounts
  useEffect(() => {
    // Return cleanup function that runs when component unmounts
    return clearAllTimeouts;
  }, [clearAllTimeouts]);
  
  return {
    setTimeout,
    clearTimeout,
    clearAllTimeouts
  };
}

/**
 * Wrapper for setTimeout that safely handles the "clear" property
 * to avoid the "Cannot set property 'clear' of #<Object> which has only a getter" error
 */
if (typeof window !== 'undefined') {
  // Save original setTimeout
  const originalSetTimeout = window.setTimeout;
  
  // Override setTimeout to return an object with a safe clear method
  window.setTimeout = function safeSetTimeout(...args) {
    const id = originalSetTimeout.apply(this, args);
    
    // Return an object with a clear method that calls clearTimeout
    return {
      id,
      clear: function() {
        window.clearTimeout(this.id);
      }
    };
  };
  
  // Add a patch for Timeout class if it exists
  // This helps with Material UI's use of timeouts
  if (typeof window.Timeout === 'function') {
    const originalTimeout = window.Timeout;
    window.Timeout = function SafeTimeout() {
      const instance = new originalTimeout();
      
      // Create safe methods
      this.set = function(callback, delay) {
        if (this._id) {
          window.clearTimeout(this._id);
        }
        this._id = window.setTimeout(callback, delay);
      };
      
      this.clear = function() {
        if (this._id) {
          window.clearTimeout(this._id);
          this._id = null;
        }
      };
      
      return this;
    };
  }
  
  // Add a global helper to patch any object that may have timeout-related methods
  window.__patchTimeoutObject = function(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (typeof obj.clear === 'function') {
      const originalClear = obj.clear;
      // Don't try to modify the original object, create a proxy
      return new Proxy(obj, {
        get(target, prop) {
          if (prop === 'clear') {
            return function(...args) {
              try {
                return originalClear.apply(target, args);
              } catch (e) {
                console.log('[TIMEOUT WRAPPER] Safely handled error in clear():', e.message);
                // Fallback implementation if original clear fails
                if (target.id) {
                  window.clearTimeout(target.id);
                  target.id = null;
                }
                if (target._id) {
                  window.clearTimeout(target._id);
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
  };
}

export default useTimeout; 