import React from 'react';
import { Snackbar, SnackbarProps } from '@mui/material';

// Define the correct type for anchorOrigin
interface AnchorOrigin {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
}

// Create a type that extends the original SnackbarProps
interface SafeSnackbarProps extends Omit<SnackbarProps, 'anchorOrigin'> {
  anchorOrigin?: AnchorOrigin;
}

/**
 * SafeSnackbar - A wrapper around MUI Snackbar that properly handles the anchorOrigin prop
 * to prevent PropType validation errors
 */
const SafeSnackbar: React.FC<SafeSnackbarProps> = ({ 
  children, 
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
  ...props 
}) => {
  return (
    <Snackbar
      anchorOrigin={anchorOrigin}
      {...props}
    >
      {children}
    </Snackbar>
  );
};

export default SafeSnackbar; 