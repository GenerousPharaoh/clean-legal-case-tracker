import React from 'react';
import { Tooltip, TooltipProps, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Enhanced tooltip styling
const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .MuiTooltip-tooltip`]: {
    backgroundColor: 'rgba(33, 33, 33, 0.9)',
    backdropFilter: 'blur(4px)',
    maxWidth: 300,
    padding: theme.spacing(1, 1.5),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    fontSize: '0.75rem',
    transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  [`& .MuiTooltip-arrow`]: {
    color: 'rgba(33, 33, 33, 0.9)',
  },
}));

interface EnhancedTooltipProps extends Omit<TooltipProps, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  delay?: number;
}

/**
 * EnhancedTooltip - An improved tooltip component with rich content support
 * 
 * Provides more advanced tooltips with optional descriptions, keyboard shortcuts,
 * and rich formatting. Maintains consistent styling across the application.
 */
const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  title,
  description,
  shortcut,
  disabled = false,
  delay = 500,
  children,
  ...rest
}) => {
  // If disabled, just return the children without a tooltip
  if (disabled) {
    return <>{children}</>;
  }

  // For simple string title with no description or shortcut
  if (typeof title === 'string' && !description && !shortcut) {
    return (
      <StyledTooltip 
        title={title}
        arrow
        enterDelay={delay}
        {...rest}
      >
        {children}
      </StyledTooltip>
    );
  }

  // For complex tooltip content
  const tooltipContent = (
    <Box sx={{ p: 0.5 }}>
      <Typography 
        variant="subtitle2" 
        component="div" 
        sx={{ 
          fontWeight: 500, 
          color: 'white',
          fontSize: '0.8rem'
        }}
      >
        {title}
      </Typography>
      
      {description && (
        <Typography 
          variant="body2" 
          component="div" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.75rem',
            mt: 0.5
          }}
        >
          {description}
        </Typography>
      )}
      
      {shortcut && (
        <Box 
          sx={{ 
            mt: description ? 1 : 0.5, 
            pt: description ? 0.5 : 0, 
            borderTop: description ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <Typography 
            variant="caption" 
            component="div" 
            sx={{ 
              fontFamily: 'monospace', 
              color: 'rgba(255, 255, 255, 0.7)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              px: 0.7,
              py: 0.2,
              borderRadius: 0.5,
              fontSize: '0.7rem',
            }}
          >
            {shortcut}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <StyledTooltip 
      title={tooltipContent}
      arrow
      enterDelay={delay}
      {...rest}
    >
      {children}
    </StyledTooltip>
  );
};

export default EnhancedTooltip; 