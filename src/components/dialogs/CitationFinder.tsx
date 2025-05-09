import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  InputAdornment,
  Box,
  Typography,
  Divider,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Paper,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  InsertLink as InsertLinkIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import FileTypeIcon from '../../components/icons/FileTypeIcon';
import { debounce } from 'lodash';
import useAppStore from '../../store';
import supabaseClient from '../../services/supabaseClient';
import { FileWithUrl, Link } from '../../types';

interface CitationFinderProps {
  open: boolean;
  onClose: () => void;
  onSelectFile: (exhibitId: string, fileId: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`citation-finder-tabpanel-${index}`}
      aria-labelledby={`citation-finder-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const CitationFinder = ({ open, onClose, onSelectFile }: CitationFinderProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileWithUrl[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileWithUrl[]>([]);
  const [recentCitations, setRecentCitations] = useState<Link[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [hasExhibitIdFilter, setHasExhibitIdFilter] = useState<boolean | null>(null);
  const [sortOrder, setSortOrder] = useState<'added_at' | 'name' | 'exhibit_id'>('added_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);

  const selectedProjectId = useAppStore((state) => state.selectedProjectId);

  // Load files when dialog opens
  useEffect(() => {
    if (open && selectedProjectId) {
      fetchFiles();
      fetchRecentCitations();
    } else {
      setFiles([]);
      setFilteredFiles([]);
      setSearchTerm('');
      setFileTypeFilter([]);
      setHasExhibitIdFilter(null);
      setTabValue(0);
    }
  }, [open, selectedProjectId]);

  // Filter files when search term or filters change
  useEffect(() => {
    if (!searchTerm && fileTypeFilter.length === 0 && hasExhibitIdFilter === null) {
      // If no filters, just sort and return all files
      setFilteredFiles(sortFiles(files));
      return;
    }

    const filtered = files.filter(file => {
      // Search term filter
      const matchesSearchTerm = !searchTerm ||
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.exhibit_id && file.exhibit_id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // File type filter
      const matchesFileType = fileTypeFilter.length === 0 || 
        fileTypeFilter.includes(file.file_type);
      
      // Has exhibit ID filter
      const matchesExhibitId = hasExhibitIdFilter === null || 
        (hasExhibitIdFilter ? !!file.exhibit_id : !file.exhibit_id);
      
      return matchesSearchTerm && matchesFileType && matchesExhibitId;
    });

    setFilteredFiles(sortFiles(filtered));
  }, [searchTerm, files, fileTypeFilter, hasExhibitIdFilter, sortOrder, sortDirection]);

  // Fetch files
  const fetchFiles = async () => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabaseClient
        .from('files')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('added_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Fetch URLs for thumbnails
        const filesWithUrls = await Promise.all(
          data.map(async (file) => {
            const metadata = file.metadata as { thumbnailUrl?: string };
            
            let thumbnailUrl = undefined;
            if (metadata?.thumbnailUrl) {
              const { data: urlData } = await supabaseClient.storage
                .from('thumbnails')
                .createSignedUrl(metadata.thumbnailUrl, 3600);
                
              if (urlData) {
                thumbnailUrl = urlData.signedUrl;
              }
            }
            
            return {
              ...file,
              thumbnailUrl,
            };
          })
        );
        
        setFiles(filesWithUrls);
        setFilteredFiles(sortFiles(filesWithUrls));
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent citations
  const fetchRecentCitations = async () => {
    if (!selectedProjectId) return;

    try {
      setLoadingRecent(true);
      
      const { data, error } = await supabaseClient
        .from('links')
        .select('*, files!links_source_file_id_fkey(*)')
        .eq('project_id', selectedProjectId)
        .is('source_file_id', 'not.null')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent citations:', error);
        return;
      }

      if (data) {
        setRecentCitations(data);
      }
    } catch (error) {
      console.error('Error fetching recent citations:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  // Sort files
  const sortFiles = (filesToSort: FileWithUrl[]): FileWithUrl[] => {
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortOrder) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'exhibit_id':
          // Sort null exhibit_ids to the end
          if (!a.exhibit_id && !b.exhibit_id) comparison = 0;
          else if (!a.exhibit_id) comparison = 1;
          else if (!b.exhibit_id) comparison = -1;
          else comparison = a.exhibit_id.localeCompare(b.exhibit_id);
          break;
        case 'added_at':
        default:
          comparison = new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Handle file selection
  const handleFileSelect = (file: FileWithUrl) => {
    if (file.exhibit_id) {
      onSelectFile(file.exhibit_id, file.id);
    } else {
      // Use name as fallback if no exhibit ID
      onSelectFile(file.name, file.id);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Handle file type filter
  const handleFileTypeFilterChange = (fileType: string) => {
    if (fileTypeFilter.includes(fileType)) {
      setFileTypeFilter(fileTypeFilter.filter(type => type !== fileType));
    } else {
      setFileTypeFilter([...fileTypeFilter, fileType]);
    }
  };

  // Handle has exhibit ID filter
  const handleHasExhibitIdFilterChange = (value: boolean | null) => {
    setHasExhibitIdFilter(value);
  };

  // Toggle sort direction
  const handleToggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Change sort option
  const handleChangeSortOption = (option: 'added_at' | 'name' | 'exhibit_id') => {
    setSortOrder(option);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFileTypeFilter([]);
    setHasExhibitIdFilter(null);
  };

  // Get unique file types
  const fileTypes = Array.from(new Set(files.map(file => file.file_type)));

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        Cite Evidence
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <ClearIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
        <Box sx={{ px: 3, pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search by name or exhibit ID..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <Tooltip title="Clear search">
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleClearSearch}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          
          {/* Filters and sort controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {/* File Type Filters */}
              {fileTypes.map(type => (
                <Chip
                  key={type}
                  label={type}
                  size="small"
                  color={fileTypeFilter.includes(type) ? 'primary' : 'default'}
                  onClick={() => handleFileTypeFilterChange(type)}
                  variant={fileTypeFilter.includes(type) ? 'filled' : 'outlined'}
                />
              ))}
              
              {/* Exhibit ID filter */}
              <Chip
                label="Has Exhibit ID"
                size="small"
                color={hasExhibitIdFilter === true ? 'primary' : 'default'}
                onClick={() => handleHasExhibitIdFilterChange(hasExhibitIdFilter === true ? null : true)}
                variant={hasExhibitIdFilter === true ? 'filled' : 'outlined'}
              />
              <Chip
                label="No Exhibit ID"
                size="small"
                color={hasExhibitIdFilter === false ? 'primary' : 'default'}
                onClick={() => handleHasExhibitIdFilterChange(hasExhibitIdFilter === false ? null : false)}
                variant={hasExhibitIdFilter === false ? 'filled' : 'outlined'}
              />
              
              {/* Clear filters */}
              {(fileTypeFilter.length > 0 || hasExhibitIdFilter !== null || searchTerm) && (
                <Chip
                  label="Clear Filters"
                  size="small"
                  color="primary"
                  onClick={handleClearFilters}
                />
              )}
            </Box>
            
            {/* Sort options */}
            <Box>
              <Tooltip title="Sort options">
                <span>
                  <IconButton 
                    size="small" 
                    onClick={() => handleToggleSortDirection()}
                  >
                    <SortIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                Sort: 
                <Button 
                  size="small" 
                  sx={{ ml: 1, textTransform: 'none', minWidth: 0 }}
                  onClick={() => handleChangeSortOption('added_at')}
                  color={sortOrder === 'added_at' ? 'primary' : 'inherit'}
                >
                  Date
                </Button>
                <Button 
                  size="small" 
                  sx={{ textTransform: 'none', minWidth: 0 }}
                  onClick={() => handleChangeSortOption('name')}
                  color={sortOrder === 'name' ? 'primary' : 'inherit'}
                >
                  Name
                </Button>
                <Button 
                  size="small" 
                  sx={{ textTransform: 'none', minWidth: 0 }}
                  onClick={() => handleChangeSortOption('exhibit_id')}
                  color={sortOrder === 'exhibit_id' ? 'primary' : 'inherit'}
                >
                  ID
                </Button>
                {sortDirection === 'asc' ? '↑' : '↓'}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="citation finder tabs">
            <Tab label="All Files" icon={<InsertLinkIcon />} iconPosition="start" />
            <Tab label="Recent Citations" icon={<HistoryIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        <Box sx={{ flexGrow: 1, overflow: 'auto', px: 3 }}>
          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}
          
          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredFiles.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography color="text.secondary">
                  {files.length === 0
                    ? 'No files available. Upload evidence files first.'
                    : 'No files match your search criteria.'}
                </Typography>
              </Box>
            ) : (
              <List sx={{ pt: 0 }}>
                {filteredFiles.map((file) => (
                  <Paper
                    key={file.id}
                    elevation={1}
                    sx={{ 
                      mb: 1, 
                      borderRadius: 1,
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => handleFileSelect(file)}
                  >
                    <ListItem sx={{ py: 1 }}>
                      <ListItemAvatar>
                        <Avatar
                          variant="rounded"
                          src={file.thumbnailUrl}
                          sx={{
                            bgcolor: 'background.default',
                            color: 'text.secondary',
                            width: 50,
                            height: 50,
                            mr: 1,
                            border: 1,
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {!file.thumbnailUrl && (
                            <FileTypeIcon 
                              fileName={file.name}
                              fileType={file.file_type}
                              mimeType={file.content_type}
                              size="small"
                            />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {file.name}
                            </Typography>
                            {file.exhibit_id && (
                              <Chip 
                                label={file.exhibit_id} 
                                size="small" 
                                color="primary"
                                sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {file.file_type} • {(file.size / 1024).toFixed(0)} KB • {new Date(file.added_at).toLocaleDateString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {loadingRecent ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : recentCitations.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography color="text.secondary">
                  No recent citations found. Start citing evidence to see your history here.
                </Typography>
              </Box>
            ) : (
              <List sx={{ pt: 0 }}>
                {recentCitations.map((citation) => {
                  const file = citation.files as any;
                  return (
                    <Paper
                      key={citation.id}
                      elevation={1}
                      sx={{ 
                        mb: 1, 
                        borderRadius: 1,
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => file && handleFileSelect(file)}
                    >
                      <ListItem sx={{ py: 1 }}>
                        <ListItemAvatar>
                          <Avatar
                            variant="rounded"
                            sx={{
                              bgcolor: 'background.default',
                              color: 'text.secondary',
                              width: 50,
                              height: 50,
                              mr: 1,
                              border: 1,
                              borderColor: 'divider',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <FileTypeIcon 
                              fileName={file?.name || 'Unknown file'}
                              fileType={file?.file_type || 'document'}
                              size="small"
                            />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {file?.name || 'Unknown file'}
                              </Typography>
                              {file?.exhibit_id && (
                                <Chip 
                                  label={file.exhibit_id} 
                                  size="small" 
                                  color="primary"
                                  sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Last cited {new Date(citation.created_at).toLocaleString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </Paper>
                  );
                })}
              </List>
            )}
          </TabPanel>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CitationFinder; 