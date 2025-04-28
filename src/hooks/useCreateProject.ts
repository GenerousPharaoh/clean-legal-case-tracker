import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Project } from '../store/store';
import { useAuth } from '../hooks/useAuth';

interface CreateProjectOptions {
  onSuccess?: (project: Project) => void;
  onError?: (error: Error) => void;
}

export const useCreateProject = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createProject = async (projectName: string, options?: CreateProjectOptions) => {
    if (!user) {
      const error = new Error('User must be authenticated to create a project');
      setError(error);
      options?.onError?.(error);
      return null;
    }

    if (!projectName.trim()) {
      const error = new Error('Project name cannot be empty');
      setError(error);
      options?.onError?.(error);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await supabase
        .from('projects')
        .insert([
          { 
            name: projectName.trim(),
            owner_id: user.id,
          }
        ])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      const newProject = data as Project;
      options?.onSuccess?.(newProject);
      return newProject;
    } catch (err: any) {
      console.error("Error creating project:", err);
      const error = new Error(err.message || 'Failed to create project');
      setError(error);
      options?.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProject,
    loading,
    error
  };
}; 