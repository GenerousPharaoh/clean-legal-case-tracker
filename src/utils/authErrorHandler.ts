import { createContext, useContext } from 'react';
import { AuthError, PostgrestError, StorageError } from '@supabase/supabase-js';

/**
 * Common Supabase authentication error codes
 */
export enum AuthErrorCode {
  // Sign-in errors
  INVALID_CREDENTIALS = 'P0001', // Invalid login credentials
  EMAIL_NOT_CONFIRMED = 'P0002', // Email not confirmed
  INVALID_MFA_CODE = 'P0003', // Invalid MFA code
  
  // Session errors
  INVALID_SESSION = '401', // Unauthorized or invalid session
  SESSION_EXPIRED = 'PGRST116', // Session token expired
  
  // General errors
  RATE_LIMITED = '429', // Too many requests
  SERVER_ERROR = '500', // Internal server error
}

/**
 * Categorizes different types of errors for proper handling
 */
export enum ErrorCategory {
  AUTH = 'auth',
  DATABASE = 'database',
  STORAGE = 'storage',
  NETWORK = 'network',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  GENERAL = 'general'
}

/**
 * Structured error notification format
 */
export interface ErrorNotification {
  id: string;
  message: string;
  category: ErrorCategory;
  details?: string;
  timestamp: Date;
  dismissable: boolean;
  dismissed: boolean;
}

/**
 * Error context for global error state
 */
export interface ErrorContextType {
  errors: ErrorNotification[];
  addError: (error: Omit<ErrorNotification, 'id' | 'timestamp'>) => void;
  dismissError: (id: string) => void;
  clearErrors: () => void;
}

/**
 * Error context default value
 */
export const DefaultErrorContext: ErrorContextType = {
  errors: [],
  addError: () => {},
  dismissError: () => {},
  clearErrors: () => {}
};

/**
 * Create the error context
 */
export const ErrorContext = createContext<ErrorContextType>(DefaultErrorContext);

/**
 * Hook to use the error context
 */
export const useErrorContext = () => useContext(ErrorContext);

/**
 * Reports an error by dispatching a custom event to be handled by the ErrorNotification component
 * 
 * @param message The error message to display
 * @param category The category of the error
 * @param details Additional details about the error
 * @param dismissable Whether the error can be dismissed by the user
 */
export const reportError = (
  message: string,
  category: ErrorCategory = ErrorCategory.GENERAL,
  details?: string,
  dismissable: boolean = true
): void => {
  // Dispatch an event with the error details
  const errorEvent = new CustomEvent('error-notification', {
    detail: {
      message,
      category,
      details,
      dismissable
    }
  });
  
  window.dispatchEvent(errorEvent);
  
  // Log to console for debugging
  console.error(`[${category.toUpperCase()}] ${message}${details ? `: ${details}` : ''}`);
  
  // For auth errors, store in session storage to show on page refresh/navigation
  if (category === ErrorCategory.AUTH) {
    const authError = {
      message,
      category,
      details,
      timestamp: new Date().toISOString()
    };
    
    try {
      sessionStorage.setItem('auth_error', JSON.stringify(authError));
    } catch (e) {
      console.error('Failed to store auth error in session storage:', e);
    }
  }
};

/**
 * Formats and handles an error from Supabase
 * 
 * @param error The error object from Supabase
 * @param defaultMessage Default message to display if the error is not recognized
 */
