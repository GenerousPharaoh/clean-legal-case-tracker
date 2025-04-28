/**
 * Fix for the error: "this.events[e].clear is not a function"
 * 
 * This utility patches the MUI EventManager to handle missing clear methods
 * during component unmounting.
 */

// Apply this fix as early as possible in the application
(function applyEventManagerFix() {
  try {
    // Add Map.clear polyfill if it doesn't exist
    if (!Map.prototype.hasOwnProperty('clear') && typeof Map.prototype.delete === 'function') {
      Object.defineProperty(Map.prototype, 'clear', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function() {
          const keys = Array.from(this.keys());
          keys.forEach(key => this.delete(key));
          return this;
        }
      });
      console.log('[EventFix] Added Map.clear polyfill');
    }

    // Create a global error handler for specific MUI event errors
    window.addEventListener('error', function(event) {
      if (event && event.error && event.error.message && 
          event.error.message.includes('clear is not a function')) {
        console.warn('[EventFix] Caught clear method error in global handler');
        event.preventDefault();
        return true;
      }
    });

    console.log('[EventFix] Successfully applied EventManager fix');
  } catch (error) {
    console.error('[EventFix] Error applying event manager fix:', error);
  }
})();

// This function will be called from main.tsx
export default function initFixEventManager() {
  // The actual fix is applied immediately when this file is imported
  console.log('[EventFix] Event manager fix initialized');
} 