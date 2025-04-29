import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  readonly?: boolean;
}

const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({ 
  value, 
  onChange, 
  height = 500,
  readonly = false
}) => {
  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      value={value}
      onEditorChange={(newValue) => onChange(newValue)}
      init={{
        height,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'paste', 'help', 'wordcount',
          'hr', 'noneditable', 'citeevidence'
        ],
        toolbar: 'undo redo | blocks | bold italic forecolor | ' +
          'alignleft aligncenter alignright alignjustify | ' +
          'bullist numlist outdent indent | removeformat | help | citeevidence',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        // Explicitly set readonly based on props with a default of false
        readonly: readonly,
        // Force contentEditable true when not readonly
        init_instance_callback: function(editor) {
          if (!readonly && editor.getBody()) {
            editor.getBody().contentEditable = true;
          }
        },
        // Explicitly set the base URL to the public folder
        base_url: '/tinymce',
        setup: function (editor) {
          // Register the cite evidence plugin if it doesn't exist
          if (!editor.plugins.citeevidence) {
            editor.ui.registry.addButton('citeevidence', {
              icon: 'bookmark',
              tooltip: 'Cite Evidence',
              onAction: function () {
                const selectedText = editor.selection.getContent({ format: 'text' });
                if (selectedText) {
                  editor.insertContent('<span class="evidence-citation">' + selectedText + '</span>');
                }
              }
            });
          }
          
          // Ensure editor is not read-only when it should be editable
          editor.on('init', function() {
            if (!readonly) {
              editor.setMode('design');
              if (editor.getBody()) {
                editor.getBody().contentEditable = true;
              }
            }
          });
        }
      }}
    />
  );
};

export default TinyMCEEditor;
