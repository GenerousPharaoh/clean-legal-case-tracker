import React, { useEffect } from 'react';
import { initCustomPlugins } from './tinymce-init';
// Remove the explicit .ts extension to ensure consistent imports

/**
 * TinyMCEInit - Ensures TinyMCE is properly initialized for self-hosted mode
 * This component should be added near the top of your app to initialize TinyMCE
 */
const TinyMCEInit: React.FC = () => {
  useEffect(() => {
    // Initialize TinyMCE global settings when component mounts
    if (window?.tinymce) {
      try {
      // Set base URL for TinyMCE resources
      window.tinymce.baseURL = '/tinymce';
      window.tinymce.suffix = '.min';
      
        // Initialize custom plugins
        initCustomPlugins();
        
        console?.log?.('TinyMCE initialized in self-hosted mode with custom plugins');
      } catch (error) {
        console?.error?.('Error configuring TinyMCE:', error);
      }
    } else {
      console?.warn?.('TinyMCE global object not available');
    }
    
    return () => {
      // Cleanup on unmount if needed
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default TinyMCEInit; 