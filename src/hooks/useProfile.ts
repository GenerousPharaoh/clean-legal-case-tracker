import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

/**
 * Custom hook to fetch and manage user profile data
 * Includes defensive handling for missing profiles and auto-creation
 */
export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          .eq('id', user.id);

        if (fetchError) throw fetchError;

        // Check if profile exists
        if (!data?.length) {
          console.log('[useProfile] Profile not found, creating a default profile');
          
          // Create a default profile for the user
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{ 
              id: user.id, 
              first_name: user.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString()
            }])
            .select('*')
            .single();
          
          if (insertError) throw insertError;
          
          setProfile(newProfile);
        } else {
          setProfile(data[0]);
        }
      } catch (err) {
        console.error('[useProfile] Error fetching/creating profile:', err);
        setError(err);
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