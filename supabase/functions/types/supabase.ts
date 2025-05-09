export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          owner_id: string
          name: string
          goal_type: string | null
          created_at: string
          is_ai_organized: boolean
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          goal_type?: string | null
          created_at?: string
          is_ai_organized?: boolean
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          goal_type?: string | null
          created_at?: string
          is_ai_organized?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      files: {
        Row: {
          id: string
          project_id: string
          owner_id: string
          name: string
          exhibit_id: string | null
          storage_path: string
          content_type: string
          size: number
          file_type: string
          metadata: Json
          added_at: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          id?: string
          project_id: string
          owner_id: string
          name: string
          exhibit_id?: string | null
          storage_path: string
          content_type: string
          size: number
          file_type: string
          metadata?: Json
          added_at?: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          owner_id?: string
          name?: string
          exhibit_id?: string | null
          storage_path?: string
          content_type?: string
          size?: number
          file_type?: string
          metadata?: Json
          added_at?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          project_id: string
          owner_id: string
          content: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          owner_id: string
          content?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          owner_id?: string
          content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      links: {
        Row: {
          id: string
          project_id: string
          owner_id: string
          source_file_id: string | null
          source_details_json: Json
          target_context_json: Json
        }
        Insert: {
          id?: string
          project_id: string
          owner_id: string
          source_file_id?: string | null
          source_details_json?: Json
          target_context_json?: Json
        }
        Update: {
          id?: string
          project_id?: string
          owner_id?: string
          source_file_id?: string | null
          source_details_json?: Json
          target_context_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "links_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_source_file_id_fkey"
            columns: ["source_file_id"]
            referencedRelation: "files"
            referencedColumns: ["id"]
          }
        ]
      }
      entities: {
        Row: {
          id: string
          project_id: string
          owner_id: string
          entity_text: string
          entity_type: string
          source_file_id: string | null
        }
        Insert: {
          id?: string
          project_id: string
          owner_id: string
          entity_text: string
          entity_type: string
          source_file_id?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          owner_id?: string
          entity_text?: string
          entity_type?: string
          source_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_source_file_id_fkey"
            columns: ["source_file_id"]
            referencedRelation: "files"
            referencedColumns: ["id"]
          }
        ]
      }
      document_chunks: {
        Row: {
          id: string
          file_id: string
          project_id: string
          owner_id: string
          chunk_text: string
          embedding: number[] | null
        }
        Insert: {
          id?: string
          file_id: string
          project_id: string
          owner_id: string
          chunk_text: string
          embedding?: number[] | null
        }
        Update: {
          id?: string
          file_id?: string
          project_id?: string
          owner_id?: string
          chunk_text?: string
          embedding?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_file_id_fkey"
            columns: ["file_id"]
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: string
          status: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: string
          status: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborators_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          p_project_id: string
        }
        Returns: {
          id: string
          file_id: string
          chunk_text: string
          similarity: number
        }[]
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
} 