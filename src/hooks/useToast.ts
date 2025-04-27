import { useToast as useToastContext } from '../contexts/ToastContext';

/**
 * useToast - A hook for using the toast notification system
 * 
 * This hook provides a simplified interface to the toast notification 
 * system for displaying user feedback and notifications.
 * 
 * @example
 * const toast = useToast();
 * 
 * // Show a success toast
 * toast.success('Operation completed successfully');
 * 
 * // Show an error toast with details
 * toast.error('Failed to save data', 'Network connection error');
 * 
 * // Show an important warning that requires manual dismissal
 * toast.warning('Your session will expire soon', 'Please save your work', { isImportant: true });
 * 
 * @returns {Object} Toast notification methods
 */
export const useToast = () => {
  const toast = useToastContext();
  
  return {
    /**
     * Show a success toast notification
     */
    success: toast.showSuccess,
    
    /**
     * Show an error toast notification
     */
    error: toast.showError,
    
    /**
     * Show a warning toast notification
     */
    warning: toast.showWarning,
    
    /**
     * Show an informational toast notification
     */
    info: toast.showInfo,
    
    /**
     * Show a security-related toast notification
     */
    security: toast.showSecurity,
    
    /**
     * Show a generic toast notification
     */
    show: toast.showToast,
    
    /**
     * Close a specific toast notification by ID
     */
    close: toast.closeToast,
    
    /**
     * Close all active toast notifications
     */
    closeAll: toast.closeAllToasts
  };
};

export default useToast;
