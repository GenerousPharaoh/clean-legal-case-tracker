import { useState, useEffect } from 'react';
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
  Divider,
  IconButton,
  Tooltip,
  Autocomplete,
  Chip,
} from '@mui/material';
import { Refresh as RefreshIcon, ContentPaste as PasteIcon } from '@mui/icons-material';
import supabaseClient from '../../services/supabaseClient';
import useAppStore from '../../store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileRecord } from '../../hooks/useProjectFiles';

interface RenameFileDialogProps {
  open: boolean;
  fileId: string | null;
  onClose: () => void;
}

interface FileNameSuggestion {
  suggestedNames: string[];
  nextExhibitId: string;
}

const RenameFileDialog = ({ open, fileId, onClose }: RenameFileDialogProps) => {
  const [newName, setNewName] = useState('');
  const [newExhibitId, setNewExhibitId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingFilenameSuggestions, setLoadingFilenameSuggestions] = useState(false);
  const [loadingExhibitId, setLoadingExhibitId] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [nextExhibitId, setNextExhibitId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [exhibitIdExists, setExhibitIdExists] = useState(false);
  
  const files = useAppStore((state) => state.files);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  
  // React Query client
  const queryClient = useQueryClient();
  
  // Get the file from the store
  const file = fileId ? files.find(f => f.id === fileId) : null;
  
  // Set up initial values when dialog opens
  useEffect(() => {
    if (open && file) {
      setNewName(file.name || '');
      setNewExhibitId(file.exhibit_id || '');
      setExhibitIdExists(false);
      setError(null);
      setLoading(false);
      
      // Get filename suggestions and next exhibit ID
      if (selectedProjectId) {
        getFilenameSuggestions(file.name, file.storage_path);
        getNextExhibitId();
      }
    } else {
      setLoading(true);
      setNameSuggestions([]);
      setNextExhibitId('');
    }
  }, [open, file, selectedProjectId]);

  // Check if exhibit ID already exists
  useEffect(() => {
    if (newExhibitId && newExhibitId !== file?.exhibit_id) {
      const exists = files.some(f => 
        f.id !== fileId && 
        f.exhibit_id?.toLowerCase() === newExhibitId.toLowerCase()
      );
      
      setExhibitIdExists(exists);
    } else {
      setExhibitIdExists(false);
    }
  }, [newExhibitId, files, fileId, file]);
  
  // Get filename suggestions and next exhibit ID
  const getFilenameSuggestions = async (filename: string, storagePath: string) => {
    if (!selectedProjectId) return;
    
    try {
      setLoadingFilenameSuggestions(true);
      
      const response = await supabaseClient.functions.invoke('suggest-filename', {
        body: {
          projectId: selectedProjectId,
          filename,
          storagePath,
        },
      });
      
      if (response.error) {
        console.error('Error getting filename suggestions:', response.error);
        return;
      }
      
      if (response.data?.suggestedNames) {
        setNameSuggestions(response.data.suggestedNames);
      }
    } catch (error) {
      console.error('Error getting filename suggestions:', error);
    } finally {
      setLoadingFilenameSuggestions(false);
    }
  };
  
  // Get next available exhibit ID
  const getNextExhibitId = async () => {
    if (!selectedProjectId) return;
    
    try {
      setLoadingExhibitId(true);
      
      const response = await supabaseClient.functions.invoke('get-next-exhibit-id', {
        body: {
          projectId: selectedProjectId,
        },
      });
      
      if (response.error) {
        console.error('Error getting next exhibit ID:', response.error);
        return;
      }
      
      if (response.data?.nextExhibitId) {
        setNextExhibitId(response.data.nextExhibitId);
      }
    } catch (error) {
      console.error('Error getting next exhibit ID:', error);
    } finally {
      setLoadingExhibitId(false);
    }
  };
  
  // Rename file mutation
  const { 
    mutate: renameFile,
    isPending,
    isError,
    error: mutationError
  } = useMutation({
    mutationFn: async ({ 
      fileId,
      name,
      exhibitId 
    }: { 
      fileId: string; 
      name: string; 
      exhibitId?: string 
    }) => {
      if (!fileId) throw new Error('File ID is required');
      
      // Create the update data
      const updateData: Partial<FileRecord> = { name };
      if (exhibitId !== undefined) {
        updateData.exhibit_id = exhibitId.trim() || null;
      }
      
      // Update the file
      const { data, error } = await supabaseClient
        .from('files')
        .update(updateData)
        .eq('id', fileId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update files in the store
      const updatedFiles = files.map(f => f.id === data.id ? data : f);
      useAppStore.getState().setFiles(updatedFiles);
      
      // Invalidate query cache
      if (data.project_id) {
        queryClient.invalidateQueries({ queryKey: ['files', data.project_id] });
      }
      
      // Close the dialog
      onClose();
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  });
  
  // Handle save
  const handleSave = () => {
    if (!fileId) return;
    
    // Validate exhibit ID is not duplicate
    if (exhibitIdExists) {
      setError(`Exhibit ID "${newExhibitId}" is already in use. Please choose a different ID.`);
      return;
    }
    
    renameFile({
      fileId,
      name: newName.trim(),
      exhibitId: newExhibitId.trim()
    });
  };
  
  // Apply suggested name
  const handleApplySuggestedName = (name: string) => {
    setNewName(name);
  };
  
  // Apply next exhibit ID
  const handleApplyNextExhibitId = () => {
    if (nextExhibitId) {
      setNewExhibitId(nextExhibitId);
    }
  };
  
  // Handle close with reset
  const handleClose = () => {
    setNewName('');
    setNewExhibitId('');
    setError(null);
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>Rename File & Assign Exhibit ID</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {(isError || error) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || (mutationError instanceof Error ? mutationError.message : 'Failed to rename file')}
              </Alert>
            )}
            
            {/* File Name Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                File Name
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                fullWidth
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isPending}
                InputProps={{
                  endAdornment: loadingFilenameSuggestions && (
                    <CircularProgress size={20} />
                  ),
                }}
                error={!newName.trim()}
                helperText={!newName.trim() && "File name is required"}
              />
              
              {/* Filename Suggestions */}
              {nameSuggestions.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Suggested Names:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {nameSuggestions.map((name, index) => (
                      <Chip
                        key={index}
                        label={name}
                        size="small"
                        onClick={() => handleApplySuggestedName(name)}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Exhibit ID Section */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Exhibit ID
              </Typography>
              <TextField
                margin="dense"
                fullWidth
                value={newExhibitId}
                onChange={(e) => setNewExhibitId(e.target.value)}
                disabled={isPending}
                placeholder="e.g., A, B, 1, 2, etc."
                error={exhibitIdExists}
                helperText={
                  exhibitIdExists 
                    ? "This Exhibit ID is already in use" 
                    : "Assign a unique identifier for easy reference in your notes"
                }
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Apply next available ID">
                      <span>
                        <IconButton 
                          size="small" 
                          onClick={handleApplyNextExhibitId}
                          disabled={!nextExhibitId || loadingExhibitId}
                        >
                          {loadingExhibitId ? <CircularProgress size={20} /> : <PasteIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  ),
                }}
              />
              
              {/* Next Available ID */}
              {nextExhibitId && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Next available ID: <Chip 
                    label={nextExhibitId} 
                    size="small" 
                    color="primary" 
                    onClick={handleApplyNextExhibitId}
                    sx={{ ml: 0.5, height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                  />
                </Typography>
              )}
              
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Refresh next available ID">
                  <span>
                    <IconButton size="small" onClick={getNextExhibitId} disabled={loadingExhibitId}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Generate a new suggested ID
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={!newName.trim() || isPending || exhibitIdExists}
        >
          {isPending ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameFileDialog; 