import { createContext, useContext, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import useSupabaseWithRetry from '../hooks/useSupabaseWithRetry';

interface SupabaseContextType {
  supabase: SupabaseClient;
  isOnline: boolean;
  isAuthenticated: boolean | null;
  isLoading: boolean;
  forceSignOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

// Create a default context value to avoid nullish checking
const defaultContextValue: SupabaseContextType = {
  // We'll override this with the actual client when the provider initializes
  supabase: {} as SupabaseClient,
  isOnline: true,
  isAuthenticated: null,
  isLoading: true,
  forceSignOut: async () => {},
  refreshSession: async () => false,
};

const SupabaseContext = createContext<SupabaseContextType>(defaultContextValue);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
  const {
    supabase,
    isOnline,
    isAuthenticated,
    isLoading,
    forceSignOut,
    refreshSession,
  } = useSupabaseWithRetry();

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        isOnline,
        isAuthenticated,
        isLoading,
        forceSignOut,
        refreshSession,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

export default SupabaseProvider; 