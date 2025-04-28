/**
 * Icons module that provides fallbacks for problematic MUI icons
 */

// Import the fallback icons
import FallbackAudioTrack from './FallbackAudioTrack';

// Try to import the real AudioTrack icon, fall back to our implementation if it fails
let AudioTrackIcon;
try {
  // Try to dynamically import the actual MUI icon
  AudioTrackIcon = require('@mui/icons-material/AudioTrack').default;
} catch (error) {
  // If import fails, use our fallback
  console.warn('Could not load @mui/icons-material/AudioTrack, using fallback');
  AudioTrackIcon = FallbackAudioTrack;
}

// Export the icons (either real or fallback)
export { AudioTrackIcon };

// You can add more fallback icons as needed following the same pattern
