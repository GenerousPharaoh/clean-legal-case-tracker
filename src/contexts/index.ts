// This file re-exports all contexts from both context/ and contexts/ directories
// to standardize imports and avoid duplication

// Re-export from context/ folder
export { default as ThemeContext, ThemeProvider, useThemeContext } from '../context/ThemeContext';

// Re-export from contexts/ folder
export { default as CaseContext, CaseProvider, useCase } from './CaseContext';
export { default as ToastContext, ToastProvider, useToast } from './ToastContext';
export { default as SupabaseContext } from './SupabaseContext';

// Re-export from auth context (which now forwards to Zustand)
export { useAuth } from '../context/AuthContext';

// Add a console warning about context directory structure
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[Contexts] Warning: The app has both "context/" and "contexts/" directories. ' +
    'New contexts should be added to the "contexts/" directory and exported from this index file.'
  );
}
