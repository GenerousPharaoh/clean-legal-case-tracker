/**
 * TinyMCE Fix for read-only mode
 * This script fixes an issue where all editors are set to read-only by default
 */

(function() {
  if (typeof window === 'undefined') return;

  // Wait for TinyMCE to load
  const applyFix = () => {
    if (!window.tinymce) {
      // TinyMCE not loaded yet, try again later
      setTimeout(applyFix, 100);
      return;
    }

    try {
      console.log('[TinyMCE Fix] Applying read-only fix');
      
      // Patch the editor initialization process
      const originalInit = window.tinymce.init;
      window.tinymce.init = function(settings) {
        // Ensure readonly is explicitly set to false unless specified by the user
        if (settings && settings.readonly === undefined) {
          settings.readonly = false;
        }
        
        // Make sure we do not override explicit user settings for readonly
        return originalInit.call(this, settings);
      };
      
      // Patch existing editors if any
      if (window.tinymce.editors && window.tinymce.editors.length > 0) {
        window.tinymce.editors.forEach(editor => {
          if (editor && editor.getParam('readonly') === undefined) {
            editor.settings.readonly = false;
            
            // Try to update the editor's read-only state if it's already initialized
            if (editor.getBody()) {
              editor.getBody().contentEditable = true;
              editor.readonly = false;
              editor.setMode('design');
            }
          }
        });
      }
      
      console.log('[TinyMCE Fix] Read-only fix applied successfully');
    } catch (e) {
      console.error('[TinyMCE Fix] Error applying read-only fix:', e);
    }
  };

  // Apply fix when DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    applyFix();
  } else {
    document.addEventListener('DOMContentLoaded', applyFix);
  }
  
  // Also try to apply on window load
  window.addEventListener('load', applyFix);
})(); 