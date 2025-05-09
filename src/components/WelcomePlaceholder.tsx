import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Container, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { GavelRounded, FolderOpenOutlined } from '@mui/icons-material';
import useAppStore from '../store';
import supabase from '../services/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface WelcomePlaceholderProps {
  title?: string;
  subtitle?: string;
}

const WelcomePlaceholder: React.FC<WelcomePlaceholderProps> = ({ 
  title = "Legal Case Tracker",
  subtitle = "Manage all your legal cases, documents, and notes in one secure place. Select a project to begin or create a new one."
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Get projects from store
  const setProjects = useAppStore(state => state.setProjects);
  const setSelectedProject = useAppStore(state => state.setSelectedProject);
  
  // Fetch projects using React Query
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching projects:', error);
        throw new Error(error.message);
      }
      
      // Update store with projects
      setProjects(data || []);
      return data || [];
    }
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectName: string) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name: projectName }])
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate projects query to refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Navigate to the newly created project
      if (data?.id) {
        setSelectedProject(data.id);
        navigate(`/projects/${data.id}`);
      }
      
      // Close dialog and reset form
      setOpenDialog(false);
      setNewProjectName('');
    }
  });
  
  // Handle project selection
  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    navigate(`/projects/${projectId}`);
  };
  
  // Handle dialog open/close
  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);
  
  // Handle create project
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProjectMutation.mutate(newProjectName);
    }
  };
  
  // Get first project ID for "Get Started" button
  const firstProjectId = projects?.[0]?.id;
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(25,36,54,0.95) 0%, rgba(10,17,32,0.98) 100%)' 
            : 'linear-gradient(135deg, rgba(240,249,255,0.95) 0%, rgba(214,237,255,0.98) 100%)',
        overflow: 'auto',
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            mb: 6,
          }}
        >
          {/* App logo */}
          <Box
            sx={{
              mb: 5,
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              width: 130,
              height: 130,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <GavelRounded sx={{ fontSize: 70 }} />
          </Box>
          
          {/* Welcome text */}
          <Typography 
            variant="h2" 
            fontWeight="bold"
            sx={{ 
              mb: 3,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
            }}
          >
            {title}
          </Typography>
          
          {/* Instructions */}
          <Typography 
            variant="h5" 
            color="text.secondary" 
            sx={{ 
              mb: 8,
              maxWidth: 700,
              mx: 'auto'
            }}
          >
            {subtitle}
          </Typography>
          
          {/* Get Started button */}
          {projects.length > 0 && (
            <Button
              variant="contained"
              size="large"
              data-test="welcome-get-started"
              onClick={() => {
                if (firstProjectId) {
                  navigate(`/projects/${firstProjectId}`);
                  setSelectedProject(firstProjectId);
                }
              }}
              sx={{ mb: 6, px: 4, py: 1.5 }}
            >
              Get Started
            </Button>
          )}
        </Box>
        
        {/* Project list */}
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: 'background.paper',
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 10px 40px rgba(0,0,0,0.3)' 
              : '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            sx={{ mb: 3 }}
          >
            Your Projects
          </Typography>
          
          {projects.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant="outlined"
                  size="large"
                  startIcon={<FolderOpenOutlined />}
                  onClick={() => handleSelectProject(project.id)}
                  sx={{ 
                    px: 3, 
                    py: 1.5, 
                    borderRadius: 2,
                    justifyContent: 'flex-start',
                    minWidth: '200px',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  {project.name}
                </Button>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              No projects found. Create your first project to get started.
            </Typography>
          )}
          
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={handleOpenDialog}
            sx={{ 
              mt: 2,
              px: 4,
              py: 1.5,
              borderRadius: 2,
              boxShadow: (theme) => theme.palette.mode === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.4)' 
                : '0 4px 12px rgba(3,102,214,0.3)',
            }}
          >
            Create New Project
          </Button>
        </Paper>
        
        {/* New Project Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Name"
              type="text"
              fullWidth
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button 
              onClick={handleCreateProject} 
              variant="contained" 
              color="primary"
              disabled={!newProjectName.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default WelcomePlaceholder; 