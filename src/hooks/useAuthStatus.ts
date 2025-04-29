import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { handleSupabaseError } from '../utils/authErrorHandler';
import { useAuth } from './useAuth';

interface UseAuthStatusOptions {
  redirectTo?: string;
  requiresAuth?: boolean;
}

interface AuthStatus {
  loading: boolean;
  authenticated: boolean;
  isAdmin: boolean;
  refreshing: boolean;
  error: Error | null;
}

/**
 * Hook for checking authentication status
 * This hook uses the centralized auth state from useAuth
 */
const useAuthStatus = (options: UseAuthStatusOptions = {}) => {
  const { redirectTo, requiresAuth = false } = options;
  const navigate = useNavigate();
  
  // Get auth state from the centralized hook
  const { loading, session, user, isAdmin } = useAuth();
  
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    loading: true,
    authenticated: false,
    isAdmin: false,
    refreshing: false,
    error: null
  });
  
  // Update local state when auth state changes
  useEffect(() => {
    setAuthStatus({
      loading,
      authenticated: !!session,
      isAdmin: !!isAdmin,
      refreshing: false,
      error: null
    });
    
    // Handle redirects based on auth state
    if (!loading) {
      if (requiresAuth && !session && redirectTo) {
        navigate(redirectTo, { state: { from: window.location.pathname } });
      }
    }
  }, [loading, session, isAdmin, requiresAuth, redirectTo, navigate]);
  
  return {
    ...authStatus,
    session,
    user,
    // For backwards compatibility, provide a no-op refresh function
    refreshAuthStatus: () => console.log('Auth refresh not needed - using centralized auth state')
  };
};

export default useAuthStatus; 