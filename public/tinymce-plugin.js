/**
 * Custom citeevidence plugin for TinyMCE
 */
(function() {
  // Register the plugin
  tinymce.PluginManager.add('citeevidence', function(editor) {
    // Add a button to the toolbar
    editor.ui.registry.addButton('citeevidence', {
      icon: 'bookmark',
      tooltip: 'Cite Evidence',
      onAction: function() {
        const selectedText = editor.selection.getContent({ format: 'text' });
        if (selectedText) {
          // Insert a styled citation span
          editor.insertContent('<span class="evidence-citation" style="background-color:#f0f7ff;color:#2962ff;padding:2px 4px;border-radius:3px;border:1px solid #90caf9;font-weight:500;">' + selectedText + '</span>');
        } else {
          // If no text is selected, prompt the user
          editor.windowManager.open({
            title: 'Insert Citation',
            body: {
              type: 'panel',
              items: [
                {
                  type: 'input',
                  name: 'citation',
                  label: 'Citation text'
                }
              ]
            },
            buttons: [
              {
                type: 'cancel',
                text: 'Cancel'
              },
              {
                type: 'submit',
                text: 'Insert',
                primary: true
              }
            ],
            onSubmit: function(api) {
              const data = api.getData();
              if (data.citation) {
                editor.insertContent('<span class="evidence-citation" style="background-color:#f0f7ff;color:#2962ff;padding:2px 4px;border-radius:3px;border:1px solid #90caf9;font-weight:500;">' + data.citation + '</span>');
              }
              api.close();
            }
          });
        }
      }
    });

    // Add custom styles for the citation spans
    editor.on('init', function() {
      editor.dom.addStyle(`
        .evidence-citation {
          background-color: #f0f7ff;
          color: #2962ff;
          padding: 2px 4px;
          border-radius: 3px;
          border: 1px solid #90caf9;
          font-weight: 500;
        }
      `);
    });

    return {
      getMetadata: function() {
        return {
          name: 'Cite Evidence',
          url: 'https://example.com/cite-evidence-plugin'
        };
      }
    };
  });
})();
