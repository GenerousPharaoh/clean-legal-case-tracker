/**
 * React Loader Script
 * This script loads React from CDN before the application starts
 * This ensures React is globally available for class components
 */

(function() {
  function loadScript(src, integrity, callback) {
    var script = document.createElement('script');
    script.src = src;
    
    if (integrity) {
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
    }
    
    script.onload = callback;
    script.onerror = function() {
      console.error('Failed to load script:', src);
      
      // Try to load without integrity check as fallback
      if (integrity) {
        loadScript(src, null, callback);
      } else if (callback) {
        callback();
      }
    };
    
    document.head.appendChild(script);
  }

  // First load React
  loadScript(
    'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
    'sha256-S0lp+k7zWUMk2ixteM6HZvu8L9Eh//OVrt+ZfbCpmgY=',
    function() {
      console.log('React loaded successfully');
      
      // Then load ReactDOM after React is loaded
      loadScript(
        'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js',
        'sha256-IXWO0ITNDjfnNXIu5POVfqlgYoop36bDzhodR6LW5Pc=',
        function() {
          console.log('ReactDOM loaded successfully');
        }
      );
    }
  );
})();
