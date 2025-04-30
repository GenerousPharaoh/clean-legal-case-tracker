// Base types for database records
export interface BaseDBRecord {
  id: string;
  created_at: string;
}

// Case record (renamed from Project)
export interface Case extends BaseDBRecord {
  name: string;
  description?: string;
  created_by: string;  // References auth.users.id
  owner_id?: string;   // Legacy field, same as created_by for compatibility
  project_id?: string;
  tags?: string[];
  is_archived?: boolean;
  status?: string;
}

// Note record
export interface Note extends BaseDBRecord {
  project_id: string;
  owner_id: string;
  content: string | null;
  updated_at: string;
}

// Link record
export interface Link extends BaseDBRecord {
  project_id: string;
  owner_id: string;
  source_file_id: string;
  source_details_json: LinkData;
  target_context_json?: { noteId: string };
}

// Base link data interface
export interface BaseLinkData {
  fileId: string;
  fileName?: string;
  type: 'pdf' | 'media' | 'file_link';
  exhibitId?: string;
}

// PDF-specific link data
export interface PdfLinkData extends BaseLinkData {
  type: 'pdf';
  page: number;
  selection?: string;
  coordinates?: number[];
}

// Media-specific link data
export interface MediaTimestampLinkData extends BaseLinkData {
  type: 'media';
  timestamp: number;
  mediaType: 'audio' | 'video';
}

// Simple file link data (no specific location)
export interface FileLinkData extends BaseLinkData {
  type: 'file_link';
  // No additional properties needed beyond the base
}

// Union type for link data
export type LinkData = PdfLinkData | MediaTimestampLinkData | FileLinkData;

// Save status for note editing
export type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

// Link activation data for navigating to linked content
export interface LinkActivation {
  fileId: string;
  page?: number;
  timestamp?: number;
  selectionText?: string;
  coordinates?: number[];
}

// Enum for user roles
export enum UserRole {
  OWNER = 'owner',
  CLIENT_UPLOADER = 'client_uploader',
  VIEWER = 'viewer'
}

// Project collaborator type
export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id?: string;
  email?: string;
  role: UserRole;
  invited_by: string;
  invite_token?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  accepted_at?: string;
}

// Extended project type with collaborator info
export interface ProjectWithCollaborators extends Case {
  collaborators?: ProjectCollaborator[];
} 