import { Box, Typography } from '@mui/material';
import WelcomePlaceholder from '../../components/WelcomePlaceholder';
import RightPanel from './RightPanel';
import { usePanelState } from '../../hooks/usePanelState';

export default function RightPanelWrapper() {
  const { selectedFileId } = usePanelState();
  if (!selectedFileId) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
        <Typography variant="h5" color="text.primary" gutterBottom>
          No File Selected
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Click a file in the left panel to preview.
        </Typography>
      </Box>
    );
  }
  return <RightPanel />;
} 