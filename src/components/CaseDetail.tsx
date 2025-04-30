import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Button,
  Chip,
  Divider,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DescriptionIcon from '@mui/icons-material/Description';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { supabase } from '../supabaseClient';

// Same Case interface as in CaseLibrary
interface Case {
  id: string;
  name: string;
  description?: string;
  created_by: string; // Primary field matching DB schema
  owner_id?: string; // Keep for backward compatibility 
  project_id?: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  is_archived?: boolean;
  tags?: string[];
}

// Basic document interface
interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  case_id: string;
}

// Tab panel interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`case-tabpanel-${index}`}
      aria-labelledby={`case-tab-${index}`}
      {...other}
      style={{ padding: '20px 0' }}
    >
      {value === index && children}
    </div>
  );
};

// Edit form component
const CaseEditForm: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Case>) => Promise<void>;
  caseData: Case | null;
}> = ({ open, onClose, onSave, caseData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (caseData) {
      setName(caseData.name || '');
      setDescription(caseData.description || '');
      setStatus(caseData.status || 'active');
    }
  }, [caseData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Case name is required');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name,
        description,
        status
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Case</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            autoFocus
            margin="dense"
            label="Case Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Delete confirmation dialog
const DeleteConfirmDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}> = ({ open, onClose, onConfirm, isDeleting }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Case</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete this case? This action cannot be undone, and all associated data will be lost.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained"
          disabled={isDeleting}
        >
          {isDeleting ? <CircularProgress size={24} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main CaseDetail component
const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  
  // State management
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch case data
  useEffect(() => {
    const fetchCaseData = async () => {
      if (!caseId) return;
      
      setLoading(true);
      try {
        // Fetch case details
        const { data: caseData, error: caseError } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .single();
        
        if (caseError) throw caseError;
        
        if (caseData) {
          setCaseData(caseData as unknown as Case);
        } else {
          setError('Case not found');
        }
        
        // Fetch case documents (if the table exists)
        try {
          const { data: docsData, error: docsError } = await supabase
            .from('documents')
            .select('*')
            .eq('case_id', caseId)
            .order('created_at', { ascending: false });
          
          if (!docsError && docsData) {
            setDocuments(docsData as unknown as Document[]);
          }
        } catch (err) {
          console.warn('Error fetching documents or documents table may not exist:', err);
          // Don't set error for documents - they're optional
        }
      } catch (err: any) {
        console.error('Error fetching case:', err);
        setError(err.message || 'Error loading case details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCaseData();
  }, [caseId]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'closed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Update case
  const handleUpdateCase = async (updatedData: Partial<Case>) => {
    if (!caseId) return;
    
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);
      
      if (error) throw error;
      
      // Update local state
      if (caseData) {
        setCaseData({
          ...caseData,
          ...updatedData,
          updated_at: new Date().toISOString()
        });
      }
      
      setNotification({
        open: true,
        message: 'Case updated successfully',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Error updating case:', err);
      setNotification({
        open: true,
        message: err.message || 'Failed to update case',
        severity: 'error'
      });
      throw err;
    }
  };

  // Toggle archive status
  const handleToggleArchive = async () => {
    if (!caseData) return;
    
    try {
      const newStatus = !caseData.is_archived;
      
      const { error } = await supabase
        .from('cases')
        .update({
          is_archived: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);
      
      if (error) throw error;
      
      // Update local state
      setCaseData({
        ...caseData,
        is_archived: newStatus,
        updated_at: new Date().toISOString()
      });
      
      setNotification({
        open: true,
        message: newStatus ? 'Case archived' : 'Case unarchived',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Error toggling archive status:', err);
      setNotification({
        open: true,
        message: err.message || 'Failed to update case',
        severity: 'error'
      });
    }
  };

  // Delete case
  const handleDeleteCase = async () => {
    if (!caseId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);
      
      if (error) throw error;
      
      setNotification({
        open: true,
        message: 'Case deleted successfully',
        severity: 'success'
      });
      
      // Close dialog and navigate back
      setDeleteDialogOpen(false);
      navigate('/cases');
    } catch (err: any) {
      console.error('Error deleting case:', err);
      setNotification({
        open: true,
        message: err.message || 'Failed to delete case',
        severity: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/cases')}
        >
          Back to Cases
        </Button>
      </Box>
    );
  }

  // Render case not found
  if (!caseData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Case Not Found</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The case you're looking for doesn't exist or has been deleted.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/cases')}
        >
          Back to Cases
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header with back button and actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton 
          onClick={() => navigate('/cases')} 
          sx={{ mr: 2 }}
          edge="start"
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Typography variant="h4" sx={{ flex: 1 }}>
          {caseData.name}
          {caseData.is_archived && (
            <Chip 
              label="Archived" 
              size="small" 
              color="default" 
              sx={{ ml: 2, verticalAlign: 'middle' }} 
            />
          )}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<EditIcon />}
            variant="outlined"
            onClick={() => setEditDialogOpen(true)}
          >
            Edit
          </Button>
          
          <Button
            startIcon={caseData.is_archived ? <UnarchiveIcon /> : <ArchiveIcon />}
            variant="outlined"
            color="warning"
            onClick={handleToggleArchive}
          >
            {caseData.is_archived ? 'Unarchive' : 'Archive'}
          </Button>
          
          <Button
            startIcon={<DeleteIcon />}
            variant="outlined"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>
      
      {/* Case metadata */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip 
              label={caseData.status || 'Active'} 
              color={getStatusColor(caseData.status) as any}
              sx={{ mt: 1 }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography variant="body1">{formatDate(caseData.created_at)}</Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
            <Typography variant="body1">
              {caseData.updated_at ? formatDate(caseData.updated_at) : 'Never'}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {caseData.description || 'No description provided'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs for different sections */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="case tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Documents" id="case-tab-0" aria-controls="case-tabpanel-0" />
          <Tab label="Notes" id="case-tab-1" aria-controls="case-tabpanel-1" />
          <Tab label="Timeline" id="case-tab-2" aria-controls="case-tabpanel-2" />
        </Tabs>
        
        {/* Documents tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Case Documents</Typography>
            <Button 
              variant="contained" 
              startIcon={<NoteAddIcon />}
              onClick={() => {/* TODO: Implement document upload */}}
            >
              Upload Document
            </Button>
          </Box>
          
          {documents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6">No Documents</Typography>
              <Typography variant="body2" color="text.secondary">
                Upload documents to this case to get started
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {documents.map((doc) => (
                <Grid item xs={12} md={6} key={doc.id}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      alignItems: 'center',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => {/* TODO: Open document */}}
                  >
                    <DescriptionIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{doc.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatFileSize(doc.size)} • {new Date(doc.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        {/* Notes tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Case Notes</Typography>
            <Button 
              variant="contained" 
              startIcon={<NoteAddIcon />}
              onClick={() => {/* TODO: Implement note creation */}}
            >
              Add Note
            </Button>
          </Box>
          
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6">Notes Feature Coming Soon</Typography>
            <Typography variant="body2" color="text.secondary">
              This feature is currently under development
            </Typography>
          </Box>
        </TabPanel>
        
        {/* Timeline tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 3 }}>Case Timeline</Typography>
          
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6">Timeline Feature Coming Soon</Typography>
            <Typography variant="body2" color="text.secondary">
              This feature is currently under development
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Edit dialog */}
      <CaseEditForm
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleUpdateCase}
        caseData={caseData}
      />
      
      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteCase}
        isDeleting={isDeleting}
      />
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Helper function for file size formatting
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

export default CaseDetail; 