import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import type { Case } from '../types/database';

interface CaseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (caseData: Partial<Case>) => Promise<void>;
  editCase: Case | null;
}

/**
 * Reusable form component for creating and editing cases
 */
const CaseForm: React.FC<CaseFormProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  editCase 
}) => {
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
    
    // Validate form
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
        status
      });
      
      // Let the parent component close the dialog
    } catch (err) {
      setError(err instanceof Error 
        ? err.message 
        : 'Failed to save case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={!loading ? onClose : undefined} 
      maxWidth="sm" 
      fullWidth
      aria-labelledby="case-form-dialog-title"
    >
      <DialogTitle id="case-form-dialog-title">
        {editCase ? 'Edit Case' : 'Create New Case'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            autoFocus
            margin="dense"
            id="case-name"
            name="caseName"
            label="Case Name"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 2 }}
            disabled={loading}
          />
          
          <TextField
            margin="dense"
            id="case-description"
            name="caseDescription"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          />
          
          <FormControl fullWidth margin="dense" disabled={loading}>
            <InputLabel id="case-status-label">Status</InputLabel>
            <Select
              labelId="case-status-label"
              id="case-status"
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
          <Button 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              editCase ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CaseForm; 