import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabaseClient from '../services/supabaseClient';
import { useAppStore } from '../store';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null };
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setStoreUser = useAppStore((state) => state.setUser);

  // Simplified sign in function with better error handling
  const signIn = async (email: string, password: string) => {
    try {
      // Simple sign in with retry on failure
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // If successful, update the user state
      setUser(data.user);
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signUp = useCallback((email: string, password: string) => {
    return supabaseClient.auth.signUp({ email, password });
  }, []);

  const signOut = useCallback(() => {
    return supabaseClient.auth.signOut();
  }, []);

  const resetPassword = useCallback((email: string) => {
    return supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        setStoreUser({
          id: session.user.id,
          email: session.user.email || '',
          avatar_url: session.user.user_metadata?.avatar_url,
          full_name: session.user.user_metadata?.full_name,
        });
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          setStoreUser({
            id: session.user.id,
            email: session.user.email || '',
            avatar_url: session.user.user_metadata?.avatar_url,
            full_name: session.user.user_metadata?.full_name,
          });
        } else {
          setStoreUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setStoreUser]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }), [session, user, loading, signIn, signUp, signOut, resetPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 