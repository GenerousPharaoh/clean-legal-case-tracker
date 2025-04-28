export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  CLIENT_UPLOADER = 'client_uploader'
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  goal_type?: string | null;
  status?: string;
  is_archived?: boolean;
  tags?: string[];
}

export interface File {
  id: string;
  name: string;
  size: number;
  created_at: string;
  updated_at?: string;
  file_type: string;
  storage_path: string;
  project_id: string;
  uploaded_by: string;
  status?: string;
  is_processed?: boolean;
  processing_error?: string | null;
  metadata?: Record<string, any> | null;
}

// Re-export types from other files for convenience
export * from './supabase';
export * from './compatibility';

// Alias Case to Project for backward compatibility
export type Case = Project; 