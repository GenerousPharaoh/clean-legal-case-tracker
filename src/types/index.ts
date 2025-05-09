// Database types
export interface Project {
  id: string;
  name: string;
  owner_id: string;
  goal_type?: string;
  created_at: string;
  is_ai_organized?: boolean;
}

export interface File {
  id: string;
  project_id: string;
  name: string;
  exhibit_id?: string;
  storage_path: string;
  content_type: string;
  size: number;
  file_type: string;
  metadata: {
    thumbnailUrl?: string;
    tags?: string[];
    fileType?: string;
    uploadTimestamp?: number;
  };
  added_at: string;
  owner_id: string;
  uploaded_by_user_id?: string;
}

export interface Note {
  id: string;
  project_id: string;
  owner_id: string;
  user_id: string;
  content: string;
  updated_at: string;
}

export interface Link {
  id: string;
  project_id: string;
  owner_id: string;
  source_file_id: string | null;
  source_details_json: {
    type: 'exhibit' | 'custom';
    text?: string;
    exhibitId?: string;
    [key: string]: any;
  };
  target_context_json: {
    page?: number;
    timestamp?: number;
    [key: string]: any;
  };
}

export interface Entity {
  id: string;
  project_id: string;
  owner_id: string;
  entity_text: string;
  entity_type: string;
  source_file_id: string | null;
}

export interface DocumentChunk {
  id: string;
  file_id: string;
  project_id: string;
  owner_id: string;
  chunk_text: string;
  embedding?: unknown; // vector type
}

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'invited' | 'active' | 'rejected';
}

// Application state types
export interface User {
  id: string;
  email: string;
  avatar_url?: string;
  full_name?: string;
}

export interface FileWithUrl extends File {
  url?: string;
  thumbnailUrl?: string;
}

// UI types
export interface SearchFilters {
  searchTerm?: string;
  fileTypes?: string[];
  searchType?: 'combined' | 'filename' | 'content';
  tags?: string[];
  entities?: string[];
  dateFrom?: string | Date | null;
  dateTo?: string | Date | null;
}

export interface LinkActivation {
  fileId: string;
  page?: number;
  timestamp?: number;
  selection?: string;
}

// API response types
export interface AiSuggestionResponse {
  suggestions: {
    category: string;
    text: string;
  }[];
}

export interface QaResponse {
  answer: string;
  sources: string[];
}

export interface FileNameSuggestionResponse {
  suggestedNames: string[];
  nextExhibitId: string;
} 