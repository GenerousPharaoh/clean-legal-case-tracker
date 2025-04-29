import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

// Define Case interface
interface Case {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  is_archived?: boolean;
  tags?: string[];
}

// Define context type
interface CaseContextType {
  currentCase: Case | null;
  setCurrentCase: (caseData: Case | null) => void;
  caseId: string | null;
  setCaseId: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  loadCase: (id: string) => Promise<void>;
  updateCase: (updates: Partial<Case>) => Promise<void>;
  archiveCase: () => Promise<void>;
  unarchiveCase: () => Promise<void>;
}

// Create the context
const CaseContext = createContext<CaseContextType | null>(null);

// Hook for using the case context
export const useCase = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCase must be used within a CaseProvider');
  }
  return context;
};

// Provider component
export const CaseProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load case data when caseId changes
  useEffect(() => {
    if (caseId) {
      console.log('[CaseContext] Loading case with ID:', caseId);
      loadCase(caseId)
        .then(() => console.log('[CaseContext] Case loaded successfully'))
        .catch((err) => console.error('[CaseContext] Failed to load case:', err));
    } else {
      // Only clear the case if it's not already null to prevent unnecessary updates
      if (currentCase !== null) {
        console.log('[CaseContext] No case ID, clearing current case state');
      setCurrentCase(null);
      }
    }
    // Removed loadCase from dependency array to prevent reference error
    // The function is defined in the same component scope and doesn't change between renders
  }, [caseId, currentCase]);

  // Log for debugging
  useEffect(() => {
    console.log('[CaseContext] Rendering with case ID:', caseId || 'none');
    if (currentCase) {
      console.log('[CaseContext] Current case:', currentCase.name || 'unnamed case');
    }
  }, [caseId, currentCase]);

  // Function to load case data
  const loadCase = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        throw new Error('Case not found');
      }

      setCurrentCase(data as Case);
    } catch (err: any) {
      console.error('Error loading case:', err);
      setError(err.message || 'Failed to load case');
      setCurrentCase(null);
    } finally {
      setLoading(false);
    }
  };

  // Function to update case
  const updateCase = async (updates: Partial<Case>) => {
    if (!currentCase || !caseId) {
      setError('No case selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('cases')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setCurrentCase(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updates,
          updated_at: new Date().toISOString()
        };
      });

    } catch (err: any) {
      console.error('Error updating case:', err);
      setError(err.message || 'Failed to update case');
    } finally {
      setLoading(false);
    }
  };

  // Function to archive case
  const archiveCase = async () => {
    await updateCase({ is_archived: true });
  };

  // Function to unarchive case
  const unarchiveCase = async () => {
    await updateCase({ is_archived: false });
  };

  return (
    <CaseContext.Provider
      value={{
        currentCase,
        setCurrentCase,
        caseId,
        setCaseId,
        loading,
        error,
        loadCase,
        updateCase,
        archiveCase,
        unarchiveCase
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export default CaseContext;