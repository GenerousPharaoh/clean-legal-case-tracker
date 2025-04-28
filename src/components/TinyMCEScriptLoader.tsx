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
  const [triedSelfHosted, setTriedSelfHosted] = useState(false);

  useEffect(() => {
    // If TinyMCE is already loaded, don't load it again
    if (window.tinymce) {
      setLoaded(true);
      return;
    }

    const loadScript = (fromCDN: boolean) => {
      try {
        // Remove any previously failed script tags
        const existingScript = document.querySelector('script[data-tinymce-loader="true"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.setAttribute('data-tinymce-loader', 'true');
        
        if (fromCDN) {
          // Option A: Use TinyMCE CDN
          script.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js';
          script.referrerPolicy = 'origin';
          console.log('Loading TinyMCE from CDN as fallback');
        } else {
          // Option B: Use self-hosted TinyMCE
          script.src = '/tinymce/tinymce.min.js';
          console.log('Attempting to load self-hosted TinyMCE');
        }
        
        script.async = true;
        script.onload = () => {
          console.log(`TinyMCE script loaded successfully from ${fromCDN ? 'CDN' : 'self-hosted path'}`);
          
          // Set the base URL for TinyMCE assets if self-hosted
          if (!fromCDN && window.tinymce) {
            window.tinymce.baseURL = '/tinymce';
            window.tinymce.suffix = '.min';
          }
          
          setLoaded(true);
          setError(null);
        };
        
        script.onerror = (e) => {
          const errorMsg = `Failed to load TinyMCE script from ${fromCDN ? 'CDN' : 'self-hosted path'}`;
          console.error(errorMsg, e);
          
          if (!fromCDN && !triedSelfHosted) {
            // If self-hosted load failed, try CDN as fallback
            console.log('Self-hosted TinyMCE load failed, falling back to CDN');
            setTriedSelfHosted(true);
            loadScript(true); // Retry with CDN
          } else {
            setError(new Error(errorMsg));
          }
        };
        
        document.head.appendChild(script);
      } catch (err) {
        console.error('Error loading TinyMCE script:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        if (!fromCDN && !triedSelfHosted) {
          // If self-hosted load failed with exception, try CDN as fallback
          console.log('Self-hosted TinyMCE load exception, falling back to CDN');
          setTriedSelfHosted(true);
          loadScript(true); // Retry with CDN
        }
      }
    };

    // Start with user's preference (CDN or self-hosted)
    loadScript(useCDN);

    // Clean up script tag if component unmounts during loading
    return () => {
      const script = document.querySelector('script[data-tinymce-loader="true"]');
      if (script && !loaded) {
        document.head.removeChild(script);
      }
    };
  }, [useCDN]);

  // This component doesn't render anything visible
  return null;
};

export default TinyMCEScriptLoader; 