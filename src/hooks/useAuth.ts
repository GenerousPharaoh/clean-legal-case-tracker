import { useAuthStore } from '../store/store';

/**
 * Simple auth hook that selects authentication state from the store
 * 
 * This hook has no side effects - all authentication logic is handled
 * by the centralized auth listener in supabaseClient.ts
 * 
 * @returns Basic authentication state needed by components
 */
export const useAuth = () => {
  const { 
    session, 
    user, 
    loading,
    hasPermission,
    isProjectOwner,
    isClientUploader,
    currentProjectRole,
    setCurrentProjectRole
  } = useAuthStore();
  
  // Backwards compatibility properties
  const isAuthenticated = !!session;
  const isAdmin = user?.role === 'admin';
  
  return { 
    session, 
    user, 
    loading, 
    isAuthenticated, 
    isAdmin,
    hasPermission,
    isProjectOwner,
    isClientUploader,
    currentProjectRole,
    setCurrentProjectRole
  };
};

// Helper for manually clearing auth state from localStorage
export const clearStoredAuthSession = async () => {
  const { supabase } = await import('../supabaseClient');
  try {
    console.log('Manually clearing auth session...');
    
    // Sign out via Supabase
    await supabase.auth.signOut();
    
    // Clear any session redirects
    sessionStorage.removeItem('redirectAfterLogin');
    
    console.log('Auth session cleared. Reloading...');
    window.location.href = '/login';
  } catch (err) {
    console.error('Error clearing auth session:', err);
    // Force reload anyway
    window.location.href = '/login';
  }
}; 