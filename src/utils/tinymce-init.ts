/**
 * Initialize TinyMCE self-hosted resources
 * This script ensures TinyMCE can find its assets when running in self-hosted mode
 */

/* global window, console */

interface TinyMceInit {
  setupTinyMCE: () => void;
}

// Set global TinyMCE configuration
const tinymceInit: TinyMceInit = {
  // Configure base URL for TinyMCE assets
  setupTinyMCE: (): void => {
    if (typeof window !== 'undefined' && window.tinymce) {
      // Configure to use assets from public directory
      window.tinymce.baseURL = '/tinymce';
      window.tinymce.suffix = '.min';
      
      // Log successful setup
      if (typeof console !== 'undefined') {
        console?.log?.('Self-hosted TinyMCE initialized successfully');
      }
    } else if (typeof console !== 'undefined') {
      console?.warn?.('TinyMCE not found. Self-hosted initialization failed.');
    }
  }
};

// Declare global TinyMCE types for TypeScript
declare global {
  interface Window {
    tinymce: any;
    tinymceInit?: TinyMceInit;
  }
}

// Only export if window exists
if (typeof window !== 'undefined') {
  window.tinymceInit = tinymceInit;
  
  // Try to call the setup function immediately
  try {
    tinymceInit?.setupTinyMCE?.();
    
    // Also set up a script loaded event handler to ensure the baseURL is set
    // when TinyMCE loads dynamically
    if (document) {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          if (window.tinymce && !window.tinymce.baseURL) {
            window.tinymce.baseURL = '/tinymce';
            window.tinymce.suffix = '.min';
            console?.log?.('TinyMCE baseURL set on DOM ready');
          }
        }, 0);
      });
    }
  } catch (e) {
    console?.error?.('Error initializing TinyMCE:', e);
  }
}

export default tinymceInit; 

/**
 * TinyMCE initialization utility functions
 * This file contains utility functions for initializing TinyMCE with custom plugins
 */

/**
 * Initialize custom plugins for TinyMCE
 */
export const initCustomPlugins = (): void => {
  // Skip if window or tinymce is not available
  if (typeof window === 'undefined' || !window.tinymce) return;
  
  const { tinymce } = window;
  
  // Register the cite evidence plugin
  tinymce.PluginManager.add('citeevidence', function(editor: any) {
    // Add a button to the toolbar
    editor.ui.registry.addButton('citeevidence', {
      icon: 'bookmark',
      tooltip: 'Cite Evidence',
      onAction: function() {
        // The button action will be defined in the TinyMCE component
        // to have access to application state and the citation modal
        editor.dispatch('OpenCitationFinder');
      }
    });
    
    // Add a menu item under "Insert" menu
    editor.ui.registry.addMenuItem('citeevidence', {
      text: 'Cite Evidence...',
      icon: 'bookmark',
      onAction: function() {
        editor.dispatch('OpenCitationFinder');
      }
    });
    
    // Custom content formatter for citation placeholders
    editor.on('PreInit', () => {
      // Add custom styles for citation placeholders
      editor.dom.addStyle(`
        .evidence-link-placeholder {
          display: inline-flex;
          align-items: center;
          background-color: #f0f7ff;
          border-radius: 4px;
          padding: 0 4px;
          margin: 0 2px;
          font-weight: 500;
          color: #2962ff;
          cursor: pointer;
          border: 1px solid #90caf9;
          white-space: nowrap;
          font-size: 0.9em;
          line-height: 1.6;
          position: relative;
        }
        
        .evidence-link-placeholder:hover {
          background-color: #e3f2fd;
          border-color: #64b5f6;
        }
        
        .evidence-link-placeholder:hover::after {
          content: attr(title);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(97, 97, 97, 0.9);
          color: white;
          font-size: 0.75rem;
          padding: 5px 8px;
          border-radius: 4px;
          margin-bottom: 5px;
          z-index: 10000;
          white-space: normal;
          max-width: 250px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          pointer-events: none;
        }
        
        .evidence-link-placeholder:hover::before {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 5px;
          border-style: solid;
          border-color: transparent transparent rgba(97, 97, 97, 0.9) transparent;
          margin-bottom: -5px;
          z-index: 10000;
          pointer-events: none;
        }
      `);
    });
    
    return {
      getMetadata: function() {
        return {
          name: 'Cite Evidence',
          url: 'https://legalcasetracker.app'
        };
      }
    };
  });
};

/**
 * Get enhanced TinyMCE configuration
 * @param onCiteButtonClick - Handler for when the cite button is clicked
 * @returns TinyMCE configuration object
 */
export const getEnhancedEditorConfig = (onCiteButtonClick: (editor: any) => void): Record<string, any> => {
  return {
    // Plugin configuration
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'paste', 'wordcount', 'help',
      'codesample', 'hr', 'nonbreaking', 'autoresize', 'noneditable',
      'citeevidence' // Add our custom plugin
    ],
    toolbar: `
      undo redo | styles | fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | 
      alignleft aligncenter alignright alignjustify | bullist numlist outdent indent |
      link image media table citeevidence | codesample hr charmap | searchreplace | preview fullscreen | help
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
    // Enhanced editor configuration for better performance
    relative_urls: false,
    remove_script_host: true,
    convert_urls: true,
    browser_spellcheck: true,
    contextmenu: false, // Disable the built-in context menu for better performance
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
    autoresize_max_height: 2000, // Add a maximum height to prevent excessive growth
    autoresize_overflow_padding: 15,
    autoresize_bottom_margin: 30,
    menubar: false,
    statusbar: true, 
    elementpath: false, // Disable element path in status bar for cleaner UI
    branding: false,
    
    // Self-hosted configuration - FIXED PATHS
    skin: 'oxide',
    content_css: 'custom',
    
    // Ensure correct path for TinyMCE assets (FIXED)
    // Use absolute paths to avoid Vercel rewriting to index.html
    base_url: '/tinymce',
    suffix: '.min',
    
    // Path for TinyMCE script source
    tinymceScriptSrc: '/tinymce/tinymce.min.js',
    
    // Disable promotion banner
    promotion: false,
    
    // Event handler for the cite button
    setup: function(editor: any) {
      editor.on('OpenCitationFinder', function() {
        if (typeof onCiteButtonClick === 'function') {
          onCiteButtonClick(editor);
        }
      });
    }
  };
};