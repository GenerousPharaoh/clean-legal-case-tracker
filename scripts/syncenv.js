/**
 * This script syncs environment variables between .env.local and .env
 * It's used during build to ensure all environment variables are available
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const envLocalPath = path.join(projectRoot, '.env.local');
const envPath = path.join(projectRoot, '.env');

console.log('Syncing environment variables from .env.local to .env');

try {
  // Check if .env.local exists
  if (fs.existsSync(envLocalPath)) {
    const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
    
    // Create or update .env file
    fs.writeFileSync(envPath, envLocalContent);
    console.log('Environment variables synced successfully');
  } else {
    console.log('No .env.local file found. Creating empty .env file');
    // Create empty .env file to avoid errors
    fs.writeFileSync(envPath, '# Environment Variables\n');
  }
} catch (error) {
  console.error('Error syncing environment variables:', error);
  // Create a minimal .env file to avoid build failures
  try {
    fs.writeFileSync(envPath, '# Emergency fallback environment file\nROLLUP_NATIVE_DISABLE=1\n');
    console.log('Created emergency fallback .env file');
  } catch (e) {
    console.error('Could not create fallback .env file:', e);
  }
}
