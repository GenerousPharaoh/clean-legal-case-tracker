/**
 * Initialize TinyMCE with CDN resources
 * This script configures TinyMCE to use the CDN properly
 * FIXED: Updated to always use CDN and simplified plugin configuration
 */

/* global window, console */

// Set global TinyMCE configuration
const tinymceInit = {
  // Configure TinyMCE to use CDN
  setupTinyMCE: () => {
    if (typeof window !== 'undefined' && window.tinymce) {
      // Get API key from environment variables
      const apiKey = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';
      
      // Configure to use assets from CDN with API key
      window.tinymce.baseURL = `https://cdn.tiny.cloud/1/${apiKey}/tinymce/6`;
      window.tinymce.suffix = '.min';
      
      // Patch the init function to ensure editors are not read-only by default
      const originalInit = window.tinymce.init;
      window.tinymce.init = function(settings) {
        // Ensure readonly is explicitly set to false unless specified
        if (settings && settings.readonly === undefined) {
          settings.readonly = false;
        }
        
        // Call the original init function
        return originalInit.call(this, settings);
      };
      
      // Log successful setup
      if (typeof console !== 'undefined') {
        console?.log?.('[TinyMCE] Initialized with CDN configuration');
      }
    } else if (typeof console !== 'undefined') {
      console?.warn?.('[TinyMCE] Not found. Initialization failed.');
    }
  }
};

// Only export if window exists
if (typeof window !== 'undefined') {
  window.tinymceInit = tinymceInit;
  
  // Try to call the setup function immediately
  try {
    tinymceInit?.setupTinyMCE?.();
  } catch (e) {
    console?.error?.('[TinyMCE] Error initializing:', e);
  }
}

export default tinymceInit; 

/**
 * TinyMCE initialization utility functions
 * This file contains utility functions for initializing TinyMCE
 * FIXED: Simplified plugin configuration to use only standard plugins available on CDN
 */

/**
 * Get enhanced TinyMCE configuration
 * @param {Function} onCiteButtonClick - Handler for when the cite button is clicked
 * @returns {Object} TinyMCE configuration object
 */
export const getEnhancedEditorConfig = (onCiteButtonClick) => {
  // Get API key from environment variables
  const apiKey = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';
  
  return {
    // FIXED: Use only standard plugins available on CDN
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'wordcount', 'help'
    ],
    // FIXED: Simplified toolbar configuration
    toolbar: `
      undo redo | styles | fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | 
      alignleft aligncenter alignright alignjustify | bullist numlist outdent indent |
      link image media table | searchreplace | preview fullscreen | help
    `,
    // Style formats
    style_formats: [
      { title: 'Paragraph', format: 'p' },
      { title: 'Heading 1', format: 'h1' },
      { title: 'Heading 2', format: 'h2' },
      { title: 'Heading 3', format: 'h3' },
      { title: 'Heading 4', format: 'h4' },
      { title: 'Code Block', block: 'pre' },
      { title: 'Blockquote', block: 'blockquote' },
    ],
    style_formats_merge: false,
    style_formats_autohide: true,
    // Font options
    font_family_formats: 'Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Wingdings=wingdings,zapf dingbats',
    font_size_formats: '8pt 10pt 11pt 12pt 14pt 18pt 24pt 36pt',
    // Other settings
    relative_urls: false,
    remove_script_host: true,
    convert_urls: true,
    browser_spellcheck: true,
    contextmenu: false,
    image_advtab: true,
    extended_valid_elements: 'span[class|style|data-*|contenteditable|title]',
    custom_elements: 'span',
    end_container_on_empty_block: true,
    image_caption: true,
    table_default_styles: {
      width: '100%'
    },
    paste_data_images: true,
    autoresize_min_height: 500,
    autoresize_max_height: 2000,
    autoresize_overflow_padding: 15,
    autoresize_bottom_margin: 30,
    menubar: false,
    statusbar: true, 
    elementpath: false,
    branding: false,
    
    // FIXED: Configure to use CDN
    skin: 'oxide',
    content_css: 'default',
    // Explicitly set CDN paths with API key
    base_url: `https://cdn.tiny.cloud/1/${apiKey}/tinymce/6`,
    suffix: '.min',
    // Disable promotion banner
    promotion: false,
    
    // FIXED: Simplified setup without custom plugins
    setup: function(editor) {
      // Add a simple button that uses a standard icon
      editor.ui.registry.addButton('cite', {
        icon: 'bookmark',
        tooltip: 'Cite Evidence',
        onAction: function() {
          if (typeof onCiteButtonClick === 'function') {
            onCiteButtonClick(editor);
          }
        }
      });
    }
  };
};