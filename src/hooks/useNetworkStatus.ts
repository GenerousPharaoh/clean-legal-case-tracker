import { useState, useEffect } from 'react';

/**
 * Custom hook to track network connection status.
 * 
 * @returns An object with the following properties:
 * - isOnline: boolean indicating if the user has internet connectivity
 * - wasOffline: boolean tracking if there was a recent offline state
 * - connectionSpeed: 'slow' | 'medium' | 'fast' based on connection type (when available)
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');

  useEffect(() => {
    // Handler for online status
    const handleOnline = () => {
      setIsOnline(true);
      // Keep wasOffline true for a period so UI can show a "reconnected" message
      setTimeout(() => {
        setWasOffline(false);
      }, 5000);
    };

    // Handler for offline status
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    // Handler for connection change
    const handleConnectionChange = () => {
      if ('connection' in navigator && navigator.connection) {
        const connection = navigator.connection as any;
        if (connection.effectiveType) {
          switch (connection.effectiveType) {
            case 'slow-2g':
            case '2g':
              setConnectionSpeed('slow');
              break;
            case '3g':
              setConnectionSpeed('medium');
              break;
            case '4g':
              setConnectionSpeed('fast');
              break;
            default:
              setConnectionSpeed('medium');
          }
        }
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Try to get initial connection type if available
    handleConnectionChange();
    
    // Add connection change listener if available
    if ('connection' in navigator && navigator.connection) {
      (navigator.connection as any).addEventListener('change', handleConnectionChange);
    }

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator && navigator.connection) {
        (navigator.connection as any).removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return { isOnline, wasOffline, connectionSpeed };
};
