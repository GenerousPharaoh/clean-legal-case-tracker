import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, refreshSession as refreshSupabaseSession, hasActiveSession } from '../supabaseClient';
import { isAuthError, reportError, ErrorCategory } from '../utils/authErrorHandler';

/**
 * Custom hook for working with Supabase with enhanced error handling and retry logic
 */
const useSupabaseWithRetry = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Create a ref to prevent concurrent refresh attempts
  const refreshInProgress = useRef(false);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Session check
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const hasSession = await hasActiveSession();
      setIsAuthenticated(hasSession);
      return hasSession;
    } catch (error) {
      console.error('[useSupabaseWithRetry] Error checking session:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial session check
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Session refresh with mutex lock to prevent concurrent refreshes
  const refreshSession = useCallback(async (): Promise<boolean> => {
    // If a refresh is already in progress, wait for it to complete
    if (refreshInProgress.current) {
      console.log('[useSupabaseWithRetry] Session refresh already in progress, waiting...');
      // Wait for the existing refresh to complete (with a timeout)
      await new Promise(resolve => setTimeout(resolve, 3000));
      return isAuthenticated || false;
    }
    
    try {
      refreshInProgress.current = true;
      setIsLoading(true);
      
      // Check if we already have a session first
      const currentSession = await hasActiveSession();
      if (!currentSession) {
        console.log('[useSupabaseWithRetry] No active session to refresh');
        setIsAuthenticated(false);
        return false;
      }
      
      console.log('[useSupabaseWithRetry] Attempting to refresh session...');
      const success = await refreshSupabaseSession();
      
      if (!success) {
        console.error('[useSupabaseWithRetry] Session refresh failed');
        setIsAuthenticated(false);
        // Report the error to the UI
        reportError(
          'Session expired',
          ErrorCategory.AUTH,
          'Your session has expired. Please sign in again.',
          true
        );
        return false;
      }
      
      console.log('[useSupabaseWithRetry] Session refreshed successfully');
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('[useSupabaseWithRetry] Error refreshing session:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
      refreshInProgress.current = false;
    }
  }, [isAuthenticated]);

  const retryWithBackoff = useCallback(
    async <T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
      let retries = 0;
      let delay = initialDelay;

      while (true) {
        try {
          // If we're offline, wait for online status
          if (!isOnline) {
            console.log('[useSupabaseWithRetry] Offline, waiting for connection...');
            await new Promise(resolve => {
              const checkOnline = () => {
                if (navigator.onLine) {
                  window.removeEventListener('online', checkOnline);
                  resolve(true);
                }
              };
              window.addEventListener('online', checkOnline);
            });
          }

          // Check authentication before making request
          if (isAuthenticated === false) {
            const refreshSuccessful = await refreshSession();
            if (!refreshSuccessful) {
              throw new Error('Session expired and refresh failed');
            }
          }

          return await fn();
        } catch (error) {
          console.error(`[useSupabaseWithRetry] Error (attempt ${retries + 1}/${maxRetries}):`, error);
          
          // Check if this is an auth error
          const errorMessage = (error as Error)?.message?.toLowerCase() || '';
          const isAuthenticationError = isAuthError(error) || 
            errorMessage.includes('jwt') || 
            errorMessage.includes('authentication') || 
            errorMessage.includes('auth') ||
            errorMessage.includes('unauthorized');

          // For auth errors, try to refresh the session
          if (isAuthenticationError) {
            const refreshSuccessful = await refreshSession();
            if (!refreshSuccessful) {
              reportError(
                'Authentication failed',
                ErrorCategory.AUTH,
                'Please sign in again to continue',
                true
              );
              throw new Error('Authentication error and session refresh failed');
            }
          }
          
          // If we've retried too many times, throw the error
          if (retries >= maxRetries) {
            // Report network errors to the user
            if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
              reportError(
                'Network error',
                ErrorCategory.NETWORK,
                'Please check your internet connection and try again',
                true
              );
            }
            throw error;
          }
          
          // Otherwise, wait and retry
          retries++;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    },
    [isOnline, isAuthenticated, refreshSession]
  );
  
  // Force sign out (for critical errors)
  const forceSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      setIsAuthenticated(false);
      
      // Report the sign out to the UI
      reportError(
        'You have been signed out',
        ErrorCategory.AUTH,
        'For security reasons, you have been signed out. Please sign in again.',
        true
      );
    } catch (error) {
      console.error('[useSupabaseWithRetry] Error in force sign out:', error);
    }
  }, []);

  // Safely execute a Supabase query with retry logic
  const executeQuery = useCallback(
    async <T>(queryFn: () => Promise<T>): Promise<T> => {
      return retryWithBackoff(queryFn);
    },
    [retryWithBackoff]
  );
  
  // Create an extended client that uses our retry logic
  const getEnhancedClient = useCallback(() => {
    // Return a proxy that adds retry logic to all Supabase client methods
    return new Proxy(supabase, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        
        // If the property is not a function or a special property like 'auth', return it as is
        if (typeof value !== 'function' && typeof value !== 'object') {
          return value;
        }
        
        // Handle special cases like auth, storage, etc.
        if (prop === 'auth' || prop === 'storage' || prop === 'functions') {
          return value;
        }
        
        // For functions that return a builder (like .from()), we need to wrap them
        if (typeof value === 'function') {
          return (...args: any[]) => {
            const result = value.apply(target, args);
            
            // If the result is a query builder, wrap its methods with retry logic
            if (result && typeof result === 'object') {
              return new Proxy(result, {
                get(builderTarget, builderProp, builderReceiver) {
                  const builderValue = Reflect.get(builderTarget, builderProp, builderReceiver);
                  
                  // Only wrap terminal methods (select, insert, update, delete, etc.)
                  if (typeof builderValue === 'function' && [
                    'select', 'insert', 'update', 'delete', 'upsert', 'rpc', 'execute'
                  ].includes(String(builderProp))) {
                    return (...builderArgs: any[]) => {
                      return executeQuery(() => {
                        return builderValue.apply(builderTarget, builderArgs);
                      });
                    };
                  }
                  
                  return builderValue;
                }
              });
            }
            
            return result;
          };
        }
        
        // For objects, return them as is
        return value;
      }
    });
  }, [executeQuery]);


  return {
    supabase,
    isAuthenticated,
    isLoading,
    isOnline,
    checkSession,
    refreshSession,
    forceSignOut,
    retryWithBackoff,
    executeQuery,
    getEnhancedClient
  };
};

export default useSupabaseWithRetry; 