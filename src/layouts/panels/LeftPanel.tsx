import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, List, ListItemButton, Divider, TextField, Paper, IconButton, Badge, InputAdornment, useTheme, Tooltip } from '@mui/material';
import { Collapse, Fade } from '../../components/SafeTransitions';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useProjectStore } from '../../store';
import { Project, File, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';
import { useFiles } from '../../hooks/useFiles';
import { useAdvancedSearch, SearchFilters } from '../../hooks/useAdvancedSearch';
import { useCollaborators } from '../../hooks/useCollaborators';
import FileUpload from '../../components/FileUpload';
import FileListItem from '../../components/FileListItem';
import CreateProjectModal from '../../components/CreateProjectModal';
import InviteClientDialog from '../../components/InviteClientDialog';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import EnhancedTooltip from '../../components/EnhancedTooltip';
import AdvancedSearchFilters from '../../components/AdvancedSearchFilters';
import { transitions, cssTransitions } from '../../utils/transitions';
import { useLayoutStore } from '../../store/layoutStore';
import { supabase } from '../../supabaseClient';
import PanelCollapseButton from '../../components/PanelCollapseButton';

// Define acceptable file types
const ACCEPTED_FILE_TYPES = 'image/*,video/*,audio/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * LeftPanel - The left navigation panel containing projects and files
 */
const LeftPanel: React.FC = () => {
    const { selectedProjectId, setSelectedProjectId } = useProjectStore();
    const { user, setCurrentProjectRole, isProjectOwner, isClientUploader } = useAuth();
    const { projects, loading: projectsLoading, error: projectsError } = useProjects();
    const { files: regularFiles, loading: regularFilesLoading, error: regularFilesError } = useFiles(selectedProjectId);
    const { 
        leftPanelWidth,
        isLeftPanelCollapsed,
        toggleLeftPanelCollapse 
    } = useLayoutStore();
    const { collaborators } = useCollaborators({ projectId: selectedProjectId });
    const theme = useTheme();
    
    // Advanced search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
    const [searchFilters, setSearchFilters] = useState<SearchFilters | undefined>(undefined);
    const { 
        files: searchResults, 
        totalCount, 
        loading: searchLoading, 
        error: searchError,
        searchFiles,
        clearSearch,
        updateFilters,
        updateQueryText,
        hasActiveFilters
    } = useAdvancedSearch();
    
    const [showProjectList, setShowProjectList] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (selectedProjectId) {
            if (query.trim() !== '') {
                // Execute search with query
                updateQueryText(query);
            } else if (!hasActiveFilters) {
                // Clear search if query is empty and no other filters are active
                clearSearch();
            } else {
                // Just update the query text if there are other active filters
                updateQueryText('');
            }
        }
    };
    
    // Handle search clear button
    const handleClearSearch = () => {
        setSearchQuery('');
        if (hasActiveFilters) {
            updateQueryText('');
        } else {
            clearSearch();
        }
    };
    
    // Toggle filters panel
    const toggleFiltersPanel = () => {
        setIsFiltersPanelOpen(!isFiltersPanelOpen);
    };
    
    // Handle filter updates
    const handleUpdateFilters = (filters: Partial<SearchFilters>) => {
        setSearchFilters(prev => ({
            ...prev,
            ...filters
        }));
        
        updateFilters(filters);
    };
    
    // Clear all filters
    const handleClearFilters = () => {
        setSearchFilters(undefined);
        setSearchQuery('');
        clearSearch();
    };
    
    // When project changes, reset search and filters
    useEffect(() => {
        setSearchQuery('');
        setSearchFilters(undefined);
        clearSearch();
        setIsFiltersPanelOpen(false);
    }, [selectedProjectId, clearSearch]);
    
    // Trigger search when project is selected and there's a query or filters
    useEffect(() => {
        if (selectedProjectId && (searchQuery.trim() !== '' || searchFilters)) {
            searchFiles({
                projectId: selectedProjectId,
                queryText: searchQuery,
                filters: searchFilters
            });
        }
    }, [selectedProjectId, searchQuery, searchFilters, searchFiles]);

    // Determine the user's role for the current project
    useEffect(() => {
        if (!selectedProjectId || !user) {
            setCurrentProjectRole(null);
            return;
        }

        const checkUserRole = async () => {
            try {
                // Check if the user is the project owner
                const { data: project, error: projectError } = await supabase!
                    .from('projects')
                    .select('owner_id')
                    .eq('id', selectedProjectId)
                    .single();

                if (projectError) {
                    console.error('Error checking project owner:', projectError);
                    setCurrentProjectRole(null);
                    return;
                }

                if (project && project.owner_id === user.id) {
                    setCurrentProjectRole(UserRole.OWNER);
                    return;
                }

                // Check if the user is a collaborator
                const { data: collaborator, error: collabError } = await supabase!
                    .from('project_collaborators')
                    .select('role, status')
                    .eq('project_id', selectedProjectId)
                    .eq('user_id', user.id)
                    .eq('status', 'accepted')
                    .single();

                if (collabError) {
                    console.error('Error checking collaborator role:', collabError);
                    setCurrentProjectRole(null);
                    return;
                }

                if (collaborator) {
                    setCurrentProjectRole(collaborator.role as UserRole);
                } else {
                    setCurrentProjectRole(null);
                }
            } catch (err) {
                console.error('Error determining user role:', err);
                setCurrentProjectRole(null);
            }
        };

        checkUserRole();
    }, [selectedProjectId, user, setCurrentProjectRole]);

    // Handlers
    const handleCreateProject = () => {
        setIsCreateModalOpen(true);
    };

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
    };

    const handleInviteClient = () => {
        setIsInviteModalOpen(true);
    };

    const handleInviteModalClose = () => {
        setIsInviteModalOpen(false);
    };

    const handleSelectProject = (id: string) => {
        setSelectedProjectId(id);
    };

    // Find current project
    const currentProject = projects?.find((p: Project) => p.id === selectedProjectId);
    
    // Determine which files to display based on search state
    const isSearchActive = searchQuery.trim() !== '' || hasActiveFilters;
    const loading = isSearchActive ? searchLoading : regularFilesLoading;
    const error = isSearchActive ? searchError : regularFilesError;
    
    // Use search results if search is active, otherwise use regular files
    const displayFiles = isSearchActive 
        ? searchResults 
        : regularFiles?.filter((file: File) => 
            file.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
    
    const fileCount = isSearchActive ? totalCount : displayFiles?.length || 0;

    return (
        <Box sx={{ position: 'relative' }}>
            {/* Collapse/Expand Button */}
            <PanelCollapseButton 
                isCollapsed={isLeftPanelCollapsed}
                onToggle={toggleLeftPanelCollapse}
                position="left"
            />
            
        <Paper
            elevation={2}
            sx={{
                    width: isLeftPanelCollapsed ? 0 : leftPanelWidth,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 0, // Remove border radius for panels
                    transition: isLeftPanelCollapsed ? cssTransitions.medium : cssTransitions.ultraFast,
                    opacity: isLeftPanelCollapsed ? 0 : 1,
                    visibility: isLeftPanelCollapsed ? 'hidden' : 'visible',
            }}
        >
            {/* Project Section */}
            <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: (theme) => theme.palette.background.default,
             }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 1,
                    cursor: 'pointer',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                }}
                onClick={() => setShowProjectList(!showProjectList)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle1" fontWeight={500} sx={{ flexGrow: 1 }}>
                            {currentProject?.name || 'Select a Project'}
                        </Typography>
                    </Box>
                    <EnhancedTooltip title={showProjectList ? "Hide projects" : "Show projects"}>
                        <IconButton 
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent the parent onClick from firing
                                setShowProjectList(!showProjectList);
                            }}
                        >
                            {showProjectList ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </EnhancedTooltip>
                </Box>

                <Collapse in={showProjectList} timeout="auto">
                    <Box>
                        {/* Project Actions */}
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            mb: 1 
                        }}>
                            <EnhancedTooltip title="Create a new project" description="Start organizing your evidence and notes">
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleCreateProject}
                                    size="small"
                                    sx={{ flex: 1 }}
                                >
                                    New Project
                                </Button>
                            </EnhancedTooltip>

                            {isProjectOwner() && selectedProjectId && (
                                <EnhancedTooltip title="Invite a client" description="Allow a client to upload files to this project">
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        startIcon={<PersonAddIcon />}
                                        onClick={handleInviteClient}
                                        size="small"
                                    >
                                        Invite
                                    </Button>
                                </EnhancedTooltip>
                            )}
                        </Box>

                        {/* Project List */}
                        <List 
                            dense 
                            sx={{ 
                                maxHeight: 150, 
                                overflowY: 'auto', 
                                mb: 1,
                                px: 0.5,
                                '&::-webkit-scrollbar': {
                                    width: '6px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    borderRadius: '3px',
                                },
                            }}
                        >
                            {projectsLoading && (
                                <LoadingSkeleton variant="list" count={4} dense withAction={false} />
                            )}
                            
                            {!projectsLoading && projectsError && (
                                <Typography color="error" sx={{ p: 1 }}>
                                    Error loading projects. Please try again.
                                </Typography>
                            )}
                            
                            {!projectsLoading && !projectsError && projects && projects.length === 0 && (
                                <EmptyState 
                                    icon="folder" 
                                    title="No projects yet" 
                                    description="Create your first project to get started"
                                    size="small"
                                />
                            )}
                            
                            {!projectsLoading && !projectsError && projects && projects.map((project: Project) => {
                                // Check if this is a collaborated project
                                const isCollaborated = collaborators?.some(c => 
                                    c.project_id === project.id && c.user_id === user?.id
                                );
                                
                                return (
                                    <ListItemButton
                                        key={project.id}
                                        selected={selectedProjectId === project.id}
                                        onClick={() => handleSelectProject(project.id)}
                                        sx={{ 
                                            py: 0.75,
                                            borderRadius: 1,
                                            mb: 0.5,
                                            transition: 'all 0.2s ease',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        <Typography 
                                            variant="body2" 
                                            noWrap
                                            sx={{
                                                fontWeight: selectedProjectId === project.id ? 500 : 400,
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                width: '100%',
                                            }}
                                        >
                                            {project.name}
                                            {isCollaborated && (
                                                <Tooltip title="You're a collaborator on this project">
                                                    <Badge 
                                                        color="secondary" 
                                                        variant="dot" 
                                                        sx={{ ml: 1 }}
                                                    />
                                                </Tooltip>
                                            )}
                                        </Typography>
                                    </ListItemButton>
                                );
                            })}
                        </List>
                    </Box>
                </Collapse>
            </Box>

            {/* Dropbox-like Upload Area - Only visible when project is selected */}
            {selectedProjectId && (
                <Box
                    sx={{
                        p: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                        transition: 'padding 0.3s ease'
                    }}
                >
                    <FileUpload 
                        projectId={selectedProjectId} 
                        acceptedFileTypes={ACCEPTED_FILE_TYPES}
                    />
                </Box>
            )}

            {/* File Section */}
            <Box sx={{ 
                p: 2, 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden' 
            }}>
                {/* File header with search */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    mb: 1.5 
                }}>
                    <Badge 
                        badgeContent={fileCount} 
                        color="primary"
                        sx={{
                            '& .MuiBadge-badge': {
                                fontSize: '0.7rem',
                                height: '18px',
                                minWidth: '18px',
                            }
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={500}>
                            Files
                        </Typography>
                    </Badge>
                </Box>

                {/* Search bar */}
                <Box sx={{ mb: 1.5, display: 'flex' }}>
                    <TextField
                        placeholder="Search files..."
                        variant="outlined"
                        size="small"
                        fullWidth
                        disabled={!selectedProjectId}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={handleClearSearch}
                                        edge="end"
                                        aria-label="clear search"
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                            }
                        }}
                    />
                </Box>
                
                {/* Advanced Search Filters */}
                {selectedProjectId && (
                    <AdvancedSearchFilters
                        projectId={selectedProjectId}
                        open={isFiltersPanelOpen}
                        onToggle={toggleFiltersPanel}
                        filters={searchFilters}
                        onUpdateFilters={handleUpdateFilters}
                        onClearFilters={handleClearFilters}
                    />
                )}

                {/* File list */}
                <Box sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '3px',
                    },
                }}>
                    {!selectedProjectId && (
                        <EmptyState
                            icon="upload"
                            title="Select a project"
                            description="Select a project to upload and manage files"
                            size="large"
                        />
                    )}

                    {selectedProjectId && loading && (
                        <LoadingSkeleton variant="list" count={5} withAction dense />
                    )}

                    {selectedProjectId && !loading && error && (
                        <Typography color="error" sx={{ p: 1 }}>
                            Error loading files. Please try refreshing.
                        </Typography>
                    )}

                    {selectedProjectId && !loading && !error && displayFiles && displayFiles.length === 0 && (
                        <EmptyState
                            icon={isSearchActive ? 'search' : 'upload'}
                            title={isSearchActive ? 'No matches found' : 'No files yet'}
                            description={isSearchActive 
                                ? 'Try different search terms or filters' 
                                : 'Drag files to the upload area above or use the upload button'
                            }
                            size="medium"
                            bordered
                        />
                    )}

                    <Fade in={Boolean(!loading && displayFiles && displayFiles.length > 0)} timeout={300}>
                        <List dense disablePadding sx={{ px: 0.5 }}>
                            {selectedProjectId && !loading && displayFiles && displayFiles.map((file: File) => (
                                <FileListItem 
                                    key={file.id} 
                                    file={file} 
                                    readOnly={isClientUploader()} // Client uploaders can't modify files
                                />
                            ))}
                        </List>
                    </Fade>
                </Box>
            </Box>

            {/* Project Creation Modal */}
            <CreateProjectModal
                open={isCreateModalOpen}
                onClose={handleCreateModalClose}
                onProjectCreated={() => {
                    // If this is the first project, select it automatically
                    if (!projects || projects.length === 0) {
                        setTimeout(() => {
                            // We use setTimeout to ensure the projects have been refetched
                            const newProjects = projects;
                            if (newProjects && newProjects.length > 0) {
                                setSelectedProjectId(newProjects[0].id);
                            }
                        }, 500);
                    }
                }}
            />

            {/* Client Invitation Modal */}
            {selectedProjectId && currentProject && (
                <InviteClientDialog
                    open={isInviteModalOpen}
                    onClose={handleInviteModalClose}
                    projectId={selectedProjectId}
                    projectName={currentProject.name}
                />
            )}
        </Paper>
        </Box>
    );
};

export default LeftPanel; 