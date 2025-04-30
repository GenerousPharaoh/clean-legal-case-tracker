import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { User, Session } from '@supabase/supabase-js';
import { profileService } from '../services/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export const useAuthImproved = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  // Handle auth state changes
  useEffect(() => {
    let mounted = true;

    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (mounted) {
          // If we have a session, make sure the user has a profile
          if (session?.user) {
            await profileService.ensureExists(session.user.id, session.user.email);
          }
          
          setAuthState({
            user: session?.user || null,
            session: session || null,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('[useAuthImproved] Session check error:', error);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: error as Error
          });
        }
      }
    };

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuthImproved] Auth state change:', event);
        
        if (mounted) {
          // If user signed in, ensure they have a profile
          if (event === 'SIGNED_IN' && session?.user) {
            await profileService.ensureExists(session.user.id, session.user.email);
          }
          
          setAuthState({
            user: session?.user || null,
            session: session || null,
            loading: false,
            error: null
          });
        }
      }
    );

    checkSession();

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      // Profile is handled by the auth state change listener
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('[useAuthImproved] Sign in error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { user: null, error: error as Error };
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      // Profile is handled by the auth state change listener
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('[useAuthImproved] Sign up error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { user: null, error: error as Error };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      });
      
      return { error: null };
    } catch (error) {
      console.error('[useAuthImproved] Sign out error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { error: error as Error };
    }
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signOut
  };
};
