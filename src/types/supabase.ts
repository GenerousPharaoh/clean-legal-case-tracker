export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          status: string
          user_id: string
          client_id: string | null
          priority: string | null
          due_date: string | null
          assigned_to: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          status?: string
          user_id: string
          client_id?: string | null
          priority?: string | null
          due_date?: string | null
          assigned_to?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          status?: string
          user_id?: string
          client_id?: string | null
          priority?: string | null
          due_date?: string | null
          assigned_to?: string | null
          tags?: string[] | null
        }
      }
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          organization_id: string | null
          user_id: string
          notes: string | null
          status: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          organization_id?: string | null
          user_id: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          organization_id?: string | null
          user_id?: string
          notes?: string | null
          status?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          file_path: string
          content_type: string | null
          size: number | null
          case_id: string | null
          user_id: string
          description: string | null
          tags: string[] | null
          status: string | null
          version: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          file_path: string
          content_type?: string | null
          size?: number | null
          case_id?: string | null
          user_id: string
          description?: string | null
          tags?: string[] | null
          status?: string | null
          version?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          file_path?: string
          content_type?: string | null
          size?: number | null
          case_id?: string | null
          user_id?: string
          description?: string | null
          tags?: string[] | null
          status?: string | null
          version?: number | null
        }
      }
      notes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          content: string | null
          case_id: string | null
          user_id: string
          tags: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          content?: string | null
          case_id?: string | null
          user_id: string
          tags?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          content?: string | null
          case_id?: string | null
          user_id?: string
          tags?: string[] | null
        }
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          role: string | null
          organization_id: string | null
          settings: Json | null
          email: string | null
          last_sign_in: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: string | null
          organization_id?: string | null
          settings?: Json | null
          email?: string | null
          last_sign_in?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: string | null
          organization_id?: string | null
          settings?: Json | null
          email?: string | null
          last_sign_in?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          status: string
          due_date: string | null
          case_id: string | null
          user_id: string
          assigned_to: string | null
          priority: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          status?: string
          due_date?: string | null
          case_id?: string | null
          user_id: string
          assigned_to?: string | null
          priority?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          status?: string
          due_date?: string | null
          case_id?: string | null
          user_id?: string
          assigned_to?: string | null
          priority?: string | null
          completed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 