import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Collapse } from './SafeTransitions';

/**
 * OfflineAlert - A component that shows alerts for network status changes
 * Shows a persistent alert when offline and a temporary alert when reconnected
 */
const OfflineAlert: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = React.useState(false);

  // Show reconnection message when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Handle manual closing of reconnected message
  const handleCloseReconnected = () => {
    setShowReconnected(false);
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9999 }}>
      {/* Offline alert - always shown when offline */}
      <Collapse in={!isOnline}>
        <Alert 
          severity="error" 
          variant="filled"
          icon={<WifiOffIcon />}
          sx={{ 
            mb: 2, 
            boxShadow: 3,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.9 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.9 }
            }
          }}
        >
          <AlertTitle>You're offline</AlertTitle>
          No internet connection detected. Some features may be unavailable.
          Your work will be saved locally and synchronized when you're back online.
        </Alert>
      </Collapse>

      {/* Reconnected alert - shown temporarily when coming back online */}
      <Collapse in={showReconnected}>
        <Alert 
          severity="success" 
          variant="filled"
          icon={<CheckCircleIcon />}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleCloseReconnected}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ boxShadow: 3 }}
        >
          <AlertTitle>Connection Restored</AlertTitle>
          You're back online! Any pending changes will now be synchronized.
        </Alert>
      </Collapse>
    </Box>
  );
};

export default OfflineAlert;
