/**
 * patch-minified.js
 * 
 * This script directly patches the minified bundle that contains the error.
 * It modifies the 'index-Dyyg0R_S.js' file at runtime to fix the problematic code.
 */
(function() {
  console.log('[PATCH-MINIFIED] Initializing direct minified bundle patcher');

  // Function to patch the script content
  function patchScript(scriptElement) {
    try {
      // We'll use the Fetch API to get the script content
      fetch(scriptElement.src)
        .then(response => response.text())
        .then(content => {
          console.log('[PATCH-MINIFIED] Successfully fetched minified bundle');
          
          // Look for the problematic code pattern
          // The error occurs in r$e.unmount at line 572:119071
          // We're looking for something like: 
          // r$e.unmount=function(e){this.events[e].clear()...}
          
          // Function to patch the problematic section
          let patchedContent = content;
          
          // Search for patterns that could be related to the clear method error
          const clearErrors = [
            // Common patterns from minified React component unmounting
            /(\w+)\.unmount=function\((\w+)\){[^{}]*this\.events\[\2\]\.clear\(\)/g,
            /function\s+\w+\(\w+\)\{[^{}]*\.events\[\w+\]\.clear\(\)/g,
            /unmount:function\(\w+\)\{[^{}]*this\.events\[\w+\]\.clear\(\)/g
          ];
          
          // Apply all potential patches
          clearErrors.forEach(pattern => {
            patchedContent = patchedContent.replace(pattern, (match, captureGroup1, captureGroup2) => {
              console.log('[PATCH-MINIFIED] Found problematic pattern:', match.substring(0, 50) + '...');
              
              // Create a safer version
              if (captureGroup1 && captureGroup2) {
                // First pattern match
                return `${captureGroup1}.unmount=function(${captureGroup2}){if(this.events && this.events[${captureGroup2}]){` +
                       `if(typeof this.events[${captureGroup2}].clear==="function"){this.events[${captureGroup2}].clear()}` +
                       `else{delete this.events[${captureGroup2}]}}`;
              } else if (match.includes('this.events')) {
                // General case with 'this.events'
                return match.replace(/this\.events\[(\w+)\]\.clear\(\)/g, 
                  'this.events[$1]&&(typeof this.events[$1].clear==="function"?this.events[$1].clear():delete this.events[$1])');
              } else if (match.includes('.events')) {
                // General case with '.events'
                return match.replace(/(\w+)\.events\[(\w+)\]\.clear\(\)/g, 
                  '$1.events[$2]&&(typeof $1.events[$2].clear==="function"?$1.events[$2].clear():delete $1.events[$2])');
              }
              
              // If we can't specifically identify the pattern, make it safer
              return match.replace(/\.clear\(\)/g, '&&typeof $&==="function"?$&:void 0');
            });
          });
          
          // Only proceed if we actually changed something
          if (patchedContent !== content) {
            console.log('[PATCH-MINIFIED] Successfully patched problematic code');
            
            // Remove the original script
            scriptElement.remove();
            
            // Create a new script element with our patched content
            const newScript = document.createElement('script');
            newScript.textContent = patchedContent;
            newScript.id = 'patched-bundle';
            
            // Add the patched script to the document
            document.head.appendChild(newScript);
            console.log('[PATCH-MINIFIED] Applied patched script to page');
          } else {
            console.log('[PATCH-MINIFIED] No pattern matched for patching');
          }
        })
        .catch(error => {
          console.error('[PATCH-MINIFIED] Error fetching script:', error);
        });
    } catch (err) {
      console.error('[PATCH-MINIFIED] Error in patching process:', err);
    }
  }
  
  // Function to find the specific minified bundle script
  function findAndPatchBundle() {
    // Look for the specific bundle
    const scriptElements = document.querySelectorAll('script[src*="index-Dyyg0R_S.js"]');
    
    if (scriptElements.length > 0) {
      console.log('[PATCH-MINIFIED] Found target bundle script');
      patchScript(scriptElements[0]);
    } else {
      // If we didn't find it, watch for it to be added
      console.log('[PATCH-MINIFIED] Bundle not found, setting up observer');
      
      // Create a mutation observer to catch when the script is added
      const observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              if (node.tagName === 'SCRIPT' && 
                  node.src && 
                  node.src.includes('index-Dyyg0R_S.js')) {
                console.log('[PATCH-MINIFIED] Detected bundle script loading');
                patchScript(node);
                observer.disconnect();
                return;
              }
            }
          }
        }
      });
      
      // Watch for changes to the DOM
      observer.observe(document, { childList: true, subtree: true });
      
      // Also check again after a timeout in case we missed it
      setTimeout(() => {
        const lateScriptElements = document.querySelectorAll('script[src*="index-Dyyg0R_S.js"]');
        if (lateScriptElements.length > 0) {
          console.log('[PATCH-MINIFIED] Found target bundle script after delay');
          patchScript(lateScriptElements[0]);
          observer.disconnect();
        }
      }, 2000);
    }
  }
  
  // Start the patching process
  findAndPatchBundle();
  
  // Also apply on load in case the script is loaded dynamically
  window.addEventListener('load', findAndPatchBundle);
  
  console.log('[PATCH-MINIFIED] Minified bundle patcher initialized');
})();
