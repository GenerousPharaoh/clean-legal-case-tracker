import { PostgrestError } from '@supabase/supabase-js';

// Error types to handle consistently
interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Extract meaningful error message from any error type
 * @param error - The error to process
 * @param fallbackMessage - Optional fallback message if error can't be processed
 * @returns A user-friendly error message
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (!error) {
    return fallbackMessage;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  // Handle PostgrestError from Supabase
  if (isPostgrestError(error)) {
    return error.message || `Database error: ${error.code || 'unknown'}`;
  }

  // Handle API errors with message property
  if (isApiError(error)) {
    return error.message || `API error: ${error.code || error.status || 'unknown'}`;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle unknown object errors with message property
  if (isObjectWithMessage(error)) {
    return error.message;
  }

  // Default fallback
  return fallbackMessage;
}

/**
 * Log errors consistently
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}] ` : '';
  
  if (error instanceof Error) {
    console.error(`${prefix}Error:`, error.message);
    if (error.stack) {
      console.debug('Stack trace:', error.stack);
    }
    return;
  }
  
  console.error(`${prefix}Error:`, error);
}

/**
 * Parse and categorize API errors
 * @param error - The error to parse
 * @returns A categorized error object
 */
export function parseApiError(error: unknown): ApiError {
  if (isPostgrestError(error)) {
    return {
      message: error.message || 'Database operation failed',
      code: error.code,
      status: error.code ? parseInt(error.code, 10) : undefined,
    };
  }

  if (isApiError(error)) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  return {
    message: 'An unknown error occurred',
  };
}

// Type guards
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}

function isObjectWithMessage(obj: unknown): obj is { message: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    typeof (obj as { message: unknown }).message === 'string'
  );
} 