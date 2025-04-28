import React, { useEffect, useState } from 'react';

interface ScriptLoaderProps {
  useCDN?: boolean;
}

/**
 * TinyMCEScriptLoader - Handles loading TinyMCE script either from CDN or self-hosted path
 * Fix for TinyMCE plugin load failures
 */
const TinyMCEScriptLoader: React.FC<ScriptLoaderProps> = ({ useCDN = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If TinyMCE is already loaded, don't load it again
    if (window.tinymce) {
      setLoaded(true);
      return;
    }

    const loadScript = () => {
      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        
        if (useCDN) {
          // Option A: Use TinyMCE CDN
          script.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js';
          script.referrerPolicy = 'origin';
        } else {
          // Option B: Use self-hosted TinyMCE
          script.src = '/tinymce/tinymce.min.js';
        }
        
        script.async = true;
        script.onload = () => {
          console.log('TinyMCE script loaded successfully');
          
          // Set the base URL for TinyMCE assets if self-hosted
          if (!useCDN && window.tinymce) {
            window.tinymce.baseURL = '/tinymce';
            window.tinymce.suffix = '.min';
          }
          
          setLoaded(true);
        };
        
        script.onerror = (e) => {
          const errorMsg = `Failed to load TinyMCE script from ${useCDN ? 'CDN' : 'self-hosted path'}`;
          console.error(errorMsg, e);
          setError(new Error(errorMsg));
        };
        
        document.head.appendChild(script);
      } catch (err) {
        console.error('Error loading TinyMCE script:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    loadScript();

    // Clean up script tag if component unmounts during loading
    return () => {
      const script = document.querySelector(`script[src="${useCDN ? 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js' : '/tinymce/tinymce.min.js'}"]`);
      if (script && !loaded) {
        document.head.removeChild(script);
      }
    };
  }, [useCDN]);

  // This component doesn't render anything visible
  return null;
};

export default TinyMCEScriptLoader; 