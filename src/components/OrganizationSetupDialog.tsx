import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { AIService, OrganizationAnswers, OrganizationResponse } from '../services/AIService';

interface OrganizationSetupDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: (tags: string[]) => void;
}

const OrganizationSetupDialog: React.FC<OrganizationSetupDialogProps> = ({
  open,
  onClose,
  projectId,
  onSuccess
}) => {
  // Form state
  const [answers, setAnswers] = useState<OrganizationAnswers>({
    goal: '',
    parties: '',
    documentTypes: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string[] | null>(null);
  
  const handleChange = (field: keyof OrganizationAnswers) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers({
      ...answers,
      [field]: e.target.value
    });
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await AIService.suggestOrganization(projectId, answers);
      
      if (!response.success || response.error) {
        throw new Error(response.error || 'Failed to get organization suggestions');
      }
      
      setResult(response.tags);
    } catch (err) {
      console.error('Error organizing project:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfirm = () => {
    if (result) {
      onSuccess(result);
    }
  };
  
  const handleClose = () => {
    // Reset state on close
    setAnswers({
      goal: '',
      parties: '',
      documentTypes: ''
    });
    setError(null);
    setResult(null);
    onClose();
  };
  
  const isSubmitDisabled = !answers.goal || loading;
  
  return (
    <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Organize Project with AI</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Answer a few questions to help our AI suggest appropriate organization tags for your project.
        </DialogContentText>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : result ? (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Suggested Tags:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {result.map((tag, index) => (
                <Chip key={index} label={tag} color="primary" variant="outlined" />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              These tags will be applied to files in this project to help with organization.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="1. What is the primary goal/type of this case or project?"
              fullWidth
              multiline
              rows={2}
              value={answers.goal}
              onChange={handleChange('goal')}
              placeholder="e.g., Contract dispute, Personal injury case, Corporate merger, etc."
              required
            />
            
            <TextField
              label="2. Who are the key parties/entities involved?"
              fullWidth
              multiline
              rows={2}
              value={answers.parties}
              onChange={handleChange('parties')}
              placeholder="e.g., Client name, opposing party, relevant companies, etc."
            />
            
            <TextField
              label="3. What main document types do you anticipate?"
              fullWidth
              multiline
              rows={2}
              value={answers.documentTypes}
              onChange={handleChange('documentTypes')}
              placeholder="e.g., Contracts, medical records, court filings, witness statements, etc."
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {result ? (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleConfirm} variant="contained" color="primary">
              Apply Tags
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary" 
              disabled={isSubmitDisabled}
            >
              {loading ? 'Processing...' : 'Submit for Suggestions'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OrganizationSetupDialog; 