/**
 * TinyMCE initialization utility functions
 * This file contains utility functions for initializing TinyMCE with custom plugins
 */

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
      'codesample', 'hr', 'nonbreaking', 'autoresize', 'noneditable'
      // Remove the custom plugin since we're using CDN
    ],
    toolbar: `
      undo redo | styles | fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | 
      alignleft aligncenter alignright alignjustify | bullist numlist outdent indent |
      link image media table | codesample hr charmap | searchreplace | preview fullscreen | help
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
    
    // Use CDN instead of self-hosted
    skin: 'oxide',
    content_css: 'default',
    
    // Use Tiny Cloud CDN
    // No API key needed for basic functionality
    script_url: 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js',
    
    // Disable promotion banner
    promotion: false,
    
    // Event handler for the cite button (now using a different approach)
    setup: function(editor: any) {
      // Add a button to cite evidence without using a custom plugin
      editor.ui.registry.addButton('citeevidence', {
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