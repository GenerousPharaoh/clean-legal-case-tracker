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
    'transitions.nodeRef.*ref.*required'
  ];
  
  if (
    typeof args[0] === 'string' && 
    suppressedWarnings.some(warning => args[0].includes(warning))
  ) {
    return;
  }
  originalConsoleError(...args);
};

export default function initDisablePropTypeWarnings() {
  // This function exists just to make importing this file cleaner
  // The actual work happens when the file is loaded
} 