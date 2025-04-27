import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { Case } from '../types';

interface ProjectState {
  // State
  selectedProjectId: string | null;
  selectedProject: Case | null;
  projects: Case[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedProjectId: (projectId: string | null) => void;
  setSelectedProject: (project: Case | null) => void;
  setProjects: (projects: Case[]) => void;
  
  // Operations
  fetchProjects: () => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<void>;
  createProject: (name: string, goalType?: string) => Promise<Case | null>;
  updateProject: (projectId: string, updates: Partial<Case>) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
  
  // RAG-related operations
  generateEmbeddingsForProject: (projectId: string) => Promise<{ success: boolean; message?: string; error?: string; }>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  selectedProjectId: null,
  selectedProject: null,
  projects: [],
  isLoading: false,
  error: null,
  
  setSelectedProjectId: (projectId) => {
    set({ selectedProjectId: projectId });
    
    // If we have projects loaded, set the selected project by ID
    const { projects } = get();
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId) || null;
      set({ selectedProject: project });
    }
  },
  
  setSelectedProject: (project) => {
    set({ 
      selectedProject: project,
      selectedProjectId: project?.id || null 
    });
  },
  
  setProjects: (projects) => set({ projects }),
  
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ 
        projects: data as Case[],
        isLoading: false
      });
      
      // Update selected project if we have a selectedProjectId
      const { selectedProjectId } = get();
      if (selectedProjectId) {
        const project = data.find(p => p.id === selectedProjectId) || null;
        set({ selectedProject: project });
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      set({ 
        error: err.message || 'Failed to load projects',
        isLoading: false
      });
    }
  },
  
  fetchProjectById: async (projectId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      
      set({
        selectedProject: data as Case,
        selectedProjectId: data.id,
        isLoading: false
      });
    } catch (err: any) {
      console.error('Error fetching project:', err);
      set({ 
        error: err.message || 'Failed to load project',
        isLoading: false
      });
    }
  },
  
  createProject: async (name, goalType = null) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name,
            goal_type: goalType
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update projects array with the new project
      const { projects } = get();
      set({ 
        projects: [data as Case, ...projects],
        isLoading: false
      });
      
      return data as Case;
    } catch (err: any) {
      console.error('Error creating project:', err);
      set({ 
        error: err.message || 'Failed to create project',
        isLoading: false
      });
      return null;
    }
  },
  
  updateProject: async (projectId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Update the project in the projects array
      const { projects, selectedProject } = get();
      const updatedProjects = projects.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      );
      
      set({ 
        projects: updatedProjects,
        isLoading: false,
        // Also update selected project if it's the one being updated
        selectedProject: selectedProject?.id === projectId 
          ? { ...selectedProject, ...updates }
          : selectedProject
      });
      
      return true;
    } catch (err: any) {
      console.error('Error updating project:', err);
      set({ 
        error: err.message || 'Failed to update project',
        isLoading: false
      });
      return false;
    }
  },
  
  deleteProject: async (projectId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Remove the project from the projects array
      const { projects, selectedProjectId } = get();
      const updatedProjects = projects.filter(project => project.id !== projectId);
      
      set({ 
        projects: updatedProjects,
        isLoading: false,
        // Clear selected project if it was the one deleted
        selectedProject: selectedProjectId === projectId ? null : get().selectedProject,
        selectedProjectId: selectedProjectId === projectId ? null : selectedProjectId
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting project:', err);
      set({ 
        error: err.message || 'Failed to delete project',
        isLoading: false
      });
      return false;
    }
  },
  
  generateEmbeddingsForProject: async (projectId) => {
    try {
      // Get all text-based files for the project
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('id, file_type')
        .eq('project_id', projectId)
        .in('file_type', ['pdf', 'document', 'image']); // Supported file types
      
      if (filesError) throw filesError;
      
      if (!files || files.length === 0) {
        return {
          success: false,
          error: 'No compatible files found in this project'
        };
      }
      
      // Start embedding generation for each file
      const results = await Promise.allSettled(
        files.map(file => 
          supabase.functions.invoke('generate-embeddings', {
            body: {
              fileId: file.id,
              projectId
            }
          })
        )
      );
      
      // Count successes and failures
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;
      
      if (failures > 0) {
        return {
          success: successes > 0,
          message: `Generated embeddings for ${successes} of ${files.length} files.`,
          error: failures > 0 ? `Failed to process ${failures} files.` : undefined
        };
      }
      
      return {
        success: true,
        message: `Successfully generated embeddings for ${successes} files.`
      };
    } catch (err: any) {
      console.error('Error generating embeddings for project:', err);
      return {
        success: false,
        error: err.message || 'Failed to generate embeddings'
      };
    }
  }
})); 