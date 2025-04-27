import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Typography,
  Box,
  Chip,
  Divider,
  Stack,
  InputAdornment,
  IconButton,
  Tooltip,
  FormHelperText
} from '@mui/material';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { File } from '../types';
import { supabase } from '../supabaseClient';
import { updateFileDetails, checkExhibitIdUniqueness } from '../utils/exhibitIdUtils';

interface RenameFileDialogProps {
  open: boolean;
  onClose: () => void;
  file: File | null;
  onRenameSuccess: () => void;
}

const RenameFileDialog: React.FC<RenameFileDialogProps> = ({
  open,
  onClose,
  file,
  onRenameSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedExhibitId, setSuggestedExhibitId] = useState<string>('');
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [exhibitId, setExhibitId] = useState<string>('');
  const [exhibitIdError, setExhibitIdError] = useState<string | null>(null);
  const [isValidatingExhibitId, setIsValidatingExhibitId] = useState(false);
  const [newName, setNewName] = useState<string>('');
  const [originalName, setOriginalName] = useState<string>('');

  // Clear state when dialog opens with a new file
  useEffect(() => {
    if (open && file) {
      setLoading(true);
      setError(null);
      setExhibitIdError(null);
      setSuggestedExhibitId('');
      setSuggestedNames([]);
      setExhibitId(file.exhibit_id || '');
      setNewName('');
      setOriginalName(file.name);
      
      // Get AI suggestions for the file
      fetchAISuggestions();
    }
  }, [open, file]);

  // Fetch AI suggestions from the Edge Function
  const fetchAISuggestions = useCallback(async () => {
    if (!file) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('suggest-filename', {
        body: { fileId: file.id }
      });
      
      if (error) throw error;
      
      // Update state with suggestions
      setSuggestedExhibitId(data.suggestedExhibitId || '');
      setSuggestedNames(data.suggestedFullNames || []);
      
      // Set initial values in form (only if the file doesn't already have an exhibit ID)
      if (!file.exhibit_id) {
      setExhibitId(data.suggestedExhibitId || '');
      }
      
      // Extract the base name without exhibit ID and extension
      if (data.suggestedFullNames && data.suggestedFullNames.length > 0) {
        // Extract the name part between the exhibit ID and extension
        const suggestion = data.suggestedFullNames[0];
        const nameMatch = suggestion.match(/^(.+?) - (.+)$/);
        if (nameMatch && nameMatch.length >= 3) {
          setNewName(nameMatch[2]);
        } else {
          // Fallback: just use the whole suggestion
          setNewName(suggestion);
        }
      }
      
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      setError('Failed to get AI suggestions.');
      
      // Set defaults based on original file name if no exhibit ID exists
      if (!file.exhibit_id) {
      setExhibitId('EXH-001');
      }
      setNewName(file.name);
    } finally {
      setLoading(false);
    }
  }, [file]);

  // Validate exhibit ID for uniqueness when it changes
  useEffect(() => {
    const validateExhibitId = async () => {
      if (!file || !exhibitId.trim()) {
        setExhibitIdError(null);
        return;
      }
      
      // Debounce validation to reduce unnecessary API calls
      const timeoutId = setTimeout(async () => {
        setIsValidatingExhibitId(true);
        
        try {
          // Skip validation if the exhibit ID is the same as the current one
          if (file.exhibit_id === exhibitId) {
            setExhibitIdError(null);
            return;
          }
          
          const isUnique = await checkExhibitIdUniqueness(file.project_id, exhibitId, file.id);
          
          if (!isUnique) {
            setExhibitIdError('This Exhibit ID is already in use in this project');
          } else {
            setExhibitIdError(null);
          }
        } catch (error) {
          console.error('Error validating exhibit ID:', error);
          setExhibitIdError('Error checking Exhibit ID uniqueness');
        } finally {
          setIsValidatingExhibitId(false);
        }
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timeoutId);
    };
    
    validateExhibitId();
  }, [exhibitId, file]);

  // Save the updated file name and exhibit ID
  const handleSave = async () => {
    if (!file) return;
    
    // Check for errors before proceeding
    if (exhibitIdError) {
      setError(exhibitIdError);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get file extension from original name
      const fileExtMatch = originalName.match(/\.[^.]+$/);
      const fileExt = fileExtMatch ? fileExtMatch[0] : '';
      
      // Ensure extension is preserved
      let finalName = newName;
      if (!finalName.endsWith(fileExt)) {
        finalName += fileExt;
      }
      
      // Use empty string if exhibitId is empty (to remove existing exhibit ID)
      const finalExhibitId = exhibitId.trim() ? exhibitId : null;
      
      // Perform a final uniqueness check before saving
      if (finalExhibitId && finalExhibitId !== file.exhibit_id) {
        const isUnique = await checkExhibitIdUniqueness(file.project_id, finalExhibitId, file.id);
        if (!isUnique) {
          setError('This Exhibit ID is already in use in this project');
          setLoading(false);
          return;
        }
      }
      
      // Update file details in Supabase
      const result = await updateFileDetails(file.id, finalName, finalExhibitId);
      
      if (!result.success) {
        setError(result.error || 'Failed to update file');
        return;
      }
      
      // Notify parent component and close dialog
      onRenameSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error saving file details:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking on a suggestion
  const handleSuggestionClick = (suggestion: string) => {
    // Extract the name part between the exhibit ID and extension
    const nameMatch = suggestion.match(/^(.+?) - (.+)$/);
    if (nameMatch && nameMatch.length >= 3) {
      setNewName(nameMatch[2]);
    } else {
      // Fallback: just use the whole suggestion
      setNewName(suggestion);
    }
  };

  // Handle exhibit ID format examples
  const handleExampleClick = (example: string) => {
    setExhibitId(example);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DriveFileRenameOutlineIcon color="primary" />
        Rename File and Assign Exhibit ID
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Original Name
              </Typography>
              <Typography variant="body1">
                {originalName}
              </Typography>
              {file?.exhibit_id && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Current Exhibit ID: <Chip size="small" label={file.exhibit_id} />
                </Typography>
              )}
            </Box>
            
            <TextField
              label="Exhibit ID"
              value={exhibitId}
              onChange={(e) => setExhibitId(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
              error={!!exhibitIdError}
              helperText={exhibitIdError || "Custom identifier used for concise citations in your notes"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Tooltip title="This ID will be used as a prefix for the file and in citations. It must be unique within the project. You can use any format that makes sense for your case.">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </InputAdornment>
                ),
                endAdornment: isValidatingExhibitId && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
            />
            
            <Box sx={{ mb: 3, ml: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                Exhibit ID Format Examples (click to use):
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label="EXH-001" 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  onClick={() => handleExampleClick('EXH-001')} 
                  clickable
                />
                <Chip 
                  label="1-A" 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  onClick={() => handleExampleClick('1-A')} 
                  clickable
                />
                <Chip 
                  label="Clip B" 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  onClick={() => handleExampleClick('Clip B')} 
                  clickable
                />
                <Chip 
                  label="Exhibit 42" 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  onClick={() => handleExampleClick('Exhibit 42')} 
                  clickable
                />
                <Chip 
                  label="P-001" 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  onClick={() => handleExampleClick('P-001')} 
                  clickable
                />
                <Chip 
                  label="D-001" 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  onClick={() => handleExampleClick('D-001')} 
                  clickable
                />
              </Stack>
              <FormHelperText sx={{ mt: 1 }}>
                IDs must be unique within a project. Use formats that make sense for your case organization.
              </FormHelperText>
            </Box>
            
            <TextField
              label="New Filename"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={fetchAISuggestions}
                      disabled={loading}
                      size="small"
                      color="primary"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              helperText="Descriptive name for the file (file extension will be preserved)"
            />
            
            {suggestedNames.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }}>
                  <Chip label="AI Suggestions" color="primary" size="small" />
                </Divider>
                
                <Stack spacing={1}>
                  {suggestedNames.map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      clickable
                      color="primary"
                      variant="outlined"
                      sx={{ 
                        height: 'auto', 
                        py: 0.5,
                        '& .MuiChip-label': { 
                          whiteSpace: 'normal',
                          textAlign: 'left',
                          py: 0.5,
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={loading || !newName.trim() || !!exhibitIdError || isValidatingExhibitId}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameFileDialog; 