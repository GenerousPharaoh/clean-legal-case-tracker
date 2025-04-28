import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

// Define an interface for the project structure based on schema.sql
export interface Project {
  id: string;
  owner_id: string;
  name: string;
  goal_type: string | null;
  created_at: string;
}

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setLoading(false);
        setProjects([]); // No user, no projects
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          // RLS policy ensures only user's projects are fetched
          // .eq('owner_id', user.id) // RLS handles this, but explicit check is fine too
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setProjects(data as Project[]);
      } catch (err: any) {
        console.error("Error fetching projects:", err);
        setError(err.message || 'Failed to fetch projects');
        setProjects(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    // Optional: Set up a realtime subscription to projects table
    // This might be overkill for phase 1 but good for future updates
    /*
    const channel = supabase
      .channel('public:projects')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `owner_id=eq.${user?.id}` },
        (payload) => {
          console.log('Change received!', payload);
          fetchProjects(); // Refetch on changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    */

  }, [user]); // Refetch when user changes (login/logout)

  return { projects, loading, error };
}; 