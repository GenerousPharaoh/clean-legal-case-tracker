/**
 * This script cleans up the node_modules directory to resolve dependency conflicts
 * 
 * Run this after npm install if you encounter dependency-related errors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_MODULES = path.join(__dirname, 'node_modules');

// Functions to clean up problematic dependencies
function cleanupDuplicates() {
  console.log('Checking for duplicate dependencies...');
  
  // List of packages that often cause issues with duplicates
  const packagesToCheck = [
    'react',
    'react-dom',
    'framer-motion',
    '@emotion/react',
    '@emotion/styled',
    '@mui/material',
    '@mui/system'
  ];
  
  // Check each package for duplicates
  packagesToCheck.forEach(pkg => {
    const basePackagePath = path.join(NODE_MODULES, pkg);
    
    if (!fs.existsSync(basePackagePath)) {
      console.log(`Package ${pkg} not found in node_modules`);
      return;
    }
    
    // Look for duplicates within node_modules
    findDuplicates(NODE_MODULES, pkg);
  });
}

// Function to find duplicate packages
function findDuplicates(dir, packageName, depth = 0) {
  if (depth > 3) return; // Limit recursion depth
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    
    // Skip the main package itself
    if (itemPath === path.join(NODE_MODULES, packageName)) {
      continue;
    }
    
    // Check if this is a duplicate of our target package
    if (item === packageName && fs.statSync(itemPath).isDirectory()) {
      console.log(`Found duplicate: ${itemPath}`);
      
      // Check if it has a package.json
      const packageJsonPath = path.join(itemPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        console.log(`Removing duplicate ${packageName} in ${itemPath}`);
        fs.rmSync(itemPath, { recursive: true, force: true });
      }
    }
    
    // Check nested node_modules
    const nestedNodeModules = path.join(itemPath, 'node_modules');
    if (fs.existsSync(nestedNodeModules) && fs.statSync(nestedNodeModules).isDirectory()) {
      findDuplicates(nestedNodeModules, packageName, depth + 1);
    }
  }
}

// Fix MUI and framer-motion compatibility issues
function fixMuiFramerMotion() {
  console.log('Checking for MUI and framer-motion compatibility issues...');
  
  // Paths to relevant packages
  const framerMotionPath = path.join(NODE_MODULES, 'framer-motion');
  const muiMaterialPath = path.join(NODE_MODULES, '@mui', 'material');
  const muiSystemPath = path.join(NODE_MODULES, '@mui', 'system');
  
  // Make sure framer-motion is installed at the root
  if (!fs.existsSync(framerMotionPath)) {
    console.error('framer-motion not found in node_modules!');
    console.log('Attempting to install framer-motion v10.16.16...');
    try {
      execSync('npm install framer-motion@10.16.16 --save-exact');
    } catch (e) {
      console.error('Failed to install framer-motion:', e);
    }
  }
  
  // Check for nested framer-motion in MUI packages
  const checkNestedFramerMotion = (packagePath, packageName) => {
    const nestedFramerMotion = path.join(packagePath, 'node_modules', 'framer-motion');
    if (fs.existsSync(nestedFramerMotion)) {
      console.log(`Found nested framer-motion in ${packageName}`);
      console.log(`Removing nested framer-motion from ${packageName}...`);
      fs.rmSync(nestedFramerMotion, { recursive: true, force: true });
    }
  };
  
  // Check MUI packages for nested framer-motion
  if (fs.existsSync(muiMaterialPath)) {
    checkNestedFramerMotion(muiMaterialPath, '@mui/material');
  }
  
  if (fs.existsSync(muiSystemPath)) {
    checkNestedFramerMotion(muiSystemPath, '@mui/system');
  }
}

// Main function to clean up dependencies
async function cleanup() {
  console.log('Starting dependency cleanup...');
  
  try {
    // Run cleanup functions
    cleanupDuplicates();
    fixMuiFramerMotion();
    
    console.log('Dependency cleanup completed successfully.');
    
    // Recommend a rebuild
    console.log('\nTo ensure changes take effect, please run:');
    console.log('npm run build');
  } catch (error) {
    console.error('Error during dependency cleanup:', error);
  }
}

// Run the cleanup
cleanup().catch(console.error);
