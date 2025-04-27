import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { Link, LinkData, LinkActivation } from '../types';

interface LinkState {
  // Link activation
  activationRequest: LinkActivation | null;
  
  // Link management
  links: Link[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setActivationRequest: (request: LinkActivation | null) => void;
  setLinks: (links: Link[]) => void;
  
  // Operations
  saveLink: (linkData: LinkData, projectId: string, noteId?: string) => Promise<Link | null>;
  fetchLinks: (projectId: string) => Promise<void>;
  deleteLink: (linkId: string) => Promise<boolean>;
  updateLink: (linkId: string, updates: Partial<LinkData>) => Promise<boolean>;
}

export const useLinkStore = create<LinkState>((set, get) => ({
  // Initial state
  activationRequest: null,
  links: [],
  isLoading: false,
  error: null,
  
  // Actions
  setActivationRequest: (activationRequest) => set({ activationRequest }),
  setLinks: (links) => set({ links }),
  
  // Save a link to Supabase
  saveLink: async (linkData, projectId, noteId) => {
    try {
      // Get the user ID from the auth context
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create the link record
      const linkRecord = {
        project_id: projectId,
        owner_id: user.id,
        source_file_id: linkData.fileId,
        source_details_json: linkData,
        target_context_json: noteId ? { noteId } : null
      };
      
      const { data, error } = await supabase
        .from('links')
        .insert(linkRecord)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add the new link to state
      const newLink = data as Link;
      set((state) => ({ 
        links: [...state.links, newLink]
      }));
      
      return newLink;
    } catch (err: any) {
      console.error('Error saving link:', err);
      set({ error: err.message || 'Failed to save link' });
      return null;
    }
  },
  
  // Fetch links for a project
  fetchLinks: async (projectId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ 
        links: data as Link[],
        isLoading: false
      });
    } catch (err: any) {
      console.error('Error fetching links:', err);
      set({ 
        error: err.message || 'Failed to load links',
        isLoading: false
      });
    }
  },

  // Delete a link from Supabase
  deleteLink: async (linkId) => {
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
      
      // Remove the link from state
      set((state) => ({
        links: state.links.filter(link => link.id !== linkId)
      }));
      
      return true;
    } catch (err: any) {
      console.error('Error deleting link:', err);
      set({ error: err.message || 'Failed to delete link' });
      return false;
    }
  },

  // Update a link in Supabase
  updateLink: async (linkId, updates) => {
    try {
      // First, get the current link
      const link = get().links.find(link => link.id === linkId);
      if (!link) throw new Error('Link not found');
      
      // Merge updates with current data
      const updatedLinkData = {
        ...link.source_details_json,
        ...updates
      };
      
      // Update in Supabase
      const { error } = await supabase
        .from('links')
        .update({ source_details_json: updatedLinkData })
        .eq('id', linkId);
      
      if (error) throw error;
      
      // Update in state
      set((state) => ({
        links: state.links.map(link => 
          link.id === linkId 
            ? { ...link, source_details_json: updatedLinkData } 
            : link
        )
      }));
      
      return true;
    } catch (err: any) {
      console.error('Error updating link:', err);
      set({ error: err.message || 'Failed to update link' });
      return false;
    }
  }
}));

// Helper constants for link management
export const LINK_PREFIX = 'CLARITY_LINK:';

// Helper functions for link parsing
export const isLinkString = (text: string): boolean => {
  return text.startsWith(LINK_PREFIX);
};

export const parseLinkString = (text: string): LinkData | null => {
  if (!isLinkString(text)) return null;
  
  try {
    const jsonString = text.substring(LINK_PREFIX.length);
    return JSON.parse(jsonString) as LinkData;
  } catch (err) {
    console.error('Error parsing link data:', err);
    return null;
  }
};

export const stringifyLinkData = (linkData: LinkData): string => {
  return `${LINK_PREFIX}${JSON.stringify(linkData)}`;
}; 