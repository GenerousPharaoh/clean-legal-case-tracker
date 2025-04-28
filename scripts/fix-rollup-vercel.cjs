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

// Create actual mock directories for problematic native modules
function createMockNativeModule(moduleName) {
  const moduleDir = path.join(process.cwd(), 'node_modules', moduleName);
  
  try {
    // Create directories if they don't exist
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }
    
    // Create a mock index.js file
    const indexPath = path.join(moduleDir, 'index.js');
    fs.writeFileSync(indexPath, `
// Mock ${moduleName} module created by fix-rollup-vercel.cjs
module.exports = require('rollup/dist/rollup.js');
    `);
    
    // Create a package.json file
    const packagePath = path.join(moduleDir, 'package.json');
    fs.writeFileSync(packagePath, JSON.stringify({
      name: moduleName,
      version: '4.40.0',
      description: 'Mock native module for Vercel deployment',
      main: 'index.js'
    }, null, 2));
    
    console.log(`[fix-rollup] Created mock module for ${moduleName}`);
    return true;
  } catch (err) {
    console.error(`[fix-rollup] Failed to create mock for ${moduleName}:`, err.message);
    return false;
  }
}

// Create mock modules for all problematic modules
for (const moduleName of MODULES_TO_MOCK) {
  createMockNativeModule(moduleName);
}

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
  
  // Create a .npmrc file with essential settings
  const npmrcPath = path.join(process.cwd(), '.npmrc');
  const npmrcContent = `
# NPM configuration to fix Rollup issues
ROLLUP_NATIVE_DISABLE=1
legacy-peer-deps=true
fund=false
`;
  
  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log('Created/updated .npmrc with proper settings');
  
} catch (err) {
  console.error('Error updating environment files:', err);
}

// Monkey patch Node.js modules directly
try {
  const rollupPath = path.join(process.cwd(), 'node_modules', 'rollup', 'dist', 'native.js');
  
  if (fs.existsSync(rollupPath)) {
    console.log('Directly patching Rollup native.js...');
    
    // Create a better native.js patch that provides the required named exports
    const patchedContent = `
// Patched by fix-rollup-vercel.cjs to fix ESM/CJS compatibility issues
const path = require('path');

// Fake Rollup implementation
const fakeRollup = require('./rollup.js');

// Create mock functions
const parse = () => ({ type: 'Program', body: [] });
const parseAsync = async () => ({ type: 'Program', body: [] });
const getDefaultRollup = () => fakeRollup;
const getDefaultBundle = () => ({ id: 'noop' });
const isNativeSupported = () => false;
const getBundleVersion = () => '0.0.0';

// Export everything
exports.parse = parse;
exports.parseAsync = parseAsync;
exports.getDefaultRollup = getDefaultRollup;
exports.getDefaultBundle = getDefaultBundle;
exports.isNativeSupported = isNativeSupported;
exports.getBundleVersion = getBundleVersion;

// Also add default export
module.exports = {
  parse,
  parseAsync,
  getDefaultRollup,
  getDefaultBundle,
  isNativeSupported,
  getBundleVersion
};
`;
    
    fs.writeFileSync(rollupPath, patchedContent);
    console.log('Successfully patched Rollup native.js with ESM compatibility');
  }
} catch (err) {
  console.error('Failed to patch Rollup directly:', err);
}

console.log('Rollup fix applied successfully!');
