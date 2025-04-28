import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/store';
import { reportError, ErrorCategory } from '../utils/authErrorHandler';

/**
 * Enhanced auth hook that standardizes authentication across the application
 * 
 * This hook combines Zustand store state management with automatic session
 * initialization and token refresh logic to provide a consistent auth API.
 * 
 * @returns A complete authentication API with state and methods
 */
export const useAuth = () => {
  // Get values and methods from the store
  const {
    session,
    user,
    loading,
    setSession,
    setUser,
    setLoading,
    refreshToken,
    clearUser,
    hasPermission,
    isProjectOwner,
    isClientUploader,
    currentProjectRole,
    setCurrentProjectRole,
    updateLastTokenRefresh
  } = useAuthStore();

  // Backwards compatibility properties
  const isAuthenticated = !!session;
  const isAdmin = user?.role === 'admin';

  // Initialize auth state (similar to what the old AuthProvider did)
  useEffect(() => {
    console.log('[Auth] Initializing auth state');
    
    // Fetch initial session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          reportError('Failed to initialize authentication', ErrorCategory.AUTH);
          clearUser();
          return;
        }
        
        if (data?.session) {
          console.log('[Auth] Session found, user is authenticated');
          setSession(data.session);
          updateLastTokenRefresh();
          
          if (data.session?.user) {
            setUser({
              id: data.session.user.id,
              email: data.session.user.email || '',
              // Other user data will be fetched in App.tsx
            });
            
            // Fetch user profile information
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url, role')
                .eq('id', data.session.user.id)
                .single();
                
              if (profileError) {
                console.error('[Auth] Error fetching profile:', profileError);
              } else if (profileData) {
                setUser({
                  id: data.session.user.id,
                  email: data.session.user.email || '',
                  firstName: profileData.first_name,
                  lastName: profileData.last_name,
                  avatarUrl: profileData.avatar_url,
                  role: profileData.role,
                });
              }
            } catch (err) {
              console.error('[Auth] Profile fetch error:', err);
            }
          } else {
            setUser(null);
          }
        } else {
          console.log('[Auth] No active session found');
          clearUser();
        }
      } catch (err) {
        console.error('[Auth] Initialization error:', err);
        reportError('Authentication initialization failed', ErrorCategory.AUTH);
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('[Auth] Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          updateLastTokenRefresh();
          setUser({
            id: newSession.user.id,
            email: newSession.user.email || ''
            // Other user data will be fetched separately
          });
        } else if (event === 'SIGNED_OUT') {
          clearUser();
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          console.log('[Auth] Token refreshed');
          setSession(newSession);
          updateLastTokenRefresh();
        } else if (event === 'USER_UPDATED' && newSession) {
          setSession(newSession);
          setUser(prev => ({
            ...prev,
            id: newSession.user.id,
            email: newSession.user.email || ''
          }));
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('[Auth] Cleaning up auth listeners');
      authListener?.subscription.unsubscribe();
    };
  }, [setSession, setUser, setLoading, clearUser, updateLastTokenRefresh]);

  // Wrap refreshToken to match the old refreshSession API
  const refreshSession = async () => {
    console.log('[Auth] Refreshing session');
    try {
      const result = await refreshToken();
      console.log('[Auth] Session refresh result:', result);
      return result;
    } catch (err) {
      console.error('[Auth] Session refresh error:', err);
      reportError('Failed to refresh session', ErrorCategory.AUTH);
      return false;
    }
  };

  // Return a combined API that works with both old and new code
  return {
    // Original context values
    session,
    user,
    loading,
    isAuthenticated,
    isAdmin,
    
    // Store methods
    setSession,
    setUser,
    setLoading,
    refreshToken,
    clearUser,
    hasPermission,
    isProjectOwner,
    isClientUploader,
    currentProjectRole,
    setCurrentProjectRole,
    updateLastTokenRefresh,
    
    // Compatibility methods
    refreshSession,
  };
}; 