/**
 * TinyMCE Fix - Handles missing plugins and prevents refresh loops
 */
(function() {
  console.log('[TINYMCE-FIX] Initializing...');

  // Track if we've already handled a TinyMCE error to prevent refresh loops
  window.__tinymceErrorHandled = false;

  // Function to set up TinyMCE to use the cloud version instead of local plugins
  function setupTinyMCECloud() {
    // Define a global tinymce configuration
    window.TINYMCE_SETTINGS = {
      // Use cloud version
      cloud_based: true,
      // Base URL for the CDN
      base_url: "https://cdn.tiny.cloud/1/no-api-key/tinymce/6.7.0",
      // Include required plugins
      plugins: "paste link image table code help wordcount hr noneditable",
      // Default toolbar configuration
      toolbar: "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link image",
      // Cache busting for plugins
      suffix: "?v=6.7.0-" + new Date().getTime()
    };

    console.log('[TINYMCE-FIX] Set up TinyMCE to use cloud version');
  }

  // Create a tiny.cloud.min.js script
  function loadTinyMCECloud() {
    // Create a script element to load TinyMCE from CDN
    const script = document.createElement('script');
    script.src = "https://cdn.tiny.cloud/1/no-api-key/tinymce/6.7.0/tinymce.min.js";
    script.referrerPolicy = "origin";
    script.onload = function() {
      console.log('[TINYMCE-FIX] TinyMCE cloud loaded successfully');
    };
    script.onerror = function() {
      console.error('[TINYMCE-FIX] Failed to load TinyMCE cloud');
    };
    document.head.appendChild(script);
  }

  // Intercept 404 errors for TinyMCE plugins
  window.addEventListener('error', function(event) {
    // Check if it's a TinyMCE plugin 404
    if (event && event.target && event.target.tagName === 'SCRIPT' && 
        event.target.src && event.target.src.includes('/tinymce/plugins/')) {
      
      // Only handle this once to prevent refresh loops
      if (!window.__tinymceErrorHandled) {
        console.log('[TINYMCE-FIX] Intercepted TinyMCE plugin 404:', event.target.src);
        window.__tinymceErrorHandled = true;
        
        // Set up TinyMCE cloud and reload
        setupTinyMCECloud();
        loadTinyMCECloud();
        
        // Prevent the default error behavior
        event.preventDefault();
        return true;
      }
    }
  }, true);

  // Set a global variable that TinyMCE initialization can check
  window.tinymceFixApplied = true;
  
  console.log('[TINYMCE-FIX] Initialization complete');
})();
