import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/store';

export const useAuth = () => {
  const { session, user, loading, setSession, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setSession, setUser, setLoading]);

  return { session, user, loading };
}; 