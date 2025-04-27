// This file is deprecated. Use useAuthStore from store/store.ts instead.
// This file is kept for backward compatibility - new code should use useAuthStore.

import { createContext } from 'react';
import { useAuthStore } from '../store/store';

// For backward compatibility - redirect to the Zustand store
const AuthContext = createContext<any>(null);

// Re-export useAuthStore as useAuth for backward compatibility
export const useAuth = useAuthStore;

// Deprecated - kept for compatibility
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.warn('[DEPRECATED] AuthProvider is deprecated. Use useAuthStore instead.');
  return children;
};

export default AuthContext; 