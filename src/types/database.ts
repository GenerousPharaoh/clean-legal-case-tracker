/**
 * Database type definitions
 * Generated types that match the database schema
 */

// Base types for database records
export interface BaseDBRecord {
  id: string;
  created_at: string;
  updated_at?: string;
}

// User profile in the database
export interface Profile extends BaseDBRecord {
  id: string; // References auth.users.id
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email?: string;
  role?: string;
}

// Case in the database
export interface Case extends BaseDBRecord {
  name: string;
  description?: string;
  created_by: string; // References auth.users.id
  owner_id?: string; // Legacy field, same as created_by for backward compatibility
  status?: string;
  project_id?: string;
  is_archived?: boolean;
  tags?: string[];
}

// Document in the database
export interface Document extends BaseDBRecord {
  name: string;
  case_id: string; // References cases.id
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string; // References auth.users.id
}

// Note in the database
export interface Note extends BaseDBRecord {
  case_id: string; // References cases.id
  created_by: string; // References auth.users.id
  content: string;
}

// Project collaborator type
export interface ProjectCollaborator extends BaseDBRecord {
  project_id: string;
  user_id?: string;
  email?: string;
  role: string;
  invited_by: string;
  invite_token?: string;
  status: 'pending' | 'accepted' | 'rejected';
  accepted_at?: string;
}
