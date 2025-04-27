/**
 * Global error handler for the application
 * 
 * This module sets up global error handlers for unhandled exceptions
 * and promise rejections. It also provides utilities for error reporting.
 */

import { ErrorCategory, reportError as notifyError } from './authErrorHandler';

// Configuration for error handling
const errorConfig = {
  enableConsoleErrors: true,      // Log errors to console
  enableErrorReporting: false,    // Send errors to a reporting service
  enableErrorBoundaryLogs: true,  // Log errors caught by React Error Boundaries
  reportingEndpoint: '',          // URL for error reporting service
};

/**
 * Initialize global error handlers
 */
export function initializeErrorHandlers() {
  if (typeof window === 'undefined') return;

  // Handler for uncaught exceptions
  window.addEventListener('error', (event) => {
    const { message, filename, lineno, colno, error } = event;
    
    console.error('[Global Error]', {
      type: 'uncaught_exception',
      message,
      filename,
      line: lineno,
      column: colno,
      stack: error?.stack || 'No stack trace',
      timestamp: new Date().toISOString(),
    });
    
    // Send to our notification system
    notifyError(message, ErrorCategory.GENERAL, error?.stack || 'No stack trace');
  });

  // Handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const { reason } = event;
    
    console.error('[Global Error]', {
      type: 'unhandled_rejection',
      message: reason?.message || 'Unhandled Promise rejection',
      stack: reason?.stack || 'No stack trace',
      timestamp: new Date().toISOString(),
    });
    
    // Send to our notification system
    notifyError(
      reason?.message || 'Unhandled Promise rejection', 
      ErrorCategory.GENERAL, 
      reason?.stack || 'No stack trace'
    );
  });

  console.log('[ErrorHandler] Global error handlers initialized');
}

/**
 * Format an error for logging or reporting
 */
export function formatError(error: any, source = 'unknown'): Record<string, any> {
  const formattedError = {
    type: source,
    timestamp: new Date().toISOString(),
    message: '',
    name: '',
    stack: '',
    metadata: {},
  };

  if (error instanceof Error) {
    formattedError.message = error.message;
    formattedError.name = error.name;
    formattedError.stack = error.stack || '';
  } else if (typeof error === 'string') {
    formattedError.message = error;
  } else if (error && typeof error === 'object') {
    formattedError.message = error.message || JSON.stringify(error);
    formattedError.metadata = { ...error };
  } else {
    formattedError.message = 'Unknown error';
  }

  return formattedError;
}

/**
 * Report an error to both our notification system and analytics service
 */
export function reportError(error: any, source = 'application'): void {
  const formattedError = formatError(error, source);
  
  // Send to our user-facing notification system
  notifyError(
    formattedError.message,
    ErrorCategory.GENERAL,
    formattedError.stack || undefined
  );
  
  // Here you would typically send the error to your reporting service
  if (errorConfig.enableErrorReporting && errorConfig.reportingEndpoint) {
    try {
      fetch(errorConfig.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedError),
      }).catch(e => console.error('Failed to report error:', e));
    } catch (e) {
      console.error('Error while reporting error:', e);
    }
  }
}

/**
 * Log an error from a React Error Boundary
 */
export function logErrorBoundary(error: Error, errorInfo: React.ErrorInfo, componentName = 'unknown'): void {
  if (!errorConfig.enableErrorBoundaryLogs) return;
  
  console.error(`[ErrorBoundary:${componentName}]`, {
    error: formatError(error, 'react_error_boundary'),
    componentStack: errorInfo.componentStack,
  });
  
  // Send to our notification system
  notifyError(
    `Error in ${componentName}: ${error.message}`,
    ErrorCategory.GENERAL,
    errorInfo.componentStack
  );
  
  if (errorConfig.enableErrorReporting) {
    reportError({
      ...formatError(error, 'react_error_boundary'),
      componentStack: errorInfo.componentStack,
      componentName,
    });
  }
}

// Export a default configuration object
export default {
  initialize: initializeErrorHandlers,
  report: reportError,
  logBoundaryError: logErrorBoundary,
};
