/**
 * This script patches Node.js module loading to fix Rollup issues during Vercel deployment
 * It intercepts attempts to load platform-specific binaries that don't exist on Vercel
 */

const fs = require('fs');
const path = require('path');

// Original module resolution function
const originalResolve = require.resolve;

// List of problematic modules
const MODULES_TO_MOCK = [
  '@rollup/rollup-linux-x64-gnu',
  '@rollup/rollup-darwin-x64',
  '@rollup/rollup-darwin-arm64',
  // Add other platform-specific modules as needed
];

// Monkey patch require.resolve
require.resolve = function (request, options) {
  // Check if this is one of our problematic modules
  if (MODULES_TO_MOCK.some(mod => request.includes(mod))) {
    console.log(`[fix-rollup] Intercepted request for native module: ${request}`);
    console.log('[fix-rollup] Returning a mock module instead');
    
    // Create a virtual mock path
    const mockPath = path.join(__dirname, 'mock-module.cjs');
    
    // If mock file doesn't exist, create it
    if (!fs.existsSync(mockPath)) {
      fs.writeFileSync(mockPath, 'module.exports = {};\n');
    }
    
    return mockPath;
  }
  
  // Otherwise use the original resolver
  return originalResolve.call(this, request, options);
};

console.log('[fix-rollup] Rollup native module patch installed');

// Fix for Rollup native modules issue in Vercel
console.log('Applying Rollup fix for Vercel deployment...');

// Set environment variable to disable native modules
process.env.ROLLUP_NATIVE_DISABLE = '1';
console.log('Set ROLLUP_NATIVE_DISABLE=1');

// Also write to .env.local to ensure it persists
try {
  const envPath = path.join(process.cwd(), '.env.local');
  
  // Read existing file if it exists
  let envContent = '';
  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
  } catch (err) {
    console.log('No existing .env.local file found, creating new one.');
  }
  
  // Check if ROLLUP_NATIVE_DISABLE is already set using regex to match the variable exactly
  const envVarRegex = /^ROLLUP_NATIVE_DISABLE=/m;
  if (!envVarRegex.test(envContent)) {
    // Append to file
    fs.writeFileSync(
      envPath, 
      (envContent ? envContent + '\n' : '') + 'ROLLUP_NATIVE_DISABLE=1'
    );
    console.log('Added ROLLUP_NATIVE_DISABLE=1 to .env.local');
  } else {
    console.log('ROLLUP_NATIVE_DISABLE already set in .env.local');
  }
} catch (err) {
  console.error('Error updating .env.local:', err);
}

console.log('Rollup fix applied successfully!');
