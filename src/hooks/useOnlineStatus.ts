import { useState, useEffect } from 'react';

/**
 * Hook to track online status of the browser
 * @returns boolean indicating if the browser is online
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true; // Default to true for SSR
  });

  useEffect(() => {
    // Only run this in the browser
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('Network is online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Network is offline');
      setIsOnline(false);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default useOnlineStatus; 