import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface AccessibleWrapperProps extends BoxProps {
  role?: React.AriaRole;
  label?: string;
  description?: string;
  tabIndex?: number;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  hasPopup?: boolean | 'dialog' | 'grid' | 'listbox' | 'menu' | 'tree';
  orientation?: 'horizontal' | 'vertical';
  selected?: boolean;
  checked?: boolean;
  controls?: string;
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  level?: number; // For headings, level 1-6
  keyShortcuts?: string;
  children: React.ReactNode;
}

/**
 * AccessibleWrapper - A component for enhancing accessibility across the application
 * 
 * This component provides a consistent way to add ARIA attributes to any component
 * while also maintaining the standard Box props for styling and layout.
 */
const AccessibleWrapper: React.FC<AccessibleWrapperProps> = ({
  role,
  label,
  description,
  tabIndex,
  labelledBy,
  describedBy,
  expanded,
  hasPopup,
  orientation,
  selected,
  checked,
  controls,
  live,
  atomic,
  relevant,
  level,
  keyShortcuts,
  children,
  ...boxProps
}) => {
  // Compile ARIA attributes
  const ariaAttributes: Record<string, string | boolean | number | undefined> = {
    'role': role,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-description': description,
    'aria-expanded': expanded,
    'aria-haspopup': hasPopup,
    'aria-orientation': orientation,
    'aria-selected': selected,
    'aria-checked': checked,
    'aria-controls': controls,
    'aria-live': live,
    'aria-atomic': atomic,
    'aria-relevant': relevant,
    'aria-level': level,
    'aria-keyshortcuts': keyShortcuts,
    'tabIndex': tabIndex,
  };

  // Filter out undefined values to avoid cluttering the DOM
  const filteredAriaAttributes = Object.fromEntries(
    Object.entries(ariaAttributes).filter(([_, value]) => value !== undefined)
  );

  return (
    <Box {...boxProps} {...filteredAriaAttributes}>
      {children}
    </Box>
  );
};

export default AccessibleWrapper;