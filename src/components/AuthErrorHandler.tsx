import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useSupabaseWithRetry from '../hooks/useSupabaseWithRetry';
import { isSessionExpiredError, reportError, ErrorCategory } from '../utils/authErrorHandler';

/**
 * Component that listens for authentication errors and handles them globally
 * This includes: session expiration, token invalidation, permission errors, etc.
 * Note: Auth state change listener is now centralized in supabaseClient.ts
 */
const AuthErrorHandler: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Only need user for validation
  const { refreshSession, forceSignOut } = useSupabaseWithRetry();
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  
  useEffect(() => {
    // Handler for auth errors from the custom fetch utility
    const handleFetchError = async (event: CustomEvent) => {
      const { status, url, error } = event.detail;
      
      // If the error is a 401 or 403, handle it as an auth error
      if (status === 401 || status === 403) {
        const errorMessage = status === 401 
          ? 'Your session has expired. Please log in again.'
          : 'You do not have permission to access this resource.';
        
        reportError(
          errorMessage,
          ErrorCategory.AUTH,
          url ? `Error accessing: ${url}` : undefined
        );
        
        // Only attempt to refresh the session once to prevent infinite loops
        if (!refreshAttempted) {
          setRefreshAttempted(true);
          console.log('Attempting to refresh session after fetch error');
          
          try {
            // Use our enhanced refresh session function
            const success = await refreshSession();
            
            if (!success) {
              // If refresh fails, force sign out
              await forceSignOut();
              navigate('/login');
            } else {
              console.log('Session refreshed successfully after fetch error');
            }
          } catch (e) {
            console.error('Error during session refresh after fetch error:', e);
            await forceSignOut();
            navigate('/login');
          }
        } else {
          console.log('Session refresh already attempted, forcing sign out');
          await forceSignOut();
          navigate('/login');
        }
      }
    };

    // Handler for general auth errors
    const handleAuthError = async (event: CustomEvent) => {
      const errorDetails = event.detail || {};
      console.log('Auth error event received:', errorDetails);
      
      // Check if this is a session expiration error
      const isExpiredSession = errorDetails.error ? 
        isSessionExpiredError(errorDetails.error) : 
        false;
      
      // Only attempt to refresh the session once to prevent infinite loops
      if (!refreshAttempted) {
        setRefreshAttempted(true);
        
        try {
          console.log('Attempting to refresh session after auth error');
          const success = await refreshSession();
          
          if (!success) {
            console.log('Session refresh failed, forcing sign out');
            await forceSignOut();
            navigate('/login');
          } else {
            console.log('Session refreshed successfully after auth error');
            // Reset the flag after a successful refresh
            setRefreshAttempted(false);
          }
        } catch (e) {
          console.error('Error during session refresh after auth error:', e);
          await forceSignOut();
          navigate('/login');
        }
      } else if (isExpiredSession) {
        // If we already tried to refresh for an expired session, force sign out
        console.log('Session expired and refresh already attempted, forcing sign out');
        await forceSignOut();
        navigate('/login');
      }
    };
    
    // Handler for network status changes
    const handleOnline = () => {
      console.log('Network connection restored, checking authentication');
      // When coming back online, check if session is still valid
      // but reset the refresh attempted flag to allow a fresh attempt
      setRefreshAttempted(false);
    };

    // Add event listeners
    window.addEventListener('fetcherror', handleFetchError as EventListener);
    window.addEventListener('autherror', handleAuthError as EventListener);
    window.addEventListener('online', handleOnline);
    
    // Cleanup
    return () => {
      window.removeEventListener('fetcherror', handleFetchError as EventListener);
      window.removeEventListener('autherror', handleAuthError as EventListener);
      window.removeEventListener('online', handleOnline);
    };
  }, [navigate, refreshSession, forceSignOut, refreshAttempted]);

  // This component doesn't render anything
  return null;
};

export default AuthErrorHandler; 