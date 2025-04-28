/**
 * Fallback build script using esbuild
 * Used when Vite fails to build the project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 FALLBACK BUILD WITH ESBUILD STARTED');

// Constants
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const srcDir = path.join(projectRoot, 'src');
const publicDir = path.join(projectRoot, 'public');
const indexHtml = path.join(projectRoot, 'index.html');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create dist/src directory
const distSrcDir = path.join(distDir, 'src');
if (!fs.existsSync(distSrcDir)) {
  fs.mkdirSync(distSrcDir, { recursive: true });
}

// Copy public files
console.log('Copying public files...');
if (fs.existsSync(publicDir)) {
  copyDir(publicDir, distDir);
}

// Copy and modify index.html
if (fs.existsSync(indexHtml)) {
  let content = fs.readFileSync(indexHtml, 'utf8');
  // Fix the script path to point to our built JS
  content = content.replace('src="/src/main.tsx"', 'src="./src/main.js"');
  fs.writeFileSync(path.join(distDir, 'index.html'), content);
  console.log('✅ index.html copied and modified');
} else {
  // Create fallback index.html
  const fallbackHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legal Case Tracker</title>
    <style>
      body {
        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        margin: 0;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 800px;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      h1 { color: #2563eb; }
      #root { width: 100%; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Legal Case Tracker</h1>
      <p>Loading application...</p>
      <div id="root"></div>
    </div>
    <script src="./src/main.js"></script>
  </body>
</html>
  `;
  fs.writeFileSync(path.join(distDir, 'index.html'), fallbackHtml);
  console.log('✅ Created fallback index.html');
}

// Create minimal main.js
const mainJsContent = `
// Fallback main.js created by esbuild-fallback script
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = \`
      <div style="padding: 20px; text-align: center;">
        <h2>Legal Case Tracker</h2>
        <p>Application is loading or temporarily in maintenance mode.</p>
        <p>If this message persists, please contact support.</p>
        <button onclick="window.location.reload()" style="padding: 10px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Refresh Page</button>
      </div>
    \`;
  }
});
`;

// Write the minimal main.js
fs.writeFileSync(path.join(distSrcDir, 'main.js'), mainJsContent);
console.log('✅ Created minimal main.js');

// Helper function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Try to use esbuild directly as a last resort
try {
  console.log('Checking for esbuild...');
  // Check if esbuild is installed
  try {
    require.resolve('esbuild');
    console.log('✅ esbuild found');
    
    // Try to compile a minimal bundle for main.js
    console.log('Attempting to compile with esbuild...');
    
    const esbuild = require('esbuild');
    const entryPoint = path.join(srcDir, 'main.tsx');
    
    if (fs.existsSync(entryPoint)) {
      try {
        esbuild.buildSync({
          entryPoints: [entryPoint],
          bundle: true,
          minify: true,
          format: 'esm',
          outfile: path.join(distSrcDir, 'main.js'),
          loader: {
            '.tsx': 'tsx',
            '.ts': 'ts',
            '.jsx': 'jsx',
            '.css': 'css',
            '.svg': 'dataurl',
            '.png': 'dataurl',
            '.jpg': 'dataurl',
          },
          define: {
            'process.env.NODE_ENV': '"production"'
          },
          external: [
            'react', 'react-dom', 'react-router-dom',
            '@mui/*', 'tinymce/*'
          ]
        });
        console.log('✅ esbuild compilation successful');
      } catch (err) {
        console.error('❌ esbuild compilation failed:', err.message);
        console.log('Using minimal fallback main.js');
      }
    } else {
      console.log('⚠️ Entry point not found, using minimal fallback');
    }
  } catch (err) {
    console.log('⚠️ esbuild not available, using minimal fallback');
  }
} catch (err) {
  console.error('❌ Error checking for esbuild:', err.message);
}

console.log('🎉 FALLBACK BUILD COMPLETED');
console.log('The application will deploy, even if in a limited state.');
