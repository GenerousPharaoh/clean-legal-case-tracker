import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  TextField,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Alert,
  Snackbar,
  CardHeader,
  Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import ErrorBoundary from './ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

// Define Case interface
interface Case {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  is_archived?: boolean;
  tags?: string[];
}

// Component for creating/editing a case
const CaseForm: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (caseData: Partial<Case>) => Promise<void>;
  editCase?: Case;
}> = ({ open, onClose, onSubmit, editCase }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when editing
  useEffect(() => {
    if (editCase) {
      setName(editCase.name || '');
      setDescription(editCase.description || '');
      setStatus(editCase.status || 'active');
    } else {
      // Reset form for new case
      setName('');
      setDescription('');
      setStatus('active');
    }
  }, [editCase, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Case name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name,
        description,
        status,
        id: editCase?.id
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editCase ? 'Edit Case' : 'Create New Case'}</DialogTitle>
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
            {loading ? <CircularProgress size={24} /> : (editCase ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Main CaseLibrary component
const CaseLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // All state declarations need to be at the top level before any conditionals
  // States for case data and UI
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  
  // States for CRUD operations
  const [formOpen, setFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | undefined>(undefined);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Robust error handler for the component
  const handleError = useCallback((error: any, source: string) => {
    console.error(`[CaseLibrary] Error in ${source}:`, error);
    if (error instanceof Error) {
      setError(`${error.name}: ${error.message}`);
    } else if (typeof error === 'string') {
      setError(error);
    } else {
      setError('An unknown error occurred. Please try again.');
    }
  }, []);

  // Apply filters to cases - memoized to avoid recreation on each render
  const applyFilters = React.useCallback(
    (caseList: Case[] | null | undefined, search: string, status: string) => {
      // Enhanced debug logging
      console.log('[CaseLibrary] applyFilters called with:', 
                 `caseList: ${caseList ? `array of ${caseList.length}` : 'null/undefined'}`, 
                 `search: "${search}"`, 
                 `status: "${status}"`);
      
      // Extra defensive check
      if (!caseList || !Array.isArray(caseList)) {
        console.warn('[CaseLibrary] Invalid cases list received in applyFilters, using empty array');
        setFilteredCases([]);
        return;
      }
      
      let result = [...caseList];
      
      // Apply search filter with extra safety
      if (search && search.trim() !== '') {
        try {
          const searchLower = search.toLowerCase();
          result = result.filter(item => {
            if (!item) return false;
            
            const name = item.name || '';
            const description = item.description || '';
            
            return (
              (typeof name === 'string' && name.toLowerCase().includes(searchLower)) ||
              (typeof description === 'string' && description.toLowerCase().includes(searchLower))
            );
          });
        } catch (err) {
          console.error('[CaseLibrary] Error filtering by search term:', err);
          // Result remains unchanged on error
        }
      }
      
      // Apply status filter with extra safety
      if (status && status !== 'all') {
        try {
          result = result.filter(item => item && item.status === status);
        } catch (err) {
          console.error('[CaseLibrary] Error filtering by status:', err);
          // Result remains unchanged on error
        }
      }
      
      // Set filtered cases with a defensive check
      setFilteredCases(Array.isArray(result) ? result : []);
    },
    [] // No dependencies because this function only operates on the parameters it receives
  );

  // Handle search and filter changes
  useEffect(() => {
    if (!cases) {
      setFilteredCases([]);
      return;
    }
    
    // Add a check here to make sure cases exist before trying to filter
    if (cases && Array.isArray(cases)) {
      applyFilters(cases, searchTerm || '', statusFilter || 'all');
    } else {
      setFilteredCases([]);
    }
  }, [searchTerm, statusFilter, cases, applyFilters]);

  // Fetch cases from Supabase - memoized to avoid recreation on each render
  const fetchCases = React.useCallback(async () => {
    try {
      console.log('[CaseLibrary] Fetching cases from Supabase');
      setLoading(true);
      setError(null);
      
      if (!user || !user.id) {
        console.error('[CaseLibrary] No user found when fetching cases');
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Only get non-archived cases unless showArchived is true
      if (!showArchived) {
        query = query.eq('is_archived', false);
      }
      
      console.log('Executing Supabase query');
      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Got response from Supabase:', data ? `${data.length} cases` : 'no data');
      
      if (data && Array.isArray(data)) {
        // Properly cast the Supabase data with type assertion
        const typedCases = data as unknown as Case[];
        setCases(typedCases);
        applyFilters(typedCases, searchTerm, statusFilter);
      } else {
        console.log('No data or invalid data returned from Supabase');
        setCases([]);
        setFilteredCases([]);
      }
    } catch (err: any) {
      console.error('Error fetching cases:', err);
      handleError(err, 'fetchCases');
      setCases([]);
      setFilteredCases([]);
    } finally {
      setLoading(false);
    }
  }, [user, showArchived, searchTerm, statusFilter, handleError]);
  
  // Initial data fetch
  useEffect(() => {
    if (user) {
      console.log('Fetching cases for user:', user.id);
      fetchCases();
    }
  }, [showArchived, user, fetchCases]);
  
  // Create a new case
  const createCase = async (caseData: Partial<Case>) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to create a case');
      }
      
      const { data, error } = await supabase
        .from('cases')
        .insert([
          {
            name: caseData.name,
            description: caseData.description,
            status: caseData.status,
            owner_id: user.id,
            is_archived: false
          }
        ])
        .select();
      
      if (error) throw error;
      
      setNotification({
        open: true,
        message: 'Case created successfully',
        severity: 'success'
      });
      
      fetchCases();
    } catch (err: any) {
      console.error('Error creating case:', err);
      handleError(err, 'createCase');
      throw new Error(err.message || 'Failed to create case');
    }
  };
  
  // Update an existing case
  const updateCase = async (caseData: Partial<Case>) => {
    if (!caseData.id) return;
    
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          name: caseData.name,
          description: caseData.description,
          status: caseData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseData.id);
      
      if (error) throw error;
      
      setNotification({
        open: true,
        message: 'Case updated successfully',
        severity: 'success'
      });
      
      fetchCases();
    } catch (err: any) {
      console.error('Error updating case:', err);
      handleError(err, 'updateCase');
      throw new Error(err.message || 'Failed to update case');
    }
  };
  
  // Archive/unarchive a case
  const toggleArchiveCase = async (caseId: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          is_archived: !isArchived,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);
      
      if (error) throw error;
      
      setNotification({
        open: true,
        message: isArchived ? 'Case unarchived' : 'Case archived',
        severity: 'success'
      });
      
      fetchCases();
    } catch (err: any) {
      console.error('Error toggling archive status:', err);
      handleError(err, 'toggleArchiveCase');
      setNotification({
        open: true,
        message: 'Failed to update case status',
        severity: 'error'
      });
    }
  };
  
  // Open case details
  const openCase = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };
  
  // Format date string with error handling
  const formatDate = useCallback((dateString: string) => {
    try {
      if (!dateString) return 'Unknown date';
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('[CaseLibrary] Invalid date format:', dateString);
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('[CaseLibrary] Error formatting date:', err);
      return 'Error with date';
    }
  }, []);
  
  // Handle form submission
  const handleCaseSubmit = async (caseData: Partial<Case>) => {
    if (caseData.id) {
      await updateCase(caseData);
    } else {
      await createCase(caseData);
    }
    setEditingCase(undefined);
  };
  
  // Get status chip color
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
  
  // Don't render anything if still checking authentication or user is not authenticated
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    return null; // Return null while redirecting to login
  }
  
  return (
    <Box sx={{ p: 4 }}>
      {/* Header section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography variant="h4">Case Library</Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingCase(undefined);
            setFormOpen(true);
          }}
        >
          Create New Case
        </Button>
      </Box>
      
      {/* Search and filter section */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 4 
      }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search cases..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ flexGrow: 1 }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined"
          onClick={() => setShowArchived(!showArchived)}
          startIcon={showArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
        >
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {/* Loading state */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredCases.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <FolderOpenIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6">No cases found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create a new case to get started'}
          </Typography>
          
          {(searchTerm || statusFilter !== 'all') && (
            <Button 
              variant="outlined" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredCases.map((caseItem) => (
            <Grid item xs={12} sm={6} md={4} key={caseItem.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  opacity: caseItem.is_archived ? 0.7 : 1
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: getStatusColor(caseItem.status) }}>
                      <PersonIcon />
                    </Avatar>
                  }
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {caseItem.name}
                      {caseItem.is_archived && (
                        <Chip size="small" label="Archived" color="default" />
                      )}
                    </Box>
                  }
                  subheader={`Created: ${formatDate(caseItem.created_at)}`}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={caseItem.status || 'Active'} 
                      size="small" 
                      color={getStatusColor(caseItem.status) as any}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 2,
                    minHeight: '3em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {caseItem.description || 'No description provided'}
                  </Typography>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button 
                    size="small" 
                    onClick={() => openCase(caseItem.id)}
                  >
                    Open
                  </Button>
                  
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small"
                        onClick={() => {
                          setEditingCase(caseItem);
                          setFormOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={caseItem.is_archived ? 'Unarchive' : 'Archive'}>
                      <IconButton 
                        size="small"
                        onClick={() => toggleArchiveCase(caseItem.id, !!caseItem.is_archived)}
                      >
                        {caseItem.is_archived ? 
                          <UnarchiveIcon fontSize="small" /> : 
                          <ArchiveIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Case form dialog */}
      <CaseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCaseSubmit}
        editCase={editingCase}
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

// Wrap the CaseLibrary component with ErrorBoundary
const CaseLibraryWithErrorBoundary: React.FC = () => {
  return (
    <ErrorBoundary>
      <CaseLibrary />
    </ErrorBoundary>
  );
};

export default CaseLibraryWithErrorBoundary;
