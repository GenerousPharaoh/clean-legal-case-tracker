/**
 * Verifies critical dependencies are properly installed
 * and fixes common issues that cause build failures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying dependencies...');

// Constants
const projectRoot = path.resolve(__dirname, '..');
const nodeModulesDir = path.join(projectRoot, 'node_modules');

// Critical dependencies to check
const criticalDependencies = [
  '@mui/icons-material',
  '@mui/material',
  'react',
  'react-dom',
  'tinymce',
  'vite'
];

// Check dependencies
function checkDependencies() {
  const missingDeps = [];
  
  for (const dep of criticalDependencies) {
    const depDir = path.join(nodeModulesDir, dep);
    if (!fs.existsSync(depDir)) {
      missingDeps.push(dep);
    }
  }
  
  return missingDeps;
}

// Fix the path case of AudioTrack component
function fixAudioTrackPath() {
  // Check all files that might reference AudioTrack
  const potentialFiles = [
    path.join(projectRoot, 'src/layouts/panels/CenterPanel.tsx'),
    // Add more files if needed
  ];
  
  for (const filePath of potentialFiles) {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check for incorrect import
      if (content.includes('from \'@mui/icons-material/Audiotrack\'')) {
        console.log(`⚠️ Found incorrect AudioTrack import in ${path.basename(filePath)}`);
        
        // Fix the import
        content = content.replace(
          /from ['"]@mui\/icons-material\/Audiotrack['"]/g, 
          'from \'@mui/icons-material/AudioTrack\''
        );
        
        // Save the fixed file
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed AudioTrack import in ${path.basename(filePath)}`);
      }
    }
  }
}

// Add MUI icons to externals in vite.config to avoid bundling issues
function fixViteConfig() {
  const viteConfigPaths = [
    path.join(projectRoot, 'vite.config.ts'),
    path.join(projectRoot, 'vite.config.js')
  ];
  
  for (const configPath of viteConfigPaths) {
    if (fs.existsSync(configPath)) {
      let content = fs.readFileSync(configPath, 'utf8');
      
      // Check if external is already configured
      if (!content.includes('external:') && content.includes('rollupOptions')) {
        console.log(`⚠️ Adding external modules configuration to ${path.basename(configPath)}`);
        
        // Add external configuration to rollupOptions
        content = content.replace(
          /rollupOptions:\s*{/g,
          `rollupOptions: {\n      external: [
        '@mui/icons-material/AudioTrack',
        '@mui/icons-material/Audiotrack'
      ],`
        );
        
        // Save the fixed config
        fs.writeFileSync(configPath, content);
        console.log(`✅ Updated ${path.basename(configPath)} with external modules`);
      }
    }
  }
}

// Try to find the right MUI icons directory
function checkMuiIconsDirectory() {
  const muiIconsDir = path.join(nodeModulesDir, '@mui/icons-material');
  
  if (!fs.existsSync(muiIconsDir)) {
    console.log('⚠️ @mui/icons-material directory not found');
    return false;
  }
  
  // Check for AudioTrack.js file
  const audioTrackFile = path.join(muiIconsDir, 'AudioTrack.js');
  const audiotrackFile = path.join(muiIconsDir, 'Audiotrack.js');
  
  if (fs.existsSync(audioTrackFile)) {
    console.log('✅ AudioTrack.js found with correct capitalization');
    return true;
  } else if (fs.existsSync(audiotrackFile)) {
    console.log('⚠️ Found Audiotrack.js with incorrect capitalization');
    
    // Create a symlink or copy with the correct name
    try {
      fs.copyFileSync(audiotrackFile, audioTrackFile);
      console.log('✅ Created AudioTrack.js from Audiotrack.js');
      return true;
    } catch (err) {
      console.error('❌ Failed to create AudioTrack.js:', err.message);
      return false;
    }
  } else {
    console.log('❌ Neither AudioTrack.js nor Audiotrack.js found');
    return false;
  }
}

// Main function
async function main() {
  try {
    // Check dependencies
    const missingDeps = checkDependencies();
    
    if (missingDeps.length > 0) {
      console.log(`⚠️ Missing dependencies: ${missingDeps.join(', ')}`);
      console.log('Attempting to reinstall missing dependencies...');
      
      try {
        execSync(`npm install ${missingDeps.join(' ')}`, {
          cwd: projectRoot,
          stdio: 'inherit'
        });
        console.log('✅ Dependencies reinstalled');
      } catch (err) {
        console.error('❌ Failed to reinstall dependencies:', err.message);
      }
    } else {
      console.log('✅ All critical dependencies are installed');
    }
    
    // Fix AudioTrack path in source files
    fixAudioTrackPath();
    
    // Check MUI icons directory
    checkMuiIconsDirectory();
    
    // Fix Vite config
    fixViteConfig();
    
    console.log('✅ Dependency verification completed');
  } catch (err) {
    console.error('❌ Error during dependency verification:', err);
  }
}

main();
