import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  TextField,
  IconButton,
  Chip,
  Stack,
  Skeleton,
  Tooltip,
  LinearProgress,
  Alert,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Badge,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  FileUpload as UploadIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  CloudDownload as DownloadIcon,
  Label as LabelIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import useAppStore from '../../store';
import supabaseClient from '../../services/supabaseClient';
import { Project } from '../../types';
import AdvancedSearchFilters from '../../components/search/AdvancedSearchFilters';
import RenameFileDialog from '../../components/dialogs/RenameFileDialog';
import { useProjectFiles, useFileUpload, FileRecord } from '../../hooks/useProjectFiles';
import { debounce } from 'lodash';
import FileTypeIcon from '../../components/icons/FileTypeIcon';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import { useNotification } from '../../contexts/NotificationContext';

// File type icons are now handled by the FileTypeIcon component

const LeftPanel = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  const selectedFileId = useAppStore((state) => state.selectedFileId);
  const setSelectedFile = useAppStore((state) => state.setSelectedFile);
  const searchFilters = useAppStore((state) => state.searchFilters);
  const setSearchFilters = useAppStore((state) => state.setSearchFilters);
  const resetSearchFilters = useAppStore((state) => state.resetSearchFilters);
  const setFiles = useAppStore((state) => state.setFiles);
  const projects = useAppStore((state) => state.projects);
  const setProjects = useAppStore((state) => state.setProjects);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Dialog states
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renameFileDialogOpen, setRenameFileDialogOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  
  // UI state
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFileMenuId, setActiveFileMenuId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'added_at' | 'name' | 'exhibit_id'>('added_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // React Query hooks
  const { 
    data: files = [], // Ensure it's always an array with default empty array
    isLoading: filesLoading, 
    refetch: refetchFiles,
    isError: isFilesError,
    error: filesError
  } = useProjectFiles(selectedProjectId);
  
  const {
    mutate: uploadFile,
    isPending: isUploading,
    isError: isUploadError,
    error: uploadMutationError
  } = useFileUpload();
  
  // Sync files with the store to maintain compatibility
  useEffect(() => {
    if (files) {
      setFiles(files);
    }
  }, [files, setFiles]);

  // Fetch projects on mount
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!selectedProjectId) return;
      
      // If search term is empty, just reset and return
      if (!term.trim()) {
        setSearchLoading(false);
        return;
      }
      
      try {
        setSearchLoading(true);
        
        // Call the project-search Edge Function
        const response = await supabaseClient.functions.invoke('project-search', {
          body: {
            projectId: selectedProjectId,
            query: term,
            filters: {
              fileTypes: searchFilters.fileTypes || [],
              tags: searchFilters.tags || [],
              entities: searchFilters.entities || [],
              dateFrom: searchFilters.dateFrom ? new Date(searchFilters.dateFrom).toISOString() : null,
              dateTo: searchFilters.dateTo ? new Date(searchFilters.dateTo).toISOString() : null,
            },
            searchType: searchFilters.searchType || 'combined',
          },
        });
        
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        // The response should contain file IDs sorted by relevance
        if (response.data?.results) {
          // We could update the file list directly here, but for now we'll just filter the existing files
          // This would need to be updated to fully use the semantic search results when ready
          console.log('Search results:', response.data.results);
        }
      } catch (error) {
        console.error('Error during search:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    [selectedProjectId, searchFilters]
  );

  // Trigger search when searchTerm changes
  useEffect(() => {
    if (searchFilters.searchTerm) {
      setSearchLoading(true);
      debouncedSearch(searchFilters.searchTerm);
    }
  }, [searchFilters.searchTerm, debouncedSearch]);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (error) {
      logError(error, 'fetchProjects');
      // We're not showing this error to the user directly, but could add a notification here
    } finally {
      setProjectsLoading(false);
    }
  };

  // Create new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user) return;

    try {
      const { data, error } = await supabaseClient
        .from('projects')
        .insert({
          name: newProjectName.trim(),
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProjects([data, ...projects]);
      setSelectedProject(data.id);
      setNewProjectName('');
      setProjectDialogOpen(false);
    } catch (error) {
      logError(error, 'handleCreateProject');
      showNotification({
        message: getErrorMessage(error, 'Error creating project'),
        severity: 'error',
        autoHideDuration: 6000
      });
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProjectId || !user || !event.target.files || event.target.files.length === 0) {
      return;
    }

    try {
      setUploadProgress(0);
      
      const file = event.target.files[0];
      
      // Use the React Query mutation with progress tracking
      await uploadFile(
        { 
          file, 
          projectId: selectedProjectId, 
          userId: user.id,
          onProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        },
        {
          onSuccess: (data) => {
            console.log('Upload successful:', data);
            
            // Show success message via notification system
            showNotification({
              message: 'File uploaded successfully',
              severity: 'success'
            });
            
            // Also select the new file for immediate viewing
            if (data && data.id) {
              setSelectedFile(data.id);
            }
            
            // Reset the input
            event.target.value = '';
          },
          onError: (error) => {
            logError(error, 'fileUpload');
            showNotification({
              message: getErrorMessage(error, 'Error uploading file'),
              severity: 'error',
              autoHideDuration: 6000
            });
          }
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Handle search term change
  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilters({ searchTerm: event.target.value });
  };

  // Clear search term
  const handleClearSearch = () => {
    setSearchFilters({ searchTerm: '' });
  };

  // Apply search filters - Type-safe and always returns an array
  const filterFiles = (filesToFilter: FileRecord[]): FileRecord[] => {
    // Guard: ensure files is always an array
    if (!Array.isArray(filesToFilter)) {
      console.warn('filterFiles received non-array input:', filesToFilter);
      return [];
    }
    
    // No filters applied
    if (!searchFilters.searchTerm && 
        (!searchFilters.fileTypes || searchFilters.fileTypes.length === 0) &&
        (!searchFilters.dateFrom && !searchFilters.dateTo)) {
      return sortFiles(filesToFilter);
    }

    return sortFiles(filesToFilter.filter((file) => {
      const matchesSearchTerm = !searchFilters.searchTerm ||
        file.name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        (file.exhibit_id && file.exhibit_id.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()));
      
      const matchesFileType = !searchFilters.fileTypes || 
        searchFilters.fileTypes.length === 0 || 
        searchFilters.fileTypes.includes(file.file_type);
      
      let matchesDateRange = true;
      if (searchFilters.dateFrom || searchFilters.dateTo) {
        const fileDate = new Date(file.added_at);
        
        if (searchFilters.dateFrom) {
          matchesDateRange = fileDate >= new Date(searchFilters.dateFrom);
        }
        
        if (matchesDateRange && searchFilters.dateTo) {
          matchesDateRange = fileDate <= new Date(searchFilters.dateTo);
        }
      }
      
      return matchesSearchTerm && matchesFileType && matchesDateRange;
    }));
  };

  // Sort files based on sort option and direction
  const sortFiles = (filesToSort: FileRecord[]): FileRecord[] => {
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption) {
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
  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
  };

  // Handle rename dialog
  const handleOpenRenameDialog = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setFileToRename(fileId);
    setRenameFileDialogOpen(true);
    handleCloseFileMenu();
  };

  // Handle file menu open
  const handleFileMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, fileId: string) => {
    event.stopPropagation();
    setFileMenuAnchorEl(event.currentTarget);
    setActiveFileMenuId(fileId);
  };

  // Handle file menu close
  const handleCloseFileMenu = () => {
    setFileMenuAnchorEl(null);
    setActiveFileMenuId(null);
  };

  // Handle file delete confirmation
  const handleDeleteConfirm = (fileId: string) => {
    setFileToDelete(fileId);
    setDeleteConfirmOpen(true);
    handleCloseFileMenu();
  };

  // Delete file
  const handleDeleteFile = async () => {
    if (!fileToDelete || !selectedProjectId) {
      setDeleteConfirmOpen(false);
      return;
    }
    
    try {
      // Get file details to get the storage path
      const fileToDeleteDetails = files.find(f => f.id === fileToDelete);
      
      if (fileToDeleteDetails) {
        // Delete from storage first
        const { error: storageError } = await supabaseClient.storage
          .from('files')
          .remove([fileToDeleteDetails.storage_path]);
        
        if (storageError) {
          logError(storageError, 'handleDeleteFile.storage');
          // Continue anyway to try to delete the database record
        }
        
        // Delete from database
        const { error } = await supabaseClient
          .from('files')
          .delete()
          .eq('id', fileToDelete);
        
        if (error) throw error;
        
        // If currently selected file was deleted, clear selection
        if (selectedFileId === fileToDelete) {
          setSelectedFile(null);
        }
        
        // Refetch files list
        refetchFiles();
      }
    } catch (error) {
      logError(error, 'handleDeleteFile.database');
      showNotification({
        message: getErrorMessage(error, 'Error deleting file'),
        severity: 'error',
        autoHideDuration: 6000
      });
    } finally {
      setDeleteConfirmOpen(false);
      setFileToDelete(null);
    }
  };

  // Handle file download
  const handleDownloadFile = async (fileId: string) => {
    handleCloseFileMenu();
    
    const fileToDownload = files.find(f => f.id === fileId);
    if (!fileToDownload) return;
    
    try {
      // Get a signed URL
      const { data, error } = await supabaseClient.storage
        .from('files')
        .createSignedUrl(fileToDownload.storage_path, 60); // 1 minute expiry
      
      if (error) throw error;
      
      if (data?.signedUrl) {
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = fileToDownload.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      logError(error, 'handleDownloadFile');
      showNotification({
        message: getErrorMessage(error, 'Error downloading file'),
        severity: 'error',
        autoHideDuration: 6000
      });
    }
  };

  // Toggle sort direction
  const handleToggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Change sort option
  const handleChangeSortOption = (option: 'added_at' | 'name' | 'exhibit_id') => {
    setSortOption(option);
  };

  // IMPORTANT: guarantee filteredFiles is always an array before using .map()
  const filteredFiles = filterFiles(files || []);

  return (
    <Box 
      sx={{ height: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      data-test="left-panel"
    >
      {/* Projects Section */}
      <Paper elevation={0} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Projects</Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setProjectDialogOpen(true)}
          >
            New
          </Button>
        </Box>
        
        {/* Project List */}
        {projectsLoading ? (
          <List>
            {[1, 2, 3].map((i) => (
              <ListItem key={i} disablePadding>
                <ListItemButton>
                  <Skeleton variant="rectangular" width="100%" height={30} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
            {projects.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="No projects yet" 
                  secondary="Create your first project to get started"
                  primaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItem>
            ) : (
              projects.map((project: Project) => (
                <ListItem key={project.id} disablePadding>
                  <ListItemButton
                    data-test="project-list-item"
                    selected={selectedProjectId === project.id}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <ListItemText
                      primary={project.name}
                      primaryTypographyProps={{
                        noWrap: true,
                        sx: { fontWeight: selectedProjectId === project.id ? 'bold' : 'normal' },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        )}
      </Paper>
      
      {/* Files Section */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Paper elevation={0} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Files</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh files list">
                <span>
                  <IconButton 
                    size="small" 
                    onClick={() => refetchFiles()} 
                    disabled={!selectedProjectId || filesLoading}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              
              {/* Sort Menu */}
              <Tooltip title="Sort files">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      setFileMenuAnchorEl(e.currentTarget);
                      setActiveFileMenuId('sort');
                    }}
                    color={activeFileMenuId === 'sort' ? 'primary' : 'default'}
                    disabled={!selectedProjectId}
                  >
                    <SortIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Menu
                anchorEl={fileMenuAnchorEl}
                open={activeFileMenuId === 'sort'}
                onClose={handleCloseFileMenu}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem 
                  onClick={() => { handleChangeSortOption('added_at'); handleCloseFileMenu(); }}
                  selected={sortOption === 'added_at'}
                >
                  Date Added {sortOption === 'added_at' && (sortDirection === 'desc' ? '(Newest)' : '(Oldest)')}
                </MenuItem>
                <MenuItem 
                  onClick={() => { handleChangeSortOption('name'); handleCloseFileMenu(); }}
                  selected={sortOption === 'name'}
                >
                  Name {sortOption === 'name' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
                </MenuItem>
                <MenuItem 
                  onClick={() => { handleChangeSortOption('exhibit_id'); handleCloseFileMenu(); }}
                  selected={sortOption === 'exhibit_id'}
                >
                  Exhibit ID {sortOption === 'exhibit_id' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { handleToggleSortDirection(); handleCloseFileMenu(); }}>
                  {sortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                </MenuItem>
              </Menu>
              
              {/* Upload Button */}
              <Button
                size="small"
                startIcon={<UploadIcon />}
                component="label"
                disabled={!selectedProjectId || isUploading}
                variant="contained"
                color="primary"
                data-test="upload-button"
              >
                Upload
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={!selectedProjectId || isUploading}
                  data-test="file-input"
                />
              </Button>
            </Box>
          </Box>
          
          {/* Search Box */}
          <Box sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search files..."
              value={searchFilters.searchTerm || ''}
              onChange={handleSearchTermChange}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: searchLoading ? (
                  <InputAdornment position="start">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchFilters.searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <IconButton
              size="small"
              onClick={() => setSearchExpanded(!searchExpanded)}
              color={searchExpanded ? 'primary' : 'default'}
              sx={{ ml: 1 }}
            >
              <FilterListIcon />
            </IconButton>
          </Box>
          
          {/* Advanced Search Filters */}
          {searchExpanded && (
            <Box sx={{ mb: 2 }}>
              <AdvancedSearchFilters />
            </Box>
          )}
          
          {/* Upload Progress */}
          {isUploading && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="caption" display="block" gutterBottom>
                Uploading file... {uploadProgress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ height: 4, borderRadius: 2 }} 
              />
            </Box>
          )}
          
          {/* Upload Error */}
          {isUploadError && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              Upload failed: {uploadMutationError instanceof Error ? uploadMutationError.message : 'Unknown error'}
            </Alert>
          )}
          
          {/* Files Error */}
          {isFilesError && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              Error loading files: {filesError instanceof Error ? filesError.message : 'Unknown error'}
            </Alert>
          )}
          
          {/* Active Filters */}
          {((searchFilters.fileTypes?.length || 0) > 0 || searchFilters.dateFrom || searchFilters.dateTo) && (
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
              {/* File type filters */}
              {searchFilters.fileTypes?.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  size="small"
                  onDelete={() => {
                    const newTypes = searchFilters.fileTypes?.filter(t => t !== type) || [];
                    setSearchFilters({ fileTypes: newTypes });
                  }}
                />
              ))}
              
              {/* Date filters */}
              {searchFilters.dateFrom && (
                <Chip
                  label={`From: ${new Date(searchFilters.dateFrom).toLocaleDateString()}`}
                  size="small"
                  onDelete={() => setSearchFilters({ dateFrom: null })}
                />
              )}
              
              {searchFilters.dateTo && (
                <Chip
                  label={`To: ${new Date(searchFilters.dateTo).toLocaleDateString()}`}
                  size="small"
                  onDelete={() => setSearchFilters({ dateTo: null })}
                />
              )}
              
              {/* Clear all button */}
              {((searchFilters.fileTypes?.length || 0) > 0 || searchFilters.dateFrom || searchFilters.dateTo) && (
                <Chip
                  label="Clear all filters"
                  size="small"
                  color="primary"
                  onClick={resetSearchFilters}
                />
              )}
            </Stack>
          )}
        </Paper>
        
        {/* File List */}
        <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
          {filesLoading ? (
            Array(5).fill(0).map((_, index) => (
              <ListItem key={index} divider>
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <Skeleton variant="rectangular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="50%" />
                  </Box>
                </Box>
              </ListItem>
            ))
          ) : !selectedProjectId ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Select a project to view files.
              </Typography>
            </Box>
          ) : filteredFiles.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchFilters.searchTerm ? 'No files match your search criteria.' : 'No files found. Upload a file to get started.'}
              </Typography>
            </Box>
          ) : (
            filteredFiles.map((file) => {
              const metadata = file.metadata || {};
              const thumbnailUrl = metadata.thumbnailUrl;
              
              return (
                <ListItem
                  key={file.id}
                  divider
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleFileMenuOpen(e, file.id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  }
                  disablePadding
                >
                  <ListItemButton
                    selected={selectedFileId === file.id}
                    onClick={() => handleFileSelect(file.id)}
                    sx={{ py: 1 }}
                    data-test="file-item"
                  >
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      {/* Thumbnail or Icon */}
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          mr: 2,
                          backgroundColor: 'background.default',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: 1,
                          borderColor: 'divider',
                        }}
                      >
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={file.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <FileTypeIcon 
                            fileName={file.name}
                            fileType={file.file_type}
                            mimeType={file.content_type}
                            size="medium"
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ fontWeight: selectedFileId === file.id ? 'bold' : 'normal' }}
                        >
                          {file.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {file.exhibit_id && (
                            <Chip
                              label={file.exhibit_id}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 1, height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {(file.size / 1024).toFixed(0)} KB • {new Date(file.added_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
      </Box>

      {/* File Action Menu */}
      <Menu
        anchorEl={fileMenuAnchorEl}
        open={Boolean(fileMenuAnchorEl) && activeFileMenuId !== 'sort'}
        onClose={handleCloseFileMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => activeFileMenuId && handleOpenRenameDialog(activeFileMenuId, {} as React.MouseEvent)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename / Assign ID</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => activeFileMenuId && handleDownloadFile(activeFileMenuId)}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => activeFileMenuId && handleDeleteConfirm(activeFileMenuId)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Project Dialog */}
      <Dialog open={isProjectDialogOpen} onClose={() => setProjectDialogOpen(false)}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a name for your new project. This will be a collection of your evidence files and notes.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateProject} 
            disabled={!newProjectName.trim()}
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename File Dialog */}
      <RenameFileDialog
        open={renameFileDialogOpen}
        fileId={fileToRename}
        onClose={() => {
          setRenameFileDialogOpen(false);
          setFileToRename(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this file? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteFile} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Success is handled via the NotificationProvider */}
    </Box>
  );
};

export default LeftPanel; 