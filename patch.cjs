// This script patches build issues on Vercel with Rollup
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patch Rollup native.js
const rollupNativePath = path.join(process.cwd(), 'node_modules/rollup/dist/native.js');

// Only run if the file exists
if (fs.existsSync(rollupNativePath)) {
  console.log('Patching Rollup native module...');
  let content = fs.readFileSync(rollupNativePath, 'utf8');
  
  // Create a new content that uses a try/catch around the native module loading
  let patchedContent = content.replace(
    'function requireWithFriendlyError',
    `// Patched for Vercel deployment
function requireNative() {
  return {
    // Mock native methods if needed
    getUniqueID: () => 'dummy-id-' + Date.now(),
    // Add any other methods that the native module may provide
  };
}

// Original code follows
function requireWithFriendlyError`
  );

  // Replace the usage of native module with our dummy one
  patchedContent = patchedContent.replace(
    'const native = requireWithFriendlyError();',
    'const native = process.env.ROLLUP_NATIVE_DISABLE === "true" ? requireNative() : requireWithFriendlyError();'
  );

  fs.writeFileSync(rollupNativePath, patchedContent);
  console.log('Successfully patched Rollup native module.');
}

// Make sure the esbuild binary is there by updating package.json if needed
const esbuildPath = path.join(process.cwd(), 'node_modules/esbuild');
if (fs.existsSync(esbuildPath)) {
  console.log('Checking esbuild installation...');
  // Try to install the linux-x64 version explicitly if needed
  try {
    execSync('npm install @esbuild/linux-x64 --no-save', { stdio: 'inherit' });
    console.log('Successfully installed esbuild Linux binary.');
  } catch (error) {
    console.error('Warning: Failed to install esbuild Linux binary. Build may fail.', error);
  }
}

console.log('Patch script completed.');
