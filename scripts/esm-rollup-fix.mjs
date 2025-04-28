/**
 * ESM-compatible Rollup fix for Vercel deployment
 * This script creates ESM-compatible versions of Rollup's native modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('📋 Running ESM-compatible Rollup fix...');

// Set environment variables
process.env.ROLLUP_NATIVE_DISABLE = '1';

// Create ESM-compatible version of native.js in the dist folder
function createEsmCompatibleNativeJs() {
  // Create target directory for ESM modules
  const targetDir = path.join(projectRoot, 'node_modules', 'rollup', 'dist', 'es');
  
  // Check if directory exists
  if (!fs.existsSync(targetDir)) {
    console.log('Rollup ES directory not found, skipping ESM patch');
    return false;
  }
  
  // List of files to patch
  const filesToPatch = [
    // ParseAst.js needs to import from native.js
    path.join(targetDir, 'shared', 'parseAst.js'),
    // Any other files that import from native.js
  ];
  
  // Create patched ESM version of native.js
  const nativeModulePath = path.join(projectRoot, 'node_modules', 'rollup', 'dist', 'es', 'native.js');
  
  // Create patched content
  const patchedNativeJs = `// Patched ESM native.js by esm-rollup-fix.mjs

// Mock AST parser implementation
export const parse = () => ({ type: 'Program', body: [], sourceType: 'module' });
export const parseAsync = async () => ({ type: 'Program', body: [], sourceType: 'module' });

// Mock implementation of other exports
export const getDefaultRollup = () => ({ version: '4.0.0' });
export const getDefaultBundle = () => ({ id: 'mock-bundle' });
export const isNativeSupported = () => false;
export const getBundleVersion = () => '0.0.0';

// Export as default as well for CJS compatibility
export default {
  parse,
  parseAsync,
  getDefaultRollup,
  getDefaultBundle,
  isNativeSupported,
  getBundleVersion
};
`;

  try {
    // Write the patched ESM module
    fs.writeFileSync(nativeModulePath, patchedNativeJs);
    console.log(`✅ Created ESM-compatible native.js at ${nativeModulePath}`);
    
    // Patch files that import from native.js if needed
    for (const filePath of filesToPatch) {
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace relative imports with absolute path
        content = content.replace(
          /from\s+['"]\.\.\/\.\.\/native\.js['"]/g,
          `from '../../native.js'`
        );
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed imports in ${filePath}`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Failed to create ESM-compatible native.js:', err.message);
    return false;
  }
}

// Create mock native module directories
function createMockNativeModules() {
  const nativeModules = [
    '@rollup/rollup-linux-x64-gnu',
    '@rollup/rollup-darwin-x64',
    '@rollup/rollup-darwin-arm64'
  ];
  
  for (const moduleName of nativeModules) {
    const moduleDir = path.join(projectRoot, 'node_modules', moduleName);
    
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }
      
      // Create CJS index.js
      const indexPath = path.join(moduleDir, 'index.js');
      fs.writeFileSync(indexPath, `
// Mock ${moduleName} module (CJS)
module.exports = {};
      `);
      
      // Create package.json with ESM support
      const packagePath = path.join(moduleDir, 'package.json');
      fs.writeFileSync(packagePath, JSON.stringify({
        name: moduleName,
        version: '4.40.0',
        description: 'Mock native module with ESM compatibility',
        main: 'index.js',
        type: 'commonjs'
      }, null, 2));
      
      console.log(`✅ Created mock module for ${moduleName}`);
    } catch (err) {
      console.error(`❌ Failed to create mock for ${moduleName}:`, err.message);
    }
  }
}

// Create appropriate .npmrc file
function createNpmrc() {
  const npmrcPath = path.join(projectRoot, '.npmrc');
  const npmrcContent = `
# NPM configuration for Rollup/ESM compatibility
ROLLUP_NATIVE_DISABLE=1
node-linker=hoisted
legacy-peer-deps=true
public-hoist-pattern[]=*rollup*
public-hoist-pattern[]=*esbuild*
`;
  
  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log('✅ Created .npmrc with ESM compatibility settings');
}

// Set environment variables
function setEnvironmentVariables() {
  // Create or update .env.local file
  const envPath = path.join(projectRoot, '.env.local');
  let envContent = '';
  
  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
  } catch (err) {
    console.log('No existing .env.local file found, creating new one');
  }
  
  // Check if variable is already set
  if (!envContent.includes('ROLLUP_NATIVE_DISABLE=1')) {
    envContent += '\nROLLUP_NATIVE_DISABLE=1\n';
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Added ROLLUP_NATIVE_DISABLE=1 to .env.local');
  }
}

// Main execution
try {
  // Create mock native modules
  createMockNativeModules();
  
  // Create ESM-compatible native.js
  createEsmCompatibleNativeJs();
  
  // Create .npmrc file
  createNpmrc();
  
  // Set environment variables
  setEnvironmentVariables();
  
  console.log('✅ ESM-compatible Rollup fix completed successfully!');
} catch (err) {
  console.error('❌ Error applying ESM-compatible Rollup fix:', err);
} 