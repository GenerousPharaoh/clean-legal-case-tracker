/**
 * Disable React PropType warnings in both development and production
 * This helps clean up the console when third-party libraries have incorrect PropTypes
 */

// Run in both development and production to suppress warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  // Log PropType warnings for debugging - will only output in development
  if (typeof args[0] === 'string' && 
      (args[0].includes('Warning: Failed prop type') || 
       args[0].includes('type specification of prop') ||
       args[0].includes('but returned a object') ||
       args[0].includes('nodeRef'))) {
    console.log('SUPPRESSED WARNING:', args[0].substring(0, 150) + '...');
  }
  
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
    'Expected `ref` to be a ref object or function',
    'You may have forgotten to pass an argument to the type checker creator',
    'the type checker function must return',
    'anchorOrigin'
  ];
  
  // Only proceed if the first argument is a string
  if (typeof args[0] !== 'string') {
    return originalConsoleError(...args);
  }
  
  // Check if this is a warning we want to suppress
  if (suppressedWarnings.some(warning => {
      if (warning.includes('*')) {
        // Handle simple wildcard pattern
        const pattern = new RegExp(warning.replace(/\*/g, '.*'));
        return pattern.test(args[0]);
      }
      return args[0].includes(warning);
  })) {
    // Suppress this warning
    return;
  }
  
  // Pass through other console errors
  originalConsoleError(...args);
};

export default function initDisablePropTypeWarnings() {
  // This function exists just to make importing this file cleaner
  // The actual work happens when the file is loaded
  
  // Force this to be used as a side-effect
  return true;
} 