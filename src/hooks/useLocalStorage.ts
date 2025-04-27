import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage - A hook for managing localStorage with type safety
 * 
 * Provides a stateful value that is synchronized with localStorage.
 * Includes error handling and type safety for stored values.
 * 
 * @template T The type of the stored value
 * @param {string} key The localStorage key to store the value under
 * @param {T} initialValue The initial value to use if no value is stored
 * @returns {[T, (value: T | ((val: T) => T)) => void, () => void]} A tuple containing the current value, a setter function, and a remove function
 * 
 * @example
 * // Store a simple string
 * const [name, setName, removeName] = useLocalStorage('user-name', '');
 * 
 * // Store a complex object
 * const [preferences, setPreferences, removePreferences] = useLocalStorage('user-preferences', {
 *   theme: 'light',
 *   notifications: true
 * });
 * 
 * // Update a stored object (correctly preserves state)
 * setPreferences(prev => ({
 *   ...prev,
 *   theme: 'dark'
 * }));
 */
function useLocalStorage<T>(key: string, initialValue: T) {
  // Get stored value from localStorage
  const readValue = useCallback((): T => {
    // Prevent build error "window is undefined" during server-side rendering
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Sync state with localStorage when component mounts
  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          
          // Dispatch a custom event so other instances can update
          window.dispatchEvent(new StorageEvent('storage', {
            key: key,
            newValue: JSON.stringify(valueToStore),
          }));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      // Remove from localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        
        // Reset state to initial value
        setStoredValue(initialValue);
        
        // Dispatch a custom event so other instances can update
        window.dispatchEvent(new StorageEvent('storage', {
          key: key,
          newValue: null,
        }));
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [initialValue, key]);

  // Listen for changes to this localStorage key from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
    return undefined;
  }, [initialValue, key]);

  return [storedValue, setValue, removeValue] as const;
}

export default useLocalStorage;
