import React, { useEffect, useState } from 'react';

interface ScriptLoaderProps {
  useCDN?: boolean;
}

/**
 * TinyMCEScriptLoader - Handles loading TinyMCE script from CDN
 * FIXED: Always use CDN regardless of the useCDN prop value to prevent plugin loading errors
 */
const TinyMCEScriptLoader: React.FC<ScriptLoaderProps> = ({ useCDN = true }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If TinyMCE is already loaded, don't load it again
    if (window.tinymce) {
      console.log('[TinyMCE] Already loaded, skipping initialization');
      setLoaded(true);
      return;
    }

    // Remove any previously failed script tags
    const existingScript = document.querySelector('script[data-tinymce-loader="true"]');
    if (existingScript) {
      document.head.removeChild(existingScript);
    }

    try {
      console.log('[TinyMCE] Loading from CDN...');
      
      // Get API key from environment variables
      const apiKey = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';
      console.log(`[TinyMCE] Using API key: ${apiKey.substring(0, 4)}...`);
      
      // Create the script element
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.setAttribute('data-tinymce-loader', 'true');
      
      // FIXED: Always use CDN regardless of useCDN prop, and use API key
      script.src = `https://cdn.tiny.cloud/1/${apiKey}/tinymce/6/tinymce.min.js`;
      script.referrerPolicy = 'origin';
      
      script.async = true;
      
      // Success handler
      script.onload = () => {
        console.log('[TinyMCE] Successfully loaded from CDN');
        
        // FIXED: Configure TinyMCE to use CDN for plugins
        if (window.tinymce) {
          window.tinymce.baseURL = `https://cdn.tiny.cloud/1/${apiKey}/tinymce/6`;
          window.tinymce.suffix = '.min';
          
          // Set global TinyMCE settings
          window.tinymceSettings = {
            // Use cloud version
            cloudBased: true,
            // Only use basic plugins that are guaranteed to be available
            plugins: 'link image table code help wordcount',
            // Simplified toolbar without problematic plugins
            toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link image',
            // Disable promotion banner
            promotion: false
          };
        }
        
        setLoaded(true);
        setError(null);
      };
      
      // Error handler
      script.onerror = (e) => {
        const errorMsg = 'Failed to load TinyMCE script from CDN';
        console.error(errorMsg, e);
        setError(new Error(errorMsg));
      };
      
      // Add the script to the document
      document.head.appendChild(script);
      
    } catch (err) {
      console.error('[TinyMCE] Error loading script:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }

    // Clean up script tag if component unmounts during loading
    return () => {
      const script = document.querySelector('script[data-tinymce-loader="true"]');
      if (script && !loaded) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default TinyMCEScriptLoader;
