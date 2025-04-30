import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string;
  email?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Custom hook to fetch and manage user profile data
 * Includes defensive handling for missing profiles and auto-creation
 */
export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        setProfile(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Attempt to fetch the user's profile
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          // If this is a "not found" error, create a default profile
          if (fetchError.code === 'PGRST116') {
            console.log('[useProfile] Profile not found, creating a default profile');
            
            // Create a default profile for the user
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([{ 
                id: user.id, 
                first_name: user.email?.split('@')[0] || 'User',
                email: user.email,
                created_at: new Date().toISOString()
              }])
              .select()
              .single();
            
            if (insertError) throw insertError;
            
            setProfile(newProfile);
          } else {
            throw fetchError;
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('[useProfile] Error fetching/creating profile:', err);
        setError(err as Error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { 
    profile, 
    loading, 
    error,
    // Check if profile is ready to use (non-null and not loading)
    isReady: !loading && !!profile
  };
}; 