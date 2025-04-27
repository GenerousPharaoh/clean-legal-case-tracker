import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { Note, SaveStatus } from '../types';

interface NoteState {
  // Current note state
  note: Note | null;
  content: string;
  isLoading: boolean;
  isSaving: boolean;
  saveStatus: SaveStatus;
  lastSaved: string | null;
  error: string | null;
  
  // Actions
  setNote: (note: Note | null) => void;
  setContent: (content: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setError: (error: string | null) => void;
  
  // Operations
  fetchNote: (projectId: string) => Promise<void>;
  saveNote: (projectId: string, debounced?: boolean) => Promise<void>;
  deleteNote: (noteId: string) => Promise<boolean>;
  clearNote: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  // Initial state
  note: null,
  content: '',
  isLoading: false,
  isSaving: false,
  saveStatus: 'saved',
  lastSaved: null,
  error: null,
  
  // Simple state setters
  setNote: (note) => set({ note }),
  setContent: (content) => {
    set({ content, saveStatus: 'unsaved' });
  },
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setError: (error) => set({ error }),
  
  // Clear current note state
  clearNote: () => {
    set({
      note: null,
      content: '',
      saveStatus: 'saved',
      lastSaved: null,
      error: null
    });
  },
  
  // Fetch note from Supabase
  fetchNote: async (projectId) => {
    const { isLoading } = get();
    
    // Prevent duplicate fetches
    if (isLoading) return;
    
    set({ isLoading: true, error: null });
    
    try {
      // Get the user ID from the auth context
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Query the note for this project
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .single();
      
      if (error) {
        // If no note exists yet, we'll create one later
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }
        
        // No note found, but that's not an error for us
        set({ 
          note: null, 
          content: '', 
          isLoading: false,
          saveStatus: 'saved'
        });
        return;
      }
      
      // Note found, update state
      set({ 
        note: data as Note,
        content: data.content || '',
        isLoading: false,
        saveStatus: 'saved',
        lastSaved: data.updated_at
      });
    } catch (err: any) {
      console.error('Error fetching note:', err);
      set({ 
        error: err.message || 'Failed to load note', 
        isLoading: false
      });
    }
  },
  
  // Save note to Supabase
  saveNote: async (projectId, debounced = false) => {
    const { content, isSaving, saveStatus, note } = get();
    
    // Don't save if already in progress or if there's nothing to save
    if (isSaving || (debounced && saveStatus === 'saved')) return;
    
    set({ isSaving: true, saveStatus: 'saving', error: null });
    
    try {
      // Get the user ID from the auth context
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // If we already have a note, update it
      if (note) {
        const { error } = await supabase
          .from('notes')
          .update({ content })
          .eq('id', note.id);
        
        if (error) throw error;
      } else {
        // Otherwise, create a new note
        const { data, error } = await supabase
          .from('notes')
          .insert({
            project_id: projectId,
            owner_id: user.id,
            content
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update state with the new note
        set({ note: data as Note });
      }
      
      // Update save status
      const lastSaved = new Date().toISOString();
      set({ 
        isSaving: false, 
        saveStatus: 'saved',
        lastSaved
      });
    } catch (err: any) {
      console.error('Error saving note:', err);
      set({ 
        isSaving: false, 
        saveStatus: 'error',
        error: err.message || 'Failed to save note' 
      });
    }
  },
  
  // Delete note from Supabase
  deleteNote: async (noteId) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
      
      // Clear current note state
      set({
        note: null,
        content: '',
        saveStatus: 'saved',
        lastSaved: null
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting note:', err);
      set({ error: err.message || 'Failed to delete note' });
      return false;
    }
  }
}));

// Export a debounced save function for use in components
let saveTimeout: NodeJS.Timeout | null = null;
let contentSnapshot: string | null = null;

export const debounceSave = (projectId: string, delay: number = 1500) => {
  const { content, saveStatus } = useNoteStore.getState();
  
  // Don't schedule a new save if content hasn't changed since last time
  if (contentSnapshot === content) return;
  
  // Update our snapshot of the content
  contentSnapshot = content;
  
  // Clear any existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Set a new save timeout
  saveTimeout = setTimeout(() => {
    const currentContent = useNoteStore.getState().content;
    
    // Only save if the content still matches our snapshot
    // (meaning it hasn't changed again during our delay)
    if (currentContent === contentSnapshot) {
      useNoteStore.getState().saveNote(projectId, true);
      
      // Add a small failsafe - if after 500ms the save status is still 'saving',
      // force it back to saved to prevent UI getting stuck
      setTimeout(() => {
        const { saveStatus } = useNoteStore.getState();
        if (saveStatus === 'saving') {
          useNoteStore.getState().setSaveStatus('saved');
        }
      }, 5000); // 5 second failsafe
    }
    
    saveTimeout = null;
  }, delay);
  
  // Force a save if user has been typing for a while (5 minutes)
  setTimeout(() => {
    if (saveStatus === 'unsaved' && contentSnapshot === content) {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
      useNoteStore.getState().saveNote(projectId, true);
    }
  }, 5 * 60 * 1000); // Force save after 5 minutes of unsaved changes
}; 