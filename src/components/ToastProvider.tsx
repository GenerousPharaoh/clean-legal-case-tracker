import { createContext, useContext, useState, type ReactNode, useRef } from 'react';
import { Snackbar, Alert, AlertTitle, AlertProps, SnackbarProps, Typography, Box, IconButton } from '@mui/material';
import { Slide } from './SafeTransitions';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  severity?: ToastSeverity;
  autoHideDuration?: number;
  title?: string;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  showIcon?: boolean;
  variant?: 'filled' | 'outlined' | 'standard';
  action?: ReactNode;
  maxWidth?: number | string;
  closable?: boolean;
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
  closeToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Custom slide transition with proper nodeRef handling
const SlideTransition = (props: TransitionProps & { children: ReactNode }) => {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Slide {...props} direction="up" nodeRef={nodeRef}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {props.children}
      </div>
    </Slide>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState<ToastOptions>({
    severity: 'info',
    autoHideDuration: 5000,
    position: { vertical: 'bottom', horizontal: 'center' },
    showIcon: true,
    variant: 'filled',
    closable: true,
    maxWidth: 400,
  });

  const showToast = (message: string, customOptions?: ToastOptions) => {
    setMessage(message);
    setOptions({ ...options, ...customOptions });
    setOpen(true);
  };

  const closeToast = () => {
    setOpen(false);
  };

  const getIcon = (severity: ToastSeverity) => {
    switch (severity) {
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, closeToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={options.autoHideDuration}
        onClose={closeToast}
        anchorOrigin={options.position}
        TransitionComponent={SlideTransition}
        sx={{ 
          maxWidth: options.maxWidth, 
          width: '100%',
        }}
      >
        <Alert
          severity={options.severity}
          variant={options.variant}
          onClose={options.closable ? closeToast : undefined}
          sx={{ 
            width: '100%',
            boxShadow: 3,
            alignItems: 'center',
            '.MuiAlert-message': {
              width: '100%',
            }
          }}
          iconMapping={{
            success: getIcon('success'),
            error: getIcon('error'),
            warning: getIcon('warning'),
            info: getIcon('info'),
          }}
          icon={options.showIcon ? undefined : false}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              {options.title && (
                <AlertTitle sx={{ fontWeight: 'bold', mb: 0.5 }}>{options.title}</AlertTitle>
              )}
              <Typography variant="body2">{message}</Typography>
            </Box>
            {options.action && (
              <Box sx={{ ml: 2 }}>{options.action}</Box>
            )}
          </Box>
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;