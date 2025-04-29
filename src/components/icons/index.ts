/**
 * Icons module that provides fallbacks for problematic MUI icons
 */

// Import the fallback icons
import FallbackAudioTrack from './FallbackAudioTrack';

// Use the fallback directly instead of dynamic import which causes Vite build issues
const AudioTrackIcon = FallbackAudioTrack;

// Export the icons (either real or fallback)
export { AudioTrackIcon };

// You can add more fallback icons as needed following the same pattern
