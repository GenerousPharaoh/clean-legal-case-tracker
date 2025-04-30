#!/bin/bash

# Comprehensive Fix Script for Legal Case Tracker
# This script fixes all known issues with the app:
# - Database schema mismatches
# - Foreign key constraints 
# - Authentication flow issues
# - Code organization problems
# - Error handling

set -e

echo "🔧 Starting comprehensive fix for Legal Case Tracker..."

# Install required dependencies
echo "📦 Installing dependencies..."
npm install @supabase/supabase-js dotenv

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

# Fix database issues
echo "🗄️ Fixing database issues..."

# Create missing type definitions
echo "📝 Creating improved type definitions..."
cat > src/types/database.ts << 'EOF'
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
EOF

echo "✅ Created improved database type definitions"

# Create a TypeScript service for type-safe Supabase operations
echo "🔌 Creating database service layer..."
cat > src/services/database.ts << 'EOF'
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
    const { data, error } = await supabase
      .from('cases')
      .insert([caseData])
      .select()
      .single();
    
    if (error) {
      console.error('[caseService] Error creating case:', error);
      return null;
    }
    
    return data as Case;
  },
  
  async update(caseId: string, updates: Partial<Case>): Promise<Case | null> {
    const { data, error } = await supabase
      .from('cases')
      .update({
        ...updates,
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
EOF

echo "✅ Created database service layer"

# Create improved authentication hook
echo "🔒 Creating improved auth hook..."
cat > src/hooks/useAuthImproved.ts << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { User, Session } from '@supabase/supabase-js';
import { profileService } from '../services/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export const useAuthImproved = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  // Handle auth state changes
  useEffect(() => {
    let mounted = true;

    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (mounted) {
          // If we have a session, make sure the user has a profile
          if (session?.user) {
            await profileService.ensureExists(session.user.id, session.user.email);
          }
          
          setAuthState({
            user: session?.user || null,
            session: session || null,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('[useAuthImproved] Session check error:', error);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: error as Error
          });
        }
      }
    };

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuthImproved] Auth state change:', event);
        
        if (mounted) {
          // If user signed in, ensure they have a profile
          if (event === 'SIGNED_IN' && session?.user) {
            await profileService.ensureExists(session.user.id, session.user.email);
          }
          
          setAuthState({
            user: session?.user || null,
            session: session || null,
            loading: false,
            error: null
          });
        }
      }
    );

    checkSession();

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      // Profile is handled by the auth state change listener
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('[useAuthImproved] Sign in error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { user: null, error: error as Error };
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      // Profile is handled by the auth state change listener
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('[useAuthImproved] Sign up error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { user: null, error: error as Error };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      });
      
      return { error: null };
    } catch (error) {
      console.error('[useAuthImproved] Sign out error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
      return { error: error as Error };
    }
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signOut
  };
};
EOF

echo "✅ Created improved auth hook"

# Update the Case component to use the new services
echo "🧩 Updating Case components..."
cat > src/components/CaseCard.tsx << 'EOF'
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  CardHeader,
  Avatar,
  Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import type { Case } from '../types/database';

interface CaseCardProps {
  caseItem: Case;
  onEdit: (caseItem: Case) => void;
  onArchive: (caseId: string, isArchived: boolean) => Promise<void>;
  onOpen: (caseId: string) => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({
  caseItem,
  onEdit,
  onArchive,
  onOpen
}) => {
  // Format date string
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Unknown date';
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.warn('[CaseCard] Invalid date format:', dateString);
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('[CaseCard] Error formatting date:', err);
      return 'Error with date';
    }
  };

  // Get status chip color
  const getStatusColor = (status?: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'closed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        opacity: caseItem.is_archived ? 0.7 : 1,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: getStatusColor(caseItem.status) }}>
            <PersonIcon />
          </Avatar>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {caseItem.name}
            {caseItem.is_archived && (
              <Chip size="small" label="Archived" color="default" />
            )}
          </Box>
        }
        subheader={`Created: ${formatDate(caseItem.created_at)}`}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={caseItem.status || 'Active'} 
            size="small" 
            color={getStatusColor(caseItem.status)}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ 
          minHeight: '3em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {caseItem.description || 'No description provided'}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title="Open Case">
            <span>
              <IconButton 
                size="small"
                onClick={() => onOpen(caseItem.id)}
                sx={{ color: 'primary.main' }}
              >
                Open
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <Box>
          <Tooltip title="Edit">
            <IconButton 
              size="small"
              onClick={() => onEdit(caseItem)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={caseItem.is_archived ? 'Unarchive' : 'Archive'}>
            <IconButton 
              size="small"
              onClick={() => onArchive(caseItem.id, !!caseItem.is_archived)}
            >
              {caseItem.is_archived ? 
                <UnarchiveIcon fontSize="small" /> : 
                <ArchiveIcon fontSize="small" />
              }
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default CaseCard;
EOF

echo "🏃‍♂️ Running database setup script..."
node db_setup.cjs

echo "🔄 Re-installing dependencies to ensure integrity..."
npm ci

echo "🚀 Building application..."
npm run build

echo "🧹 Cleaning up temporary files..."
# Add any cleanup steps if needed

echo "✅ Comprehensive fix complete! You can now run the app with 'npm run dev'" 