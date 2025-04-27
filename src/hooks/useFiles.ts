import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { File } from '../store';

export const useFiles = (projectId: string | null) => {
  const [files, setFiles] = useState<File[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: RealtimeChannel | null = null;

    const fetchFiles = async () => {
      if (!projectId) {
        setFiles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch initial files for the selected project
        const { data, error: fetchError } = await supabase
          .from('files')
          .select('*')
          .eq('project_id', projectId)
          .order('added_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setFiles(data as File[]);
      } catch (err: any) {
        console.error('Error fetching files:', err);
        setError(err.message || 'Failed to fetch files');
        setFiles(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchFiles();

    // Set up realtime subscription if projectId exists
    if (projectId) {
      subscription = supabase
        .channel(`files-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'files',
            filter: `project_id=eq.${projectId}`
          },
          (payload) => {
            console.log('Realtime update:', payload);
            // Handle different types of changes
            if (payload.eventType === 'INSERT') {
              setFiles((currentFiles) => {
                // Avoid duplicates (in case the event fires twice)
                if (currentFiles?.some(file => file.id === payload.new.id)) {
                  return currentFiles;
                }
                return [payload.new as File, ...(currentFiles || [])];
              });
            } else if (payload.eventType === 'UPDATE') {
              setFiles((currentFiles) => 
                currentFiles?.map(file => 
                  file.id === payload.new.id ? payload.new as File : file
                ) || []
              );
            } else if (payload.eventType === 'DELETE') {
              setFiles((currentFiles) => 
                currentFiles?.filter(file => file.id !== payload.old.id) || []
              );
            }
          }
        )
        .subscribe();
    }

    // Cleanup function
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [projectId]); // Re-run when projectId changes

  return { files, loading, error };
}; 