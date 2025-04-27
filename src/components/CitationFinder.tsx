import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  CircularProgress,
  Typography,
  Box,
  Divider,
  Chip,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FileIcon from './FileIcon';
import { supabase } from '../supabaseClient';
import { FileType, File } from '../store/store';
import { useProjectStore } from '../store';

// Interface for files with exhibit ID
interface FileWithExhibitId {
  id: string;
  name: string;
  file_type: FileType;
  exhibit_id: string | null;
  content_type: string;
}

interface CitationFinderProps {
  open: boolean;
  onClose: () => void;
  onInsertCitation: (file: File) => void;
}

export const CitationFinder: React.FC<CitationFinderProps> = ({
  open,
  onClose,
  onInsertCitation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { selectedProjectId } = useProjectStore();
  
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setError(null);
      fetchFiles();
      
      // Focus search input when dialog opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open, selectedProjectId]);
  
  useEffect(() => {
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      setFilteredFiles(files.filter(file => {
        const matchesName = file.name.toLowerCase().includes(lowerCaseSearch);
        const matchesExhibitId = file.exhibit_id && 
          file.exhibit_id.toLowerCase().includes(lowerCaseSearch);
        return matchesName || matchesExhibitId;
      }));
    } else {
      setFilteredFiles(files);
    }
  }, [searchTerm, files]);
  
  const fetchFiles = async () => {
    if (!selectedProjectId) {
      setError('No project selected');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('added_at', { ascending: false });
      
      if (error) throw error;
      
      setFiles(data as File[]);
      setFilteredFiles(data as File[]);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    };
  };
  
  const handleSelectFile = (file: File) => {
    onInsertCitation(file);
    onClose();
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { height: '70vh', maxHeight: '800px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6">Cite Evidence</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <TextField
          inputRef={inputRef}
          fullWidth
          variant="outlined"
          placeholder="Search files by name or Exhibit ID..."
          value={searchTerm}
          onChange={handleSearchChange}
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ my: 2 }}>
            {error}
          </Typography>
        ) : filteredFiles.length === 0 ? (
          <Typography align="center" sx={{ my: 2 }}>
            No files found. Try a different search term.
          </Typography>
        ) : (
          <List sx={{ pt: 2, overflow: 'auto' }}>
            {filteredFiles.map((file) => (
              <React.Fragment key={file.id}>
                <ListItem 
                  button 
                  onClick={() => handleSelectFile(file)}
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    py: 1.5
                  }}
                >
                  <Box width="100%" display="flex" alignItems="center" mb={0.5}>
                    <ListItemText 
                      primary={file.name} 
                      primaryTypographyProps={{ 
                        variant: 'subtitle1', 
                        noWrap: true,
                        sx: { mr: 1 } 
                      }}
                    />
                    
                    {file.exhibit_id && (
                      <Chip 
                        label={file.exhibit_id} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {new Date(file.added_at || '').toLocaleDateString()}
                    {file.file_type && ` • ${file.file_type}`}
                    {file.size && ` • ${formatFileSize(file.size)}`}
                  </Typography>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

export default CitationFinder; 