/**
 * Disable React PropType warnings in both development and production
 * This helps clean up the console when third-party libraries have incorrect PropTypes
 */

// Run in both development and production to suppress warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out PropType warnings
  const suppressedWarnings = [
    'Warning: Failed prop type', 
    'type specification of prop', 
    'The prop `nodeRef`',
    'but returned a object',
    'ComponentMap.*is deprecated',
    'transitions.nodeRef.*ref.*required',
    'events.*clear is not a function',
    'forwardRef render functions',
    'Invalid prop `component`',
    'The prop `children` is marked as required',
    'Expected `ref` to be a ref object or function'
  ];
  
  // Check if this is a warning we want to suppress
  if (
    typeof args[0] === 'string' && 
    suppressedWarnings.some(warning => {
      if (warning.includes('*')) {
        // Handle simple wildcard pattern
        const pattern = new RegExp(warning.replace(/\*/g, '.*'));
        return pattern.test(args[0]);
      }
      return args[0].includes(warning);
    })
  ) {
    return;
  }
  
  // Pass through other console errors
  originalConsoleError(...args);
};

export default function initDisablePropTypeWarnings() {
  // This function exists just to make importing this file cleaner
  // The actual work happens when the file is loaded
} 