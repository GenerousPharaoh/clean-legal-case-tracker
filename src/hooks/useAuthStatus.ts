import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { handleSupabaseError } from '../utils/authErrorHandler';

interface UseAuthStatusOptions {
  redirectTo?: string;
  requiresAuth?: boolean;
}

interface AuthStatus {
  loading: boolean;
  authenticated: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  refreshing: boolean;
  error: Error | null;
}

/**
 * Hook for checking authentication status
 * This hook handles all the authentication states and redirects
 */
const useAuthStatus = (options: UseAuthStatusOptions = {}) => {
  const { redirectTo, requiresAuth = false } = options;
  const navigate = useNavigate();
  
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    loading: true,
    authenticated: false,
    session: null,
    user: null,
    isAdmin: false,
    refreshing: false,
    error: null
  });
  
  // Function to refresh auth status
  const refreshAuthStatus = async (showLoading = true) => {
    if (showLoading) {
      setAuthStatus(prev => ({ ...prev, loading: true }));
    }
    
    try {
      setAuthStatus(prev => ({ ...prev, refreshing: true }));
      
      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      // Check if session exists and is valid
      if (session && session.user) {
        // Check if the token is close to expiration (within 5 minutes)
        const tokenExpiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = tokenExpiresAt.getTime() - now.getTime();
        
        // If token expires soon, refresh it
        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log('Token expires soon, refreshing...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            throw refreshError;
          }
          
          if (refreshData.session) {
            setAuthStatus({
              loading: false,
              authenticated: true,
              session: refreshData.session,
              user: refreshData.session.user,
              isAdmin: refreshData.session.user.app_metadata?.role === 'admin',
              refreshing: false,
              error: null
            });
          }
        } else {
          // Session is valid
          setAuthStatus({
            loading: false,
            authenticated: true,
            session,
            user: session.user,
            isAdmin: session.user.app_metadata?.role === 'admin',
            refreshing: false,
            error: null
          });
        }
      } else {
        // No session
        setAuthStatus({
          loading: false,
          authenticated: false,
          session: null,
          user: null,
          isAdmin: false,
          refreshing: false,
          error: null
        });
        
        // If auth is required, redirect to login
        if (requiresAuth && redirectTo) {
          navigate(redirectTo, { state: { from: window.location.pathname } });
        }
      }
    } catch (error: any) {
      console.error('Auth status check failed:', error);
      
      // Handle errors with our error handler
      handleSupabaseError(error, 'Failed to check authentication status');
      
      setAuthStatus({
        loading: false,
        authenticated: false,
        session: null,
        user: null,
        isAdmin: false,
        refreshing: false,
        error
      });
      
      // If auth is required, redirect to login
      if (requiresAuth && redirectTo) {
        navigate(redirectTo, { state: { from: window.location.pathname } });
      }
    }
  };
  
  // Check auth status on mount
  useEffect(() => {
    refreshAuthStatus();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        if (
          event === 'SIGNED_IN' || 
          event === 'TOKEN_REFRESHED' || 
          event === 'USER_UPDATED'
        ) {
          refreshAuthStatus(false);
        } else if (event === 'SIGNED_OUT') {
          setAuthStatus({
            loading: false,
            authenticated: false,
            session: null,
            user: null,
            isAdmin: false,
            refreshing: false,
            error: null
          });
          
          // If auth is required, redirect to login
          if (requiresAuth && redirectTo) {
            navigate(redirectTo, { state: { from: window.location.pathname } });
          }
        }
      }
    );
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [redirectTo, requiresAuth, navigate]);
  
  return {
    ...authStatus,
    refreshAuthStatus
  };
};

export default useAuthStatus; 