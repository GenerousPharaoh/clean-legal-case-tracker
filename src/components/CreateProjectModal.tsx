import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { useCreateProject } from '../hooks/useCreateProject';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated?: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ 
  open, 
  onClose,
  onProjectCreated 
}) => {
  const [projectName, setProjectName] = useState('');
  const [nameError, setNameError] = useState('');
  const { createProject, loading, error } = useCreateProject();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!projectName.trim()) {
      setNameError('Project name is required');
      return;
    }
    
    // Reset errors
    setNameError('');
    
    // Create the project
    const newProject = await createProject(projectName, {
      onSuccess: () => {
        // Reset form and close modal on success
        setProjectName('');
        if (onProjectCreated) onProjectCreated();
        onClose();
      }
    });
  };
  
  const handleCancel = () => {
    setProjectName('');
    setNameError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : handleCancel}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="project-name"
            label="Project Name"
            type="text"
            fullWidth
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            error={!!nameError}
            helperText={nameError}
            disabled={loading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateProjectModal; 