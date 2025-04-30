import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Grid, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useNavigate } from 'react-router-dom';
import { useAuthImproved } from '../hooks/useAuthImproved';
import { caseService } from '../services/database';
import CaseCard from './CaseCard';
import CaseForm from './CaseForm';
import type { Case } from '../types/database';
import ErrorBoundary from './ErrorBoundary';

/**
 * Improved CaseLibrary component with proper error handling,
 * optimized performance, and better UX
 */
const CaseLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthImproved();
  
  // State management with proper typing
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  
  // Form and dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch cases when needed
  useEffect(() => {
    if (user) {
      fetchCases();
    }
  }, [user, showArchived]);

  // Apply filters to cases when data or filters change
  useEffect(() => {
    if (!cases.length) {
      setFilteredCases([]);
      return;
    }
    
    let result = [...cases];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item => {
        const name = item.name || '';
        const description = item.description || '';
        
        return (
          name.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    setFilteredCases(result);
  }, [cases, searchTerm, statusFilter]);

  // Fetch cases with proper error handling
  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedCases = await caseService.getAll(showArchived);
      setCases(fetchedCases);
      
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load cases';
      
      console.error('Error fetching cases:', err);
      setError(errorMessage);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new case
  const createCase = async (caseData: Partial<Case>) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to create a case');
      }
      
      const newCase = await caseService.create({
        name: caseData.name || 'Untitled Case',
        description: caseData.description,
        status: caseData.status || 'active',
        created_by: user.id,
        is_archived: false
      });
      
      if (!newCase) {
        throw new Error('Failed to create case');
      }
      
      showNotification('Case created successfully', 'success');
      
      // Refresh the case list
      fetchCases();
      
      return newCase;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to create case';
      
      console.error('Error creating case:', err);
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
  
  // Update existing case
  const updateCase = async (caseData: Partial<Case>) => {
    if (!caseData.id) return null;
    
    try {
      const updatedCase = await caseService.update(caseData.id, {
        name: caseData.name,
        description: caseData.description,
        status: caseData.status
      });
      
      if (!updatedCase) {
        throw new Error('Failed to update case');
      }
      
      showNotification('Case updated successfully', 'success');
      
      // Refresh the case list
      fetchCases();
      
      return updatedCase;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update case';
      
      console.error('Error updating case:', err);
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };
  
  // Toggle archive status
  const toggleArchiveCase = async (caseId: string, isArchived: boolean) => {
    try {
      const updated = await caseService.archive(caseId, !isArchived);
      
      if (!updated) {
        throw new Error('Failed to update archive status');
      }
      
      showNotification(
        isArchived ? 'Case unarchived' : 'Case archived', 
        'success'
      );
      
      // Refresh the case list
      fetchCases();
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update archive status';
      
      console.error('Error archiving/unarchiving case:', err);
      showNotification(errorMessage, 'error');
    }
  };
  
  // Handle case submission (create or update)
  const handleCaseSubmit = async (caseData: Partial<Case>) => {
    if (editingCase?.id) {
      await updateCase({ ...caseData, id: editingCase.id });
    } else {
      await createCase(caseData);
    }
    
    setEditingCase(null);
    setFormOpen(false);
  };
  
  // Open case details
  const openCase = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };
  
  // Show notification with auto-close
  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({
      open: true,
      message,
      severity
    });
    
    // Auto-close success notifications
    if (severity === 'success') {
      setTimeout(() => {
        closeNotification();
      }, 5000);
    }
  };
  
  // Close notification
  const closeNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Don't render anything if still checking authentication
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Redirect if not authenticated
  if (!user) {
    return null; 
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
            setEditingCase(null);
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
              <CaseCard
                caseItem={caseItem}
                onEdit={(c) => {
                  setEditingCase(c);
                  setFormOpen(true);
                }}
                onArchive={toggleArchiveCase}
                onOpen={openCase}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Case form dialog */}
      {formOpen && (
        <CaseForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleCaseSubmit}
          editCase={editingCase}
        />
      )}
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeNotification} 
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