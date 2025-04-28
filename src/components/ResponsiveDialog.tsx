import React, { ReactNode, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton, Typography, useMediaQuery, useTheme, Box, Divider, Button, CircularProgress } from '@mui/material';
import { Slide, Fade } from './SafeTransitions';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';

// Slide up transition for mobile view with proper nodeRef handling
const SlideUpTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Slide direction="up" nodeRef={nodeRef} {...props}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {props.children}
      </div>
    </Slide>
  );
});

// Fade transition for desktop view with proper nodeRef handling
const FadeTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  const nodeRef = useRef(null);
  return (
    // @ts-ignore - nodeRef is valid but TypeScript doesn't recognize it
    <Fade nodeRef={nodeRef} {...props}>
      <div ref={nodeRef} style={{ display: 'contents' }}>
        {props.children}
      </div>
    </Fade>
  );
});

interface ResponsiveDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullScreen?: boolean;
  fullWidth?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
  showCloseButton?: boolean;
  loading?: boolean;
  dividers?: boolean;
  scroll?: 'paper' | 'body';
  disableEnforceFocus?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm?: () => void;
  confirmButtonColor?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  headerActions?: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  icon?: ReactNode;
}

/**
 * ResponsiveDialog - A responsive dialog component that adapts to different screen sizes
 */
const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  maxWidth = 'sm',
  fullScreen: propFullScreen,
  fullWidth = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  showCloseButton = true,
  loading = false,
  dividers = true,
  scroll = 'paper',
  disableEnforceFocus = false,
  confirmButtonText,
  cancelButtonText,
  onConfirm,
  confirmButtonColor = 'primary',
  headerActions,
  disabled = false,
  className,
  id,
  icon
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Determine if fullScreen should be enabled (either explicitly set or on mobile)
  const fullScreen = propFullScreen !== undefined ? propFullScreen : isMobile;
  
  // Choose transition based on screen size
  const Transition = isMobile ? SlideUpTransition : FadeTransition;
  
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // If disableBackdropClick is true, prevent closing
    if (disableBackdropClick) {
      event.stopPropagation();
    }
  };
  
  // Generate default actions if not provided
  const renderActions = () => {
    if (actions) return actions;
    
    if (confirmButtonText || cancelButtonText) {
      return (
        <>
          {cancelButtonText && (
            <Button 
              onClick={onClose} 
              disabled={loading || disabled}
              variant="outlined"
              color="inherit"
            >
              {cancelButtonText}
            </Button>
          )}
          {confirmButtonText && onConfirm && (
            <Button 
              onClick={onConfirm} 
              disabled={loading || disabled}
              variant="contained"
              color={confirmButtonColor}
              startIcon={loading && <CircularProgress size={16} color="inherit" />}
            >
              {confirmButtonText}
            </Button>
          )}
        </>
      );
    }
    
    return null;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth={maxWidth}
      fullScreen={fullScreen}
      fullWidth={fullWidth}
      scroll={scroll}
      disableEscapeKeyDown={disableEscapeKeyDown || loading}
      onClick={handleBackdropClick}
      disableEnforceFocus={disableEnforceFocus}
      className={className}
      id={id}
      aria-labelledby={`${id || 'dialog'}-title`}
      aria-describedby={description ? `${id || 'dialog'}-description` : undefined}
    >
      <DialogTitle 
        id={`${id || 'dialog'}-title`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: theme.spacing(2, 3),
          ...(fullScreen && { 
            boxShadow: 1,
            zIndex: 1 
          })
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && (
            <Box 
              sx={{ 
                mr: 1.5, 
                display: 'flex',
                alignItems: 'center', 
                color: 'primary.main'
              }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {headerActions}
          
          {showCloseButton && (
            <IconButton 
              edge="end" 
              color="inherit" 
              onClick={onClose} 
              aria-label="close"
              disabled={loading || disabled}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      
      {dividers && <Divider />}
      
      <DialogContent 
        dividers={dividers}
        sx={{
          position: 'relative',
          ...(loading && {
            opacity: 0.7,
            pointerEvents: 'none'
          })
        }}
      >
        {description && (
          <DialogContentText id={`${id || 'dialog'}-description`} paragraph>
            {description}
          </DialogContentText>
        )}
        
        {children}
        
        {loading && (
          <Box 
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              zIndex: 10
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}
      </DialogContent>
      
      {(renderActions() || actions) && (
        <>
          {dividers && <Divider />}
          <DialogActions sx={{ p: theme.spacing(2, 3) }}>
            {renderActions()}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ResponsiveDialog;