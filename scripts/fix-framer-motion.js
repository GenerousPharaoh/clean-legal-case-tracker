#!/usr/bin/env node

/**
 * Script to ensure only one version of framer-motion is installed
 * Run with: node scripts/fix-framer-motion.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Fixing framer-motion version conflicts...');

// Target version we want to enforce
const TARGET_VERSION = '11.5.2';

// Make sure we're at the project root
const packageJsonPath = path.resolve(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('Error: package.json not found. Run this script from the project root.');
  process.exit(1);
}

// Check what versions are currently installed
console.log('Checking current framer-motion installations:');
try {
  const result = execSync('npm ls framer-motion').toString();
  console.log(result);
} catch (error) {
  // npm ls will exit with non-zero if there are peer dependency issues, but that's okay
  console.log(error.stdout.toString());
}

// Remove any node_modules that might have framer-motion
console.log('Cleaning up any potential duplicates...');
try {
  // Find all instances of framer-motion in node_modules and delete them
  execSync('find node_modules -type d -name "framer-motion" | xargs rm -rf', { stdio: 'inherit' });
} catch (error) {
  console.warn('Warning: Could not clean up node_modules directory:', error.message);
}

// Update package.json to ensure consistent version enforcement
console.log('Updating package.json...');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Ensure direct dependency is correct
packageJson.dependencies['framer-motion'] = TARGET_VERSION;

// Ensure all overrides are consistent
if (!packageJson.overrides) {
  packageJson.overrides = {};
}
packageJson.overrides['framer-motion'] = TARGET_VERSION;

// Add specific overrides for known problematic dependencies
packageJson.overrides['@mui/material'] = { 'framer-motion': TARGET_VERSION };
packageJson.overrides['@mui/system'] = { 'framer-motion': TARGET_VERSION };
packageJson.overrides['react-awesome-reveal'] = { 'framer-motion': TARGET_VERSION };

// Add resolutions for yarn
if (!packageJson.resolutions) {
  packageJson.resolutions = {};
}
packageJson.resolutions['framer-motion'] = TARGET_VERSION;

// Add peerDependencyOverrides if using npm 8+
if (!packageJson.peerDependencyOverrides) {
  packageJson.peerDependencyOverrides = {};
}
packageJson.peerDependencyOverrides['framer-motion'] = TARGET_VERSION;

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('package.json updated successfully.');

// Reinstall everything
console.log('\nReinstalling dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('Error reinstalling dependencies:', error.message);
  process.exit(1);
}

// Verify the fix worked
console.log('\nVerifying framer-motion version:');
try {
  const verifyResult = execSync('npm ls framer-motion').toString();
  console.log(verifyResult);

  // Check if we have only one version
  const versionMatches = verifyResult.match(/framer-motion@/g);
  if (versionMatches && versionMatches.length === 1) {
    console.log(`✅ Success! Only one version of framer-motion (${TARGET_VERSION}) is installed.`);
  } else {
    console.warn('⚠️ Warning: Multiple versions of framer-motion may still be present.');
  }
} catch (error) {
  console.log(error.stdout.toString());
  console.warn('⚠️ Warning: There may still be dependency conflicts.');
}

console.log('\nDone! Please rebuild your project with "npm run build".'); 