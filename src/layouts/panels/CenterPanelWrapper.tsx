import { Box, Typography } from '@mui/material';
import WelcomePlaceholder from '../../components/WelcomePlaceholder';
import CenterPanel from './CenterPanel';
import { usePanelState } from '../../hooks/usePanelState';
import useAppStore from '../../store';

export default function CenterPanelWrapper() {
  const { selectedNoteId } = usePanelState();
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  
  // If no project is selected, show the main welcome screen
  if (!selectedProjectId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Select a project to get started.
        </Typography>
      </Box>
    );
  }
  
  // If a project is selected but no note is loaded, show a simpler message
  if (!selectedNoteId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Loading project note...
        </Typography>
      </Box>
    );
  }
  
  // Otherwise, show the full editor
  return <CenterPanel />;
} 