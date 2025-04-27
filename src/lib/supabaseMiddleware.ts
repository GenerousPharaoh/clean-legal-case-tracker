import { supabase } from '../supabaseClient';
import { handleSupabaseError, ErrorCategory, reportError } from '../utils/authErrorHandler';

/**
 * Initialize Supabase middleware to handle common error scenarios
 * This adds global error handling for auth errors and session management
 */
export const initSupabaseMiddleware = () => {
  // Set up auth state change listener for global monitoring
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    
    // User signed out
    if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    }
    
    // User signed in
    if (event === 'SIGNED_IN' && session) {
      console.log('User signed in:', session.user?.id);
    }
    
    // Token refreshed
    if (event === 'TOKEN_REFRESHED' && session) {
      console.log('Token refreshed for user:', session.user?.id);
    }
    
    // User session updated
    if (event === 'USER_UPDATED' && session) {
      console.log('User updated:', session.user?.id);
    }
    
    // Save current auth status in localStorage for quick client-side checks
    if (session) {
      localStorage.setItem('auth_status', 'authenticated');
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('auth_status');
    }
  });
  
  // Patch the Supabase client functions to add error handling
  const originalAuthSignIn = supabase.auth.signInWithPassword;
  const originalAuthSignUp = supabase.auth.signUp;
  
  /**
   * Enhanced signInWithPassword with better error handling
   */
  supabase.auth.signInWithPassword = async (credentials) => {
    try {
      const result = await originalAuthSignIn.call(supabase.auth, credentials);
      
      if (result.error) {
        // Handle specific auth errors
        handleSupabaseError(result.error, 'Login failed');
        
        // Support for password reset
        if (result.error.message?.includes('Invalid login credentials')) {
          console.log('Invalid credentials - consider password reset');
          // Could show a special notification here with password reset option
        }
      }
      
      return result;
    } catch (error) {
      handleSupabaseError(error, 'Login failed due to an unexpected error');
      return { data: { user: null, session: null }, error: error as any };
    }
  };
  
  /**
   * Enhanced signUp with better error handling
   */
  supabase.auth.signUp = async (credentials) => {
    try {
      const result = await originalAuthSignUp.call(supabase.auth, credentials);
      
      if (result.error) {
        // Handle specific signup errors
        handleSupabaseError(result.error, 'Registration failed');
      }
      
      return result;
    } catch (error) {
      handleSupabaseError(error, 'Registration failed due to an unexpected error');
      return { data: { user: null, session: null }, error: error as any };
    }
  };
  
  // Add global fetch error handler for network issues
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Check for common auth/API errors
      if (response.status === 401) {
        // Unauthorized - token might be expired
        reportError(
          'Your session has expired', 
          ErrorCategory.AUTH, 
          'Received 401 Unauthorized response'
        );
        
        // Check if we need to redirect
        const currentSession = await supabase.auth.getSession();
        if (!currentSession.data.session) {
          // Only redirect if not on auth pages
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            window.location.href = '/login?session=expired';
          }
        }
      } else if (response.status === 403) {
        // Forbidden - user doesn't have permission
        reportError(
          'You do not have permission to access this resource', 
          ErrorCategory.PERMISSION, 
          'Received 403 Forbidden response'
        );
      } else if (response.status >= 500) {
        // Server error
        reportError(
          'Server error occurred', 
          ErrorCategory.NETWORK, 
          `Received ${response.status} server error`
        );
      }
      
      return response;
    } catch (error: any) {
      // Network errors like CORS, offline, etc.
      reportError(
        'Network error', 
        ErrorCategory.NETWORK, 
        error.message || 'Failed to complete request'
      );
      throw error;
    }
  };
  
  // Return function to clean up listeners when needed
  return () => {
    subscription?.unsubscribe();
    window.fetch = originalFetch;
    // Restore original Supabase functions
    supabase.auth.signInWithPassword = originalAuthSignIn;
    supabase.auth.signUp = originalAuthSignUp;
  };
};

export default initSupabaseMiddleware; 