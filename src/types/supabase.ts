export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      files: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          exhibit_id?: string;
          storage_path: string;
          content_type: string;
          size: number;
          file_type: string;
          metadata: Json;
          added_at: string;
          owner_id: string;
          uploaded_by_user_id?: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          exhibit_id?: string;
          storage_path: string;
          content_type: string;
          size: number;
          file_type: string;
          metadata?: Json;
          added_at?: string;
          owner_id: string;
          uploaded_by_user_id?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          exhibit_id?: string;
          storage_path?: string;
          content_type?: string;
          size?: number;
          file_type?: string;
          metadata?: Json;
          added_at?: string;
          owner_id?: string;
          uploaded_by_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "files_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_uploaded_by_user_id_fkey";
            columns: ["uploaded_by_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      notes: {
        Row: {
          id: string;
          project_id: string;
          owner_id: string;
          user_id: string;
          content: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          owner_id: string;
          user_id: string;
          content?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          owner_id?: string;
          user_id?: string;
          content?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          goal_type?: string;
          created_at: string;
          is_ai_organized?: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          goal_type?: string;
          created_at?: string;
          is_ai_organized?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          goal_type?: string;
          created_at?: string;
          is_ai_organized?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      document_chunks: {
        Row: {
          id: string;
          file_id: string;
          project_id: string;
          owner_id: string;
          chunk_text: string;
          embedding?: unknown; // vector(768)
        };
        Insert: {
          id?: string;
          file_id: string;
          project_id: string;
          owner_id: string;
          chunk_text: string;
          embedding?: unknown;
        };
        Update: {
          id?: string;
          file_id?: string;
          project_id?: string;
          owner_id?: string;
          chunk_text?: string;
          embedding?: unknown;
        };
        Relationships: [
          {
            foreignKeyName: "document_chunks_file_id_fkey";
            columns: ["file_id"];
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_chunks_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_chunks_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 