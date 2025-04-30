import { supabase } from '../supabaseClient';
import type { Case, Profile, Document, Note } from '../types/database';

/**
 * Type-safe database service layer
 */

// Profile functions
export const profileService = {
  async getById(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('[profileService] Error fetching profile:', error);
      return null;
    }
    
    return data as Profile;
  },
  
  async createOrUpdate(profile: Partial<Profile> & { id: string }): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    
    if (error) {
      console.error('[profileService] Error creating/updating profile:', error);
      return null;
    }
    
    return data as Profile;
  },
  
  async ensureExists(userId: string, email?: string): Promise<Profile | null> {
    // First check if profile exists
    const existingProfile = await this.getById(userId);
    if (existingProfile) return existingProfile;
    
    // Create default profile if it doesn't exist
    return this.createOrUpdate({
      id: userId,
      first_name: email ? email.split('@')[0] : 'User',
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
};

// Case functions
export const caseService = {
  async getById(caseId: string): Promise<Case | null> {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
    
    if (error) {
      console.error('[caseService] Error fetching case:', error);
      return null;
    }
    
    return data as Case;
  },
  
  async getAll(showArchived: boolean = false): Promise<Case[]> {
    let query = supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!showArchived) {
      query = query.eq('is_archived', false);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[caseService] Error fetching cases:', error);
      return [];
    }
    
    return data as Case[];
  },
  
  async create(caseData: Omit<Case, 'id' | 'created_at'>): Promise<Case | null> {
    // Make sure we include both owner_id and created_by for backward compatibility
    // This handles the foreign key constraint issue by ensuring both fields reference the same user
    const { created_by, owner_id, ...otherData } = caseData;
    const userId = created_by || owner_id;
    
    if (!userId) {
      console.error('[caseService] Error creating case: No user ID provided');
      return null;
    }
    
    const { data, error } = await supabase
      .from('cases')
      .insert([{
        ...otherData,
        created_by: userId,
        owner_id: userId // Include both fields for backward compatibility
      }])
      .select()
      .single();
    
    if (error) {
      console.error('[caseService] Error creating case:', error);
      return null;
    }
    
    return data as Case;
  },
  
  async update(caseId: string, updates: Partial<Case>): Promise<Case | null> {
    // For updates that include created_by or owner_id, make sure both are set
    // to maintain backward compatibility
    const updatesWithBothIds = { ...updates };
    if (updates.created_by && !updates.owner_id) {
      updatesWithBothIds.owner_id = updates.created_by;
    } else if (updates.owner_id && !updates.created_by) {
      updatesWithBothIds.created_by = updates.owner_id;
    }
    
    const { data, error } = await supabase
      .from('cases')
      .update({
        ...updatesWithBothIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', caseId)
      .select()
      .single();
    
    if (error) {
      console.error('[caseService] Error updating case:', error);
      return null;
    }
    
    return data as Case;
  },
  
  async delete(caseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId);
    
    if (error) {
      console.error('[caseService] Error deleting case:', error);
      return false;
    }
    
    return true;
  },
  
  async archive(caseId: string, archived: boolean): Promise<Case | null> {
    return this.update(caseId, { is_archived: archived });
  }
};

// Document functions
export const documentService = {
  async getByCase(caseId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[documentService] Error fetching documents:', error);
      return [];
    }
    
    return data as Document[];
  }
};

// Note functions
export const noteService = {
  async getByCase(caseId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[noteService] Error fetching notes:', error);
      return [];
    }
    
    return data as Note[];
  }
};
