/**
 * Disable React PropType warnings in production
 * This helps clean up the console when third-party libraries have incorrect PropTypes
 */

// Only run this in production to avoid suppressing useful warnings during development
if (import.meta.env.PROD) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Filter out PropType warnings
    const suppressedWarnings = [
      'Warning: Failed prop type', 
      'type specification of prop', 
      'The prop `nodeRef`',
      'but returned a object'
    ];
    
    if (
      typeof args[0] === 'string' && 
      suppressedWarnings.some(warning => args[0].includes(warning))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

export default function initDisablePropTypeWarnings() {
  // This function exists just to make importing this file cleaner
  // The actual work happens when the file is loaded
} 