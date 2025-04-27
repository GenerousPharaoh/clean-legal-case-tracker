import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { ProjectCollaborator } from '../types';

interface UseCollaboratorsProps {
  projectId: string | null;
}

interface UseCollaboratorsResult {
  collaborators: ProjectCollaborator[];
  loading: boolean;
  error: string | null;
  inviteClient: (email: string) => Promise<{
    success: boolean;
    message: string;
    inviteUrl?: string;
    error?: string;
  }>;
  refreshCollaborators: () => Promise<void>;
}

/**
 * Hook for fetching and managing project collaborators
 */
export const useCollaborators = ({ projectId }: UseCollaboratorsProps): UseCollaboratorsResult => {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch collaborators for a project - memoized to avoid recreating on each render
  const fetchCollaborators = useCallback(async () => {
    if (!projectId) {
      setCollaborators([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setCollaborators(data || []);
    } catch (err: any) {
      console.error('Error fetching collaborators:', err);
      setError(err.message || 'Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  }, [projectId, setCollaborators, setLoading, setError]);

  // Refresh collaborators data
  const refreshCollaborators = async () => {
    await fetchCollaborators();
  };

  // Invite a client to the project
  const inviteClient = async (email: string) => {
    if (!projectId) {
      return {
        success: false,
        message: 'No project selected',
        error: 'No project selected'
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('invite-client', {
        body: { projectId, clientEmail: email }
      });

      if (error) {
        console.error('Error inviting client:', error);
        return {
          success: false,
          message: error.message || 'Failed to send invitation',
          error: error.message
        };
      }

      // Refresh the collaborators list after successful invitation
      await refreshCollaborators();

      return {
        success: true,
        message: data.message || 'Invitation sent successfully',
        inviteUrl: data.inviteUrl
      };
    } catch (err: any) {
      console.error('Error inviting client:', err);
      return {
        success: false,
        message: 'Failed to send invitation',
        error: err.message
      };
    }
  };

  // Load collaborators on mount and when projectId changes
  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  return {
    collaborators,
    loading,
    error,
    inviteClient,
    refreshCollaborators
  };
}; 