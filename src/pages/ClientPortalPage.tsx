import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Divider, 
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  CircularProgress,
  Chip,
  AppBar,
  Toolbar,
  useTheme,
  Grid
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { supabase } from '../supabaseClient';
import FileIcon from '../components/FileIcon';
import FileUpload from '../components/FileUpload';
import EmptyState from '../components/EmptyState';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import LaunchIcon from '@mui/icons-material/Launch';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EnhancedTooltip from '../components/EnhancedTooltip';
import { getDownloadUrl } from '../utils/storageUtils';

// Define acceptable file types - same as in the full app
const ACCEPTED_FILE_TYPES = 'image/*,video/*,audio/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * ClientPortalPage - Simplified portal for client collaborators
 * 
 * This page provides a streamlined interface for clients to upload files
 * to a specific project they've been invited to collaborate on.
 */
const ClientPortalPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuthStore();
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load project and files
  useEffect(() => {
    const fetchProjectAndFiles = async () => {
      if (!projectId || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Check if the user has access to this project as a collaborator
        const { data: collaborator, error: collaboratorError } = await supabase
          .from('project_collaborators')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .eq('role', 'client_uploader')
          .single();

        if (collaboratorError || !collaborator) {
          setError('You do not have access to this project');
          setLoading(false);
          return;
        }

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) {
          throw projectError;
        }

        setProject(projectData);

        // Fetch files for the project
        // In a real-world scenario, you might want to paginate or limit this
        const { data: filesData, error: filesError } = await supabase
          .from('files')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (filesError) {
          throw filesError;
        }

        setFiles(filesData || []);
      } catch (err: any) {
        console.error('Error fetching project data:', err);
        setError(err.message || 'An error occurred loading the project');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndFiles();
  }, [projectId, user]);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Format file size to human-readable
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle file download
  const handleDownloadFile = async (file: any) => {
    try {
      const downloadUrl = await getDownloadUrl(file.storage_path);
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  // Filter files to only show those uploaded by the current user
  const userFiles = files.filter(file => file.uploaded_by === user?.id);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        boxShadow: 2,
        background: 'linear-gradient(to right, #1976d2, #2196f3)',
      }}>
        <Toolbar sx={{ minHeight: 56 }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 600,
              fontSize: '1.25rem',
              letterSpacing: '0.5px',
            }}
          >
            Clarity Suite
            <Typography 
              component="span" 
              sx={{ 
                ml: 1, 
                fontSize: '0.7rem', 
                opacity: 0.8,
                backgroundColor: 'rgba(255,255,255,0.2)',
                px: 0.8,
                py: 0.2,
                borderRadius: 1,
              }}
            >
              CLIENT PORTAL
            </Typography>
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 2,
                opacity: 0.9,
                fontWeight: 400,
              }}
            >
              {user?.email}
            </Typography>
            <EnhancedTooltip title="Logout" placement="bottom">
              <IconButton 
                color="inherit" 
                onClick={handleLogout}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </EnhancedTooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
            <Typography color="error" variant="h6">{error}</Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }} 
              onClick={() => navigate('/projects')}
            >
              Back to Projects
            </Button>
          </Paper>
        ) : (
          <>
            {/* Project Header */}
            <Paper 
              elevation={1} 
              sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 2 
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FolderIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
                  {project?.name}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body1" color="text.secondary" paragraph>
                Welcome to the client upload portal. You can upload files to this project and view 
                files you've previously uploaded.
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                  File Upload
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    bgcolor: 'background.default',
                  }}
                >
                  <FileUpload 
                    projectId={projectId || ''} 
                    acceptedFileTypes={ACCEPTED_FILE_TYPES} 
                  />
                </Paper>
              </Box>
            </Paper>

            {/* Your Uploads Section */}
            <Paper 
              elevation={1} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                minHeight: 300,
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
                Your Uploads
                <Chip 
                  label={userFiles.length} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1, height: 24 }} 
                />
              </Typography>
              
              {userFiles.length === 0 ? (
                <EmptyState
                  icon="upload"
                  title="No uploads yet"
                  description="Files you upload will appear here"
                  size="medium"
                  bordered
                />
              ) : (
                <Grid container spacing={2}>
                  {userFiles.map(file => (
                    <Grid item xs={12} sm={6} md={4} key={file.id}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: 2,
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <FileIcon 
                            fileType={file.file_type} 
                            sx={{ fontSize: 34, color: 'primary.main', mr: 1.5 }} 
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 500, 
                                wordBreak: 'break-word',
                                mb: 0.5
                              }}
                            >
                              {file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {formatFileSize(file.size)} • {formatDate(file.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box 
                          sx={{ 
                            mt: 'auto', 
                            pt: 1, 
                            display: 'flex', 
                            justifyContent: 'flex-end',
                            borderTop: '1px solid', 
                            borderColor: 'divider',
                          }}
                        >
                          <EnhancedTooltip title="Download File">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDownloadFile(file)}
                              color="primary"
                            >
                              <FileDownloadIcon fontSize="small" />
                            </IconButton>
                          </EnhancedTooltip>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </>
        )}
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 2, 
          px: 3, 
          mt: 'auto', 
          backgroundColor: theme.palette.grey[100],
          borderTop: '1px solid',
          borderColor: theme.palette.divider,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Clarity Suite Client Portal © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

export default ClientPortalPage; 