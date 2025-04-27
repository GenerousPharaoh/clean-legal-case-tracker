import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { UserRole, Case } from '../types';
import { reportError, ErrorCategory } from '../utils/authErrorHandler';

// Extended user type with additional profile information
interface ExtendedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: string;
  organization?: string;
  lastLogin?: Date;
}

// Auth state interface
interface AuthState {
  session: Session | null;
  user: ExtendedUser | null;
  loading: boolean;
  currentProjectRole: UserRole | null;
  lastTokenRefresh: Date | null;
  
  // Session management
  setSession: (session: Session | null) => void;
  setUser: (user: ExtendedUser | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setCurrentProjectRole: (role: UserRole | null) => void;
  
  // Token management
  refreshToken: () => Promise<boolean>;
  updateLastTokenRefresh: () => void;
  
  // Permission helpers
  isProjectOwner: () => boolean;
  isClientUploader: () => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true, // Start in loading state until auth status is checked
  currentProjectRole: null,
  lastTokenRefresh: null,
  
  // Session management functions
  setSession: (session) => set({ session }),
  
  setUser: (user) => set({ user }),
  
  clearUser: () => set({ 
    user: null, 
    session: null, 
    currentProjectRole: null,
    lastTokenRefresh: null
  }),
  
  setLoading: (loading) => set({ loading }),
  
  setCurrentProjectRole: (role: UserRole | null) => set({ currentProjectRole: role }),
  
  // Token refresh function
  refreshToken: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Failed to refresh token:', error);
        reportError(
          'Your session could not be refreshed. Please log in again.',
          ErrorCategory.AUTH
        );
        return false;
      }
      
      if (data.session) {
        set({ 
          session: data.session,
          lastTokenRefresh: new Date() 
        });
        
        // If user data is different, update it
        if (data.user && get().user?.id === data.user.id) {
          set({
            user: {
              ...(get().user || {}),
              id: data.user.id,
              email: data.user.email || get().user?.email || '',
            } as ExtendedUser
          });
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      reportError(
        'An error occurred while refreshing your session.',
        ErrorCategory.AUTH
      );
      return false;
    }
  },
  
  // Update last token refresh timestamp
  updateLastTokenRefresh: () => set({ lastTokenRefresh: new Date() }),
  
  // Permission helper functions
  isProjectOwner: () => get().currentProjectRole === UserRole.OWNER,
  
  isClientUploader: () => get().currentProjectRole === UserRole.CLIENT_UPLOADER,
  
  // General permission check function
  hasPermission: (permission: string) => {
    const { currentProjectRole } = get();
    
    switch (permission) {
      case 'edit_project':
        return currentProjectRole === UserRole.OWNER || 
               currentProjectRole === UserRole.ADMIN;
      
      case 'upload_files':
        return currentProjectRole === UserRole.OWNER || 
               currentProjectRole === UserRole.ADMIN || 
               currentProjectRole === UserRole.CLIENT_UPLOADER;
      
      case 'delete_files':
        return currentProjectRole === UserRole.OWNER || 
               currentProjectRole === UserRole.ADMIN;
      
      case 'invite_users':
        return currentProjectRole === UserRole.OWNER || 
               currentProjectRole === UserRole.ADMIN;
      
      case 'view_analytics':
        return currentProjectRole === UserRole.OWNER || 
               currentProjectRole === UserRole.ADMIN;
        
      default:
        return false;
    }
  }
}));

// Define file types for the system
export enum FileType {
  PDF = 'pdf',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document'
}

// Define file interface
export interface File {
  id: string;
  project_id: string;
  owner_id: string;
  name: string;
  storage_path: string;
  content_type: string;
  size: number;
  file_type: FileType;
  metadata?: Record<string, any>;
  added_at: string;
  uploaded_by?: string;
  exhibit_id?: string | null;
}

interface FileState {
  // Selected file
  selectedFileId: string | null;
  selectedFile: File | null;
  // File upload status
  uploading: boolean;
  uploadProgress: { [key: string]: number }; // Track progress by file id
  // Files list
  files: File[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedFileId: (fileId: string | null) => void;
  setSelectedFile: (file: File | null) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  resetUploadProgress: (fileId?: string) => void;
  setFiles: (files: File[]) => void;
  
  // CRUD Operations
  fetchFiles: (projectId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<boolean>;
  updateFile: (fileId: string, updates: Partial<File>) => Promise<boolean>;
}

export const useFileStore = create<FileState>((set, get) => ({
  selectedFileId: null,
  selectedFile: null,
  uploading: false,
  uploadProgress: {},
  files: [],
  isLoading: false,
  error: null,
  
  setSelectedFileId: (fileId) => set({ selectedFileId: fileId }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setUploading: (uploading) => set({ uploading }),
  setUploadProgress: (fileId, progress) => set(state => ({ 
    uploadProgress: { ...state.uploadProgress, [fileId]: progress } 
  })),
  resetUploadProgress: (fileId) => set(state => {
    const newProgress = { ...state.uploadProgress };
    if (fileId) {
      delete newProgress[fileId];
      return { uploadProgress: newProgress };
    }
    return { uploadProgress: {} };
  }),
  setFiles: (files) => set({ files }),
  
  // Fetch files for a project
  fetchFiles: async (projectId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('added_at', { ascending: false });
      
      if (error) throw error;
      
      set({ 
        files: data as File[],
        isLoading: false
      });
    } catch (err: any) {
      console.error('Error fetching files:', err);
      set({ 
        error: err.message || 'Failed to load files',
        isLoading: false
      });
    }
  },
  
  // Delete a file
  deleteFile: async (fileId) => {
    try {
      // First get the file to retrieve its storage path
      const file = get().files.find(f => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }
      
      // Delete the file from the database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);
      
      if (dbError) throw dbError;
      
      // Delete the file from storage
      const { error: storageError } = await supabase
        .storage
        .from('files')
        .remove([file.storage_path]);
      
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue even if storage delete fails
      }
      
      // Update the files array
      set((state) => ({
        files: state.files.filter(f => f.id !== fileId),
        // Clear selected file if it's the one being deleted
        selectedFile: state.selectedFile?.id === fileId ? null : state.selectedFile,
        selectedFileId: state.selectedFileId === fileId ? null : state.selectedFileId
      }));
      
      return true;
    } catch (err: any) {
      console.error('Error deleting file:', err);
      set({ error: err.message || 'Failed to delete file' });
      return false;
    }
  },
  
  // Update a file
  updateFile: async (fileId, updates) => {
    try {
      const { error } = await supabase
        .from('files')
        .update(updates)
        .eq('id', fileId);
      
      if (error) throw error;
      
      // Update the file in the files array
      set((state) => ({
        files: state.files.map(f => 
          f.id === fileId ? { ...f, ...updates } : f
        ),
        // Also update selected file if it's the one being updated
        selectedFile: state.selectedFile?.id === fileId 
          ? { ...state.selectedFile, ...updates }
          : state.selectedFile
      }));
      
      return true;
    } catch (err: any) {
      console.error('Error updating file:', err);
      set({ error: err.message || 'Failed to update file' });
      return false;
    }
  }
})); 