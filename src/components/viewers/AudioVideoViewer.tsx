import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, IconButton, Paper, Slider, Typography, Tooltip } from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  LinkSharp as LinkIcon,
} from '@mui/icons-material';
import useAppStore from '../../store';

interface AudioVideoViewerProps {
  url: string;
  contentType: string;
  initialTime?: number;
}

const AudioVideoViewer = ({ url, contentType, initialTime }: AudioVideoViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const playerRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const isVideo = contentType.startsWith('video/');
  
  const linkActivation = useAppStore((state) => state.linkActivation);
  const setLinkActivation = useAppStore((state) => state.setLinkActivation);

  // Initialize player with correct time
  useEffect(() => {
    if (playerRef.current && initialTime && initialTime !== currentTime) {
      playerRef.current.currentTime = initialTime;
      setCurrentTime(initialTime);
    }
  }, [initialTime, playerRef.current]);

  // Handle media load
  const handleOnLoadedData = () => {
    setLoading(false);
    setDuration(playerRef.current?.duration || 0);
    
    // Set initial time if specified
    if (initialTime && playerRef.current) {
      playerRef.current.currentTime = initialTime;
    }
  };

  // Handle media load error
  const handleError = () => {
    setError('Failed to load media. The file may be corrupted or not supported by your browser.');
    setLoading(false);
  };

  // Handle play/pause
  const togglePlay = () => {
    if (playerRef.current) {
      if (playing) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (playerRef.current) {
      setCurrentTime(playerRef.current.currentTime);
    }
  };

  // Handle seek
  const handleSeek = (_: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : newValue[0];
    if (playerRef.current) {
      playerRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Update link activation if active
      if (linkActivation) {
        setLinkActivation({
          ...linkActivation,
          timestamp: newTime,
        });
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    const newVolume = typeof newValue === 'number' ? newValue : newValue[0];
    setVolume(newVolume);
    
    if (playerRef.current) {
      playerRef.current.volume = newVolume;
    }
    
    if (newVolume === 0) {
      setMuted(true);
    } else if (muted) {
      setMuted(false);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (playerRef.current) {
      playerRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Create a timestamp link
  const createTimestampLink = () => {
    if (!linkActivation) return;
    
    setLinkActivation({
      ...linkActivation,
      timestamp: currentTime,
    });
    
    // Provide feedback to user
    alert(`Timestamp link created at ${formatTime(currentTime)}`);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Media Container */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          bgcolor: isVideo ? 'black' : 'background.default',
          minHeight: isVideo ? 0 : 'auto',
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2, color: isVideo ? 'white' : 'inherit' }}>
              Loading {isVideo ? 'video' : 'audio'}...
            </Typography>
          </Box>
        )}

        {error && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              p: 3,
              zIndex: 1,
            }}
          >
            <Typography color="error" variant="body1" gutterBottom>
              {error}
            </Typography>
          </Box>
        )}

        {isVideo ? (
          <video
            ref={playerRef as React.RefObject<HTMLVideoElement>}
            src={url}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              display: loading ? 'none' : 'block',
            }}
            onLoadedData={handleOnLoadedData}
            onTimeUpdate={handleTimeUpdate}
            onError={handleError}
            onEnded={() => setPlaying(false)}
            playsInline
            muted={muted}
          />
        ) : (
          <audio
            ref={playerRef as React.RefObject<HTMLAudioElement>}
            src={url}
            style={{ width: '100%', display: loading ? 'none' : 'block' }}
            onLoadedData={handleOnLoadedData}
            onTimeUpdate={handleTimeUpdate}
            onError={handleError}
            onEnded={() => setPlaying(false)}
            muted={muted}
          />
        )}

        {/* Overlay play button for video (visible only when paused) */}
        {isVideo && !loading && !playing && (
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            }}
            onClick={togglePlay}
          >
            <PlayIcon fontSize="large" />
          </IconButton>
        )}
      </Box>

      {/* Controls */}
      <Paper
        sx={{
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          borderTop: 1,
          borderColor: 'divider',
        }}
        elevation={0}
      >
        {/* Time Slider */}
        <Box sx={{ px: 2, width: '100%' }}>
          <Slider
            value={currentTime}
            min={0}
            max={duration || 100}
            onChange={handleSeek}
            disabled={loading || error !== null}
            sx={{ mt: 1 }}
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              mt: -1,
            }}
          >
            <Typography variant="caption">{formatTime(currentTime)}</Typography>
            <Typography variant="caption">{formatTime(duration)}</Typography>
          </Box>
        </Box>

        {/* Action Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Play/Pause */}
            <IconButton
              onClick={togglePlay}
              disabled={loading || error !== null}
              size="small"
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </IconButton>

            {/* Volume */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, width: 140 }}>
              <IconButton onClick={toggleMute} size="small" disabled={loading}>
                {muted ? <MuteIcon /> : <VolumeIcon />}
              </IconButton>
              <Slider
                value={muted ? 0 : volume}
                min={0}
                max={1}
                step={0.01}
                onChange={handleVolumeChange}
                sx={{ ml: 1, mr: 1 }}
                disabled={loading}
                size="small"
              />
            </Box>
          </Box>

          {/* Timestamp Link */}
          <Tooltip title="Copy link to current timestamp">
            <IconButton
              onClick={createTimestampLink}
              disabled={loading || error !== null}
              size="small"
            >
              <LinkIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    </Box>
  );
};

export default AudioVideoViewer; 