import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

// Notification type
export interface Notification {
  message: string;
  severity: AlertColor;
  autoHideDuration?: number;
}

// Context interface
interface NotificationContextType {
  showNotification: (notification: Notification) => void;
  closeNotification: () => void;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
  closeNotification: () => {},
});

// Custom hook to use notifications
export const useNotification = () => useContext(NotificationContext);

// Provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    message: '',
    severity: 'info',
    autoHideDuration: 5000,
  });

  const showNotification = (newNotification: Notification) => {
    setNotification(newNotification);
    setOpen(true);
  };

  const closeNotification = () => {
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, closeNotification }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={notification.autoHideDuration}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 