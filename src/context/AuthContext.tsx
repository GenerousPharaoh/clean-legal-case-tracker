// This file is deprecated and serves as a compatibility layer.
// New code should use useAuth() from src/hooks/useAuth.ts
// which provides a standardized authentication API.
//
// This file is kept for backward compatibility only.

import { createContext } from 'react';
import { useAuthStore } from '../store/store';

// For backward compatibility - redirect to the Zustand store
const AuthContext = createContext<any>(null);

// Re-export useAuthStore as useAuth for backward compatibility
export const useAuth = useAuthStore;

// Deprecated - kept for compatibility
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.warn('[DEPRECATED] AuthProvider is deprecated. Use useAuth from hooks/useAuth.ts instead.');
  return children;
};

export default AuthContext; 