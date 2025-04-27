// This script should be run before building on Vercel
// Add this to a prebuild step if possible
const fs = require('fs');
const path = require('path');

console.log('Running build patch...');

// Path to the problematic file
const nativeJsPath = path.join(process.cwd(), 'node_modules/rollup/dist/native.js');

// Check if the file exists
if (fs.existsSync(nativeJsPath)) {
  console.log(`Patching ${nativeJsPath}...`);
  
  // Read the file content
  const content = fs.readFileSync(nativeJsPath, 'utf8');
  
  // Create a modified version that skips native module loading
  const patchedContent = content.replace(
    /function requireWithFriendlyError[^}]*}/s,
    'function requireWithFriendlyError() { return null; }'
  );
  
  // Write the patched file
  fs.writeFileSync(nativeJsPath, patchedContent);
  console.log('File patched successfully!');
} else {
  console.log('Native.js file not found, skipping patch.');
}

// Also create a dummy file to ensure Vite doesn't fail
const dummyNativePath = path.join(process.cwd(), 'node_modules/@rollup/rollup-linux-x64-gnu');
if (!fs.existsSync(dummyNativePath)) {
  fs.mkdirSync(dummyNativePath, { recursive: true });
  fs.writeFileSync(path.join(dummyNativePath, 'index.js'), 'module.exports = {};');
  console.log('Created dummy native module.');
}

console.log('Patch completed.');
