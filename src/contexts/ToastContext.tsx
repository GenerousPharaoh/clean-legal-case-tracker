import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ToastNotification, { ToastVariant, ToastPosition, ToastAlignment } from '../components/ToastNotification';

// Define the shape of a toast notification
interface Toast {
  id: string;
  message: string;
  details?: string;
  variant: ToastVariant;
  duration?: number;
  position?: ToastPosition;
  alignment?: ToastAlignment;
  isImportant?: boolean;
  action?: ReactNode;
}

// Define the shape of our context
interface ToastContextType {
  // Methods to display different types of toasts
  showToast: (message: string, details?: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'details'>>) => string;
  showSuccess: (message: string, details?: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'details' | 'variant'>>) => string;
  showError: (message: string, details?: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'details' | 'variant'>>) => string;
  showWarning: (message: string, details?: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'details' | 'variant'>>) => string;
  showInfo: (message: string, details?: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'details' | 'variant'>>) => string;
  showSecurity: (message: string, details?: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'details' | 'variant'>>) => string;
  
  // Methods to manage toasts
  closeToast: (id: string) => void;
  closeAllToasts: () => void;
}

// Create the context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Define the provider props
interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

/**
 * ToastProvider - Global toast notification manager
 * 
 * Provides a consistent way to display toast notifications throughout the application
 * with various styles, positions, and behaviors.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 3
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generate a unique ID for each toast
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }, []);

  // Add a toast to the stack
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    
    setToasts(currentToasts => {
      // If we've reached the max number of toasts, remove the oldest non-important toast
      if (currentToasts.length >= maxToasts) {
        const nonImportantIndex = currentToasts.findIndex(t => !t.isImportant);
        
        if (nonImportantIndex >= 0) {
          return [
            ...currentToasts.slice(0, nonImportantIndex),
            ...currentToasts.slice(nonImportantIndex + 1),
            { id, ...toast }
          ];
        }
      }
      
      return [...currentToasts, { id, ...toast }];
    });
    
    return id;
  }, [generateId, maxToasts]);

  // Show a generic toast
  const showToast = useCallback((
    message: string,
    details?: string,
    options?: Partial<Omit<Toast, 'id' | 'message' | 'details'>>
  ) => {
    return addToast({
      message,
      details,
      variant: 'default',
      duration: 5000,
      position: 'bottom',
      alignment: 'center',
      isImportant: false,
      ...options
    });
  }, [addToast]);

  // Show a success toast
  const showSuccess = useCallback((
    message: string,
    details?: string,
    options?: Partial<Omit<Toast, 'id' | 'message' | 'details' | 'variant'>>
  ) => {
    return addToast({
      message,
      details,
      variant: 'success',
      duration: 5000,
      position: 'bottom',
      alignment: 'center',
      isImportant: false,
      ...options
    });
  }, [addToast]);

  // Show an error toast
  const showError = useCallback((
    message: string,
    details?: string,
    options?: Partial<Omit<Toast, 'id' | 'message' | 'details' | 'variant'>>
  ) => {
    return addToast({
      message,
      details,
      variant: 'error',
      duration: 8000, // Errors stay longer by default
      position: 'bottom',
      alignment: 'center',
      isImportant: true, // Errors are important by default
      ...options
    });
  }, [addToast]);

  // Show a warning toast
  const showWarning = useCallback((
    message: string,
    details?: string,
    options?: Partial<Omit<Toast, 'id' | 'message' | 'details' | 'variant'>>
  ) => {
    return addToast({
      message,
      details,
      variant: 'warning',
      duration: 7000,
      position: 'bottom',
      alignment: 'center',
      isImportant: false,
      ...options
    });
  }, [addToast]);

  // Show an info toast
  const showInfo = useCallback((
    message: string,
    details?: string,
    options?: Partial<Omit<Toast, 'id' | 'message' | 'details' | 'variant'>>
  ) => {
    return addToast({
      message,
      details,
      variant: 'info',
      duration: 5000,
      position: 'bottom',
      alignment: 'center',
      isImportant: false,
      ...options
    });
  }, [addToast]);

  // Show a security toast
  const showSecurity = useCallback((
    message: string,
    details?: string,
    options?: Partial<Omit<Toast, 'id' | 'message' | 'details' | 'variant'>>
  ) => {
    return addToast({
      message,
      details,
      variant: 'security',
      duration: 8000,
      position: 'bottom',
      alignment: 'center',
      isImportant: true, // Security notifications are important by default
      ...options
    });
  }, [addToast]);

  // Close a specific toast
  const closeToast = useCallback((id: string) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  // Close all toasts
  const closeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Create the context value
  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showSecurity,
    closeToast,
    closeAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Render the active toasts */}
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          open={true}
          message={toast.message}
          details={toast.details}
          variant={toast.variant}
          autoHideDuration={toast.duration}
          position={toast.position}
          alignment={toast.alignment}
          isImportant={toast.isImportant}
          action={toast.action}
          onClose={() => closeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

/**
 * useToast - Hook for using the toast notification system
 * 
 * Provides access to the toast notification API throughout the application.
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

export default ToastContext;
