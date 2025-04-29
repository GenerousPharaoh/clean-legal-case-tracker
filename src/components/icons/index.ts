/**
 * Icons module that provides fallbacks for problematic MUI icons
 */

// Import the fallback icons
import FallbackAudioTrack from './FallbackAudioTrack';

// Try to import the real AudioTrack icon, fall back to our implementation if it fails
let AudioTrackIcon;
try {
  // Try to dynamically import the actual MUI icon (using dynamic import instead of require)
  import('@mui/icons-material/AudioTrack').then(module => {
    AudioTrackIcon = module.default;
  }).catch(() => {
    // If import fails, use our fallback
    console.warn('Could not load @mui/icons-material/AudioTrack, using fallback');
    AudioTrackIcon = FallbackAudioTrack;
  });
  
  // Set fallback initially while import is pending
  AudioTrackIcon = FallbackAudioTrack;
} catch (error) {
  // If import fails, use our fallback
  console.warn('Could not load @mui/icons-material/AudioTrack, using fallback');
  AudioTrackIcon = FallbackAudioTrack;
}

// Export the icons (either real or fallback)
export { AudioTrackIcon };

// You can add more fallback icons as needed following the same pattern
