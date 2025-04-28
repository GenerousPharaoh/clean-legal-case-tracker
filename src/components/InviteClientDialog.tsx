import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Box, CircularProgress, Alert, Divider, InputAdornment, IconButton, Tooltip, List, ListItem, ListItemText, Chip, Paper } from '@mui/material';
import { Collapse } from './SafeTransitions';
import { useCollaborators } from '../hooks/useCollaborators';
import { ProjectCollaborator, UserRole } from '../types';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { transitions } from '../utils/transitions';

interface InviteClientDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  projectName?: string;
}

/**
 * Dialog component for inviting clients to a project
 */
const InviteClientDialog: React.FC<InviteClientDialogProps> = ({ 
  open, 
  onClose, 
  projectId, 
  projectName 
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [urlCopied, setUrlCopied] = useState(false);

  const { 
    collaborators, 
    loading: collaboratorsLoading, 
    error: collaboratorsError,
    inviteClient,
    refreshCollaborators
  } = useCollaborators({ projectId });

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Basic email validation
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    
    if (emailError) {
      return;
    }
    
    // Send invitation
    const result = await inviteClient(email);
    
    if (result.success) {
      setInviteSent(true);
      setInviteUrl(result.inviteUrl || '');
      setEmail('');
      await refreshCollaborators();
    } else {
      setEmailError(result.error || 'Failed to send invitation');
    }
  };

  // Reset dialog state on close
  const handleClose = () => {
    setEmail('');
    setEmailError('');
    setInviteSent(false);
    setInviteUrl('');
    onClose();
  };

  // Copy the invite URL to clipboard
  const handleCopyUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
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

  // Get color and label for collaborator status
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Chip 
          label="Accepted" 
          size="small" 
          color="success" 
          icon={<CheckCircleOutlineIcon />} 
          sx={{ height: 24 }}
        />;
      case 'pending':
        return <Chip 
          label="Pending" 
          size="small" 
          color="warning" 
          icon={<HourglassEmptyIcon />} 
          sx={{ height: 24 }}
        />;
      default:
        return <Chip 
          label={status} 
          size="small" 
          color="default" 
          sx={{ height: 24 }}
        />;
    }
  };

  // Render dialog
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 3,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <PersonAddIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="div">
              Invite Client
            </Typography>
          </Box>
          <IconButton 
            aria-label="close" 
            onClick={handleClose}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {projectName && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Inviting a client to <strong>{projectName}</strong>. They will be able to upload files to this project only.
            </Typography>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Client Email"
            fullWidth
            type="email"
            value={email}
            onChange={handleEmailChange}
            error={!!emailError}
            helperText={emailError}
            disabled={collaboratorsLoading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!email || !!emailError || collaboratorsLoading}
            sx={{ mb: 2 }}
            startIcon={collaboratorsLoading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
          >
            {collaboratorsLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </form>

        {inviteSent && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 2, 
              backgroundColor: 'success.light', 
              color: 'success.contrastText',
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Invitation sent successfully!
            </Typography>
            
            {inviteUrl && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  You can copy this invitation link to send manually:
                </Typography>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    p: 1,
                    borderRadius: 1,
                    overflowX: 'auto'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mr: 1,
                      fontFamily: 'monospace',
                      flexGrow: 1
                    }}
                  >
                    {inviteUrl}
                  </Typography>
                  
                  <Tooltip title={urlCopied ? "Copied!" : "Copy URL"}>
                    <IconButton 
                      size="small" 
                      onClick={handleCopyUrl}
                      color="inherit"
                      sx={{ backgroundColor: 'rgba(255, 255, 255, 0.3)', ml: 1 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* Collaborators List */}
        <Box sx={{ my: 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer',
              p: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              },
              mb: 1
            }}
            onClick={() => setShowCollaborators(!showCollaborators)}
          >
            <Typography variant="subtitle1" fontWeight={500}>
              Project Collaborators
            </Typography>
            {showCollaborators ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>

          <transitions.Collapse in={showCollaborators}>
            {collaboratorsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Error loading collaborators: {collaboratorsError}
              </Alert>
            )}

            {collaboratorsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : collaborators.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No collaborators for this project yet
              </Typography>
            ) : (
              <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {collaborators.map((collaborator: ProjectCollaborator) => (
                  <ListItem
                    key={collaborator.id}
                    sx={{ 
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                          <Typography variant="body2" component="span" fontWeight={500}>
                            {collaborator.email || collaborator.user_id || 'Unknown'}
                          </Typography>
                          {getStatusChip(collaborator.status)}
                          <Chip 
                            label={collaborator.role} 
                            size="small" 
                            variant="outlined" 
                            color="secondary" 
                            sx={{ height: 24 }} 
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Invited: {formatDate(collaborator.created_at)}
                          {collaborator.accepted_at && ` • Accepted: ${formatDate(collaborator.accepted_at)}`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </transitions.Collapse>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose} 
          color="primary" 
          variant="outlined"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteClientDialog; 