import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Autocomplete,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useAppStore from '../../store';
import supabaseClient from '../../services/supabaseClient';

interface EntityOption {
  entity_text: string;
  entity_type: string;
}

const AdvancedSearchFilters = () => {
  const [availableFileTypes, setAvailableFileTypes] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableEntities, setAvailableEntities] = useState<EntityOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use individual selectors instead of object destructuring
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const searchFilters = useAppStore((state) => state.searchFilters);
  const setSearchFilters = useAppStore((state) => state.setSearchFilters);
  const resetSearchFilters = useAppStore((state) => state.resetSearchFilters);

  // Load available filter options when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchFilterOptions();
    }
  }, [selectedProjectId]);

  // Fetch available filter options from the database
  const fetchFilterOptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch file types
      const { data: fileTypesData, error: fileTypesError } = await supabaseClient
        .from('files')
        .select('content_type, file_type')
        .eq('project_id', selectedProjectId)
        .not('content_type', 'is', null);
      
      if (fileTypesError) throw fileTypesError;
      
      // Get unique file types
      const uniqueContentTypes = [...new Set(fileTypesData.map(item => item.content_type))];
      const uniqueFileTypes = [...new Set(fileTypesData.map(item => item.file_type))];
      
      // Use file_type (e.g., pdf, image, document) which is more user-friendly
      setAvailableFileTypes(uniqueFileTypes.filter(Boolean));
      
      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabaseClient
        .from('file_tags')
        .select('tag')
        .eq('project_id', selectedProjectId);
      
      if (tagsError) throw tagsError;
      
      const uniqueTags = [...new Set(tagsData.map(item => item.tag))];
      setAvailableTags(uniqueTags);
      
      // Fetch entities
      const { data: entitiesData, error: entitiesError } = await supabaseClient
        .from('entities')
        .select('entity_text, entity_type')
        .eq('project_id', selectedProjectId);
      
      if (entitiesError) throw entitiesError;
      
      setAvailableEntities(entitiesData || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      setError('Failed to load filter options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search type change
  const handleSearchTypeChange = (_, newSearchType) => {
    if (newSearchType !== null) {
      setSearchFilters({ searchType: newSearchType });
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    resetSearchFilters();
  };

  // Apply filters
  const applyFilters = () => {
    // Additional logic if needed before applying filters
    // Filters are automatically applied through state
  };

  // Handle date range changes
  const handleDateFromChange = (date: Date | null) => {
    // Cast to ensure compatibility with the type
    setSearchFilters({ dateFrom: date as any });
  };

  const handleDateToChange = (date: Date | null) => {
    // Cast to ensure compatibility with the type
    setSearchFilters({ dateTo: date as any });
  };

  // Group entities by type for easier selection
  const groupedEntities = availableEntities.reduce((acc, entity) => {
    if (!acc[entity.entity_type]) {
      acc[entity.entity_type] = [];
    }
    acc[entity.entity_type].push(entity.entity_text);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Stack spacing={2}>
        {/* Search Type */}
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            Search Type
          </Typography>
          <ToggleButtonGroup
            value={searchFilters.searchType || 'combined'}
            exclusive
            onChange={handleSearchTypeChange}
            size="small"
            fullWidth
          >
            <ToggleButton value="keyword">Keyword</ToggleButton>
            <ToggleButton value="semantic">Semantic</ToggleButton>
            <ToggleButton value="combined">Combined</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* File Type */}
        {isLoading ? (
          <Skeleton variant="rectangular" height={56} />
        ) : (
          <Autocomplete
            multiple
            size="small"
            options={availableFileTypes}
            value={searchFilters.fileTypes || []}
            onChange={(_, newValue) => {
              setSearchFilters({ fileTypes: newValue });
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="File Types"
                placeholder="Select file types"
              />
            )}
          />
        )}

        {/* Tags */}
        {isLoading ? (
          <Skeleton variant="rectangular" height={56} />
        ) : (
          <Autocomplete
            multiple
            size="small"
            options={availableTags}
            value={searchFilters.tags || []}
            onChange={(_, newValue) => {
              setSearchFilters({ tags: newValue });
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Select tags"
              />
            )}
          />
        )}

        {/* Entities */}
        {isLoading ? (
          <Skeleton variant="rectangular" height={56} />
        ) : (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Entities
            </Typography>
            
            {Object.keys(groupedEntities).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                No entities available for this project yet
              </Typography>
            ) : (
              <Stack spacing={1}>
                {Object.entries(groupedEntities).map(([entityType, entities]) => (
                  <Autocomplete
                    key={entityType}
                    multiple
                    size="small"
                    options={entities}
                    value={searchFilters.entities?.filter(e => 
                      availableEntities.some(ae => 
                        ae.entity_text === e && ae.entity_type === entityType
                      )
                    ) || []}
                    onChange={(_, newValue) => {
                      // Merge with existing entities of different types
                      const otherEntities = (searchFilters.entities || []).filter(e => 
                        !availableEntities.some(ae => 
                          ae.entity_text === e && ae.entity_type === entityType
                        )
                      );
                      setSearchFilters({ 
                        entities: [...otherEntities, ...newValue]
                      });
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={entityType.replace('_', ' ')}
                        placeholder={`Select ${entityType.replace('_', ' ')}`}
                        InputLabelProps={{
                          sx: { textTransform: 'capitalize' }
                        }}
                      />
                    )}
                  />
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Date Range */}
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            Date Range
          </Typography>
          <Stack direction="row" spacing={2}>
            <DatePicker
              label="From Date"
              value={searchFilters.dateFrom}
              onChange={handleDateFromChange}
              slotProps={{ 
                textField: { 
                  size: 'small', 
                  fullWidth: true,
                  placeholder: 'Start date'
                } 
              }}
            />
            <DatePicker
              label="To Date"
              value={searchFilters.dateTo}
              onChange={handleDateToChange}
              slotProps={{ 
                textField: { 
                  size: 'small', 
                  fullWidth: true,
                  placeholder: 'End date'
                } 
              }}
            />
          </Stack>
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleResetFilters}
            fullWidth
          >
            Reset All
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={applyFilters}
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Apply Filters
          </Button>
        </Stack>
        
        {/* Active Filters Summary */}
        {((searchFilters.fileTypes?.length || 0) > 0 || 
          (searchFilters.tags?.length || 0) > 0 || 
          (searchFilters.entities?.length || 0) > 0 || 
          searchFilters.dateFrom || 
          searchFilters.dateTo) && (
          <Box sx={{ mt: 1 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Active Filters:
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              {(searchFilters.fileTypes?.length || 0) > 0 && (
                <Chip 
                  size="small" 
                  label={`${searchFilters.fileTypes?.length} file types`} 
                  variant="outlined" 
                  color="primary"
                />
              )}
              {(searchFilters.tags?.length || 0) > 0 && (
                <Chip 
                  size="small" 
                  label={`${searchFilters.tags?.length} tags`} 
                  variant="outlined" 
                  color="primary"
                />
              )}
              {(searchFilters.entities?.length || 0) > 0 && (
                <Chip 
                  size="small" 
                  label={`${searchFilters.entities?.length} entities`} 
                  variant="outlined" 
                  color="primary"
                />
              )}
              {searchFilters.dateFrom && (
                <Chip 
                  size="small" 
                  label={`From: ${new Date(searchFilters.dateFrom).toLocaleDateString()}`} 
                  variant="outlined" 
                  color="primary"
                />
              )}
              {searchFilters.dateTo && (
                <Chip 
                  size="small" 
                  label={`To: ${new Date(searchFilters.dateTo).toLocaleDateString()}`} 
                  variant="outlined" 
                  color="primary"
                />
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default AdvancedSearchFilters; 