export const handleSupabaseError = (
  error: unknown,
  defaultMessage: string = 'An error occurred'
): void => {
  if (!error) {
    reportError(defaultMessage);
    return;
  }
  
  // Type guard for PostgrestError
  const isPostgrestError = (err: any): err is PostgrestError => 
    err && typeof err === 'object' && 'code' in err && 'message' in err && 'details' in err;
  
  // Type guard for AuthError
  const isAuthError = (err: any): err is AuthError => 
    err && typeof err === 'object' && 'message' in err && ('status' in err || 'statusCode' in err);
  
  // Type guard for StorageError (our custom interface)
  const isStorageError = (err: any): err is StorageError => 
    err && typeof err === 'object' && 'message' in err && 'statusCode' in err && 'error' in err;
  
  // Handle specific error types
  if (isAuthError(error)) {
    const statusCode = error.status || (error as any).statusCode || 500;
    let category = ErrorCategory.AUTH;
    let message = error.message || defaultMessage;
    let details = '';
    
    // Check for specific auth error types
    if (message.includes('JWT expired') || message.includes('token is expired')) {
      message = 'Your session has expired';
      details = 'Please sign in again to continue.';
    } else if (message.includes('invalid token')) {
      message = 'Authentication failed';
      details = 'Please sign out and sign in again.';
    } else if (message.includes('Email not confirmed')) {
      message = 'Email not verified';
      details = 'Please check your email and click the verification link.';
    } else if (message.includes('Email/Password combination')) {
      message = 'Invalid email or password';
      details = 'Please check your credentials and try again.';
    } else if (statusCode === 403) {
      category = ErrorCategory.PERMISSION;
      message = 'Access denied';
      details = 'You do not have permission to perform this action.';
    }
    
    reportError(message, category, details);
    return;
  }
  
  // Handle Postgres DB errors
  if (isPostgrestError(error)) {
    const { code, message, details } = error;
    let category = ErrorCategory.DATABASE;
    let errorMessage = message || defaultMessage;
    
    // RLS policy errors
    if (code === 'PGRST301' || code === 'PGRST302') {
      category = ErrorCategory.PERMISSION;
      errorMessage = 'Permission denied';
    } else if (code === '23505') {
      // Unique constraint violation
      category = ErrorCategory.VALIDATION;
      errorMessage = 'This record already exists';
    } else if (code === '23503') {
      // Foreign key constraint
      category = ErrorCategory.VALIDATION;
      errorMessage = 'This operation would violate database constraints';
    } else if (code === '42501') {
      // No permissions
      category = ErrorCategory.PERMISSION;
      errorMessage = 'Database permission denied';
    } else if (code === '42P01') {
      // Undefined table
      errorMessage = 'Database error: Table not found';
    }
    
    reportError(errorMessage, category, details);
    return;
  }
  
  // Handle Storage errors
  if (isStorageError(error)) {
    const { message, statusCode, error: storageErr } = error;
    let category = ErrorCategory.STORAGE;
    let errorMessage = message || defaultMessage;
    let details = storageErr || '';
    
    // Storage permissions
    if (statusCode === 403) {
      category = ErrorCategory.PERMISSION;
      errorMessage = 'Storage permission denied';
    } else if (statusCode === 404) {
      errorMessage = 'File not found';
    } else if (statusCode === 413) {
      category = ErrorCategory.VALIDATION;
      errorMessage = 'File too large';
      details = 'Please upload a smaller file.';
    }
    
    reportError(errorMessage, category, details);
    return;
  }
  
  // If it's a network error
  if (error instanceof Error && (
    error.message.includes('Failed to fetch') || 
    error.message.includes('NetworkError') || 
    error.message.includes('Network request failed')
  )) {
    reportError(
      'Network error',
      ErrorCategory.NETWORK,
      'Please check your internet connection and try again.'
    );
    return;
  }
  
  // Generic error handling for other types
  const errorMessage = error instanceof Error ? error.message : String(error);
  reportError(defaultMessage, ErrorCategory.GENERAL, errorMessage);
};

/**
 * Determines if an error is specifically from a session expiration
 */
export const isSessionExpiredError = (error: unknown): boolean => {
  if (!error) return false;
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as {message: unknown}).message;
    return typeof message === 'string' && (
      message.includes('JWT expired') || 
      message.includes('token is expired') ||
      message.includes('not authenticated') ||
      message.includes('Invalid JWT')
    );
  }
  
  return false;
};

/**
 * Check if an error is an auth error
 */
export const isAuthError = (error: any): boolean => {
  if (error instanceof AuthError) {
    return true;
  }
  
  // Check for Supabase PostgrestError with auth-related messages
  if (error instanceof PostgrestError) {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('auth') || 
      errorMessage.includes('permission') || 
      errorMessage.includes('jwt') ||
      errorMessage.includes('token') ||
      errorMessage.includes('role') ||
      errorMessage.includes('access') || 
      error.code === '42501' || // insufficient privilege
      error.code === '3D000'  // insufficient permission
    );
  }
  
  // Check for common error codes
  if (error.code) {
    const errorCode = typeof error.code === 'string' ? error.code : String(error.code);
    return (
      errorCode === '401' ||
      errorCode === '403' ||
      errorCode.startsWith('PGRST') || // PostgREST errors
      errorCode === 'UNAUTHENTICATED' ||
      errorCode === 'UNAUTHORIZED'
    );
  }
  
  // Check for error message string patterns
  if (error.message && typeof error.message === 'string') {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('auth') ||
      errorMessage.includes('login') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('unauthenticated') ||
      errorMessage.includes('jwt') ||
      errorMessage.includes('token') ||
      errorMessage.includes('session')
    );
  }
  
  return false;
};

/**
 * Parse error details from various error types
 */
export const parseErrorDetails = (error: any): string => {
  if (!error) return 'Unknown error';
  
  if (error instanceof AuthError) {
    return `${error.name}: ${error.message}`;
  }
  
  if (error instanceof PostgrestError) {
    return `Database error ${error.code}: ${error.message} ${error.details || ''}`;
  }
  
  if (error.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return JSON.stringify(error);
};

/**
 * Generic error handler for async functions
 */
export const handleAsyncError = async <T>(
  promise: Promise<T>,
  errorMessage: string = 'An error occurred',
  category: ErrorCategory = ErrorCategory.GENERAL
): Promise<T | null> => {
  try {
    return await promise;
  } catch (error) {
    reportError(
      errorMessage,
      isAuthError(error) ? ErrorCategory.AUTH : category,
      parseErrorDetails(error)
    );
    return null;
  }
};

/**
 * Handles token refresh errors safely
 */
export const handleTokenRefreshError = async (): Promise<void> => {
  // Clear any stored session
  localStorage.removeItem('supabase.auth.token');
  
  // Report the error
  reportError(
    'Session expired',
    ErrorCategory.AUTH,
    'Please sign in again to continue.'
  );
  
  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = '/login';
  }, 1500);
};

export default {
  parseAuthError: parseErrorDetails,
  isAuthError,
  reportError,
  handleSupabaseError,
  ErrorCategory
}; 