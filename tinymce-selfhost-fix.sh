#!/bin/bash

echo "🚀 Implementing TinyMCE Self-hosting Fix..."

# Step 1: Install the official React wrapper
echo "📦 Installing TinyMCE packages..."
npm install @tinymce/tinymce-react tinymce

# Step 2: Add the postinstall script to package.json
echo "📝 Adding postinstall script to package.json..."
node -e "
const fs = require('fs');
const path = require('path');
const packageJsonPath = './package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add the postinstall script
if (!packageJson.scripts) packageJson.scripts = {};
packageJson.scripts.postinstall = 'cp -R node_modules/tinymce public/tinymce';

// Write back to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Added postinstall script to package.json');
"

# Step 3: Run the postinstall script to copy TinyMCE to public
echo "🔄 Copying TinyMCE to public directory..."
mkdir -p public/tinymce
cp -R node_modules/tinymce/* public/tinymce/

# Step 4: Create a proper TinyMCE Editor component
echo "🔧 Creating proper TinyMCE Editor component..."
mkdir -p src/components/Editor
cat > src/components/Editor/TinyMCEEditor.tsx << 'EOL'
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
        readonly: readonly,
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
        }
      }}
    />
  );
};

export default TinyMCEEditor;
EOL

# Step 5: Create an index file to export the editor
cat > src/components/Editor/index.ts << 'EOL'
export { default as TinyMCEEditor } from './TinyMCEEditor';
EOL

# Step: Update App.tsx to remove the TinyMCEScriptLoader
echo "🔄 Updating App.tsx to remove TinyMCEScriptLoader..."
sed -i.bak '/TinyMCEScriptLoader/d' src/App.tsx

# Step 6: Clean up node_modules and rebuild
echo "🧹 Cleaning up and rebuilding..."
rm -rf node_modules package-lock.json
npm install
npm run build

echo "✅ TinyMCE self-hosting fix applied! The editor should now work offline."
echo ""
echo "To deploy to Vercel, run:"
echo "vercel --prod"
echo ""
echo "Note: The postinstall script will automatically copy TinyMCE to the public folder on Vercel."
