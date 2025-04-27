import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Collapse, 
  Paper, 
  Chip, 
  Button, 
  IconButton, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  Autocomplete, 
  TextField, 
  Stack,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { format } from 'date-fns';

import { supabase } from '../supabaseClient';
import { SearchFilters, EntityFilter } from '../hooks/useAdvancedSearch';
import { FileType } from '../store';

interface AdvancedSearchFiltersProps {
  projectId: string | null;
  open: boolean;
  onToggle: () => void;
  filters: SearchFilters | undefined;
  onUpdateFilters: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
}

// Define entity type options
const ENTITY_TYPES = [
  { value: 'PERSON', label: 'Person' },
  { value: 'ORG', label: 'Organization' },
  { value: 'DATE', label: 'Date' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'LEGAL_TERM', label: 'Legal Term' },
];

// Define file type options based on the FileType enum
const FILE_TYPE_OPTIONS = Object.values(FileType).map(type => ({
  value: type,
  label: type.charAt(0).toUpperCase() + type.slice(1)
}));

// Define search type options
const SEARCH_TYPE_OPTIONS = [
  { value: 'keyword', label: 'Keyword' },
  { value: 'semantic', label: 'Semantic' },
  { value: 'combined', label: 'Combined' },
];

const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  projectId,
  open,
  onToggle,
  filters,
  onUpdateFilters,
  onClearFilters,
}) => {
  // Local state for form inputs
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedFileTypes, setSelectedFileTypes] = useState<FileType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<EntityFilter[]>([]);
  const [searchType, setSearchType] = useState<'keyword' | 'semantic' | 'combined'>('combined');
  
  // State for available tags and entities to select from
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableEntities, setAvailableEntities] = useState<EntityFilter[]>([]);
  
  // Update local state when filters prop changes
  useEffect(() => {
    if (filters) {
      if (filters.dateRange) {
        setStartDate(filters.dateRange.start ? new Date(filters.dateRange.start) : null);
        setEndDate(filters.dateRange.end ? new Date(filters.dateRange.end) : null);
      }
      setSelectedFileTypes(filters.fileTypes || []);
      setSelectedTags(filters.tags || []);
      setSelectedEntities(filters.entities || []);
      setSearchType(filters.searchType || 'combined');
    } else {
      // Reset local state when filters are cleared
      setStartDate(null);
      setEndDate(null);
      setSelectedFileTypes([]);
      setSelectedTags([]);
      setSelectedEntities([]);
      setSearchType('combined');
    }
  }, [filters]);
  
  // Fetch available tags and entities when project changes
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!projectId) return;
      
      // Fetch available tags
      try {
        const { data: filesData, error: filesError } = await supabase
          .from('files')
          .select('metadata')
          .eq('project_id', projectId)
          .not('metadata->tags', 'is', null);
        
        if (!filesError && filesData) {
          const allTags: string[] = [];
          filesData.forEach(file => {
            if (file.metadata?.tags && Array.isArray(file.metadata.tags)) {
              file.metadata.tags.forEach((tag: string) => {
                if (!allTags.includes(tag)) {
                  allTags.push(tag);
                }
              });
            }
          });
          setAvailableTags(allTags);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
      
      // Fetch available entities
      try {
        const { data: entitiesData, error: entitiesError } = await supabase
          .from('entities')
          .select('entity_text, entity_type')
          .eq('project_id', projectId)
          .limit(100); // Limit to avoid too many options
        
        if (!entitiesError && entitiesData) {
          const uniqueEntities = entitiesData.reduce((acc: EntityFilter[], entity) => {
            // Check if entity already exists in accumulator
            const exists = acc.some(e => 
              e.text.toLowerCase() === entity.entity_text.toLowerCase() && 
              e.type === entity.entity_type
            );
            
            if (!exists) {
              acc.push({
                text: entity.entity_text,
                type: entity.entity_type
              });
            }
            
            return acc;
          }, []);
          
          setAvailableEntities(uniqueEntities);
        }
      } catch (error) {
        console.error('Error fetching entities:', error);
      }
    };
    
    fetchFilterOptions();
  }, [projectId]);
  
  // Handle date changes
  const handleDateChange = (startOrEnd: 'start' | 'end', date: Date | null) => {
    if (startOrEnd === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    
    // Update filters
    onUpdateFilters({
      dateRange: {
        start: startOrEnd === 'start' 
          ? date ? format(date, 'yyyy-MM-dd') : undefined 
          : filters?.dateRange?.start,
        end: startOrEnd === 'end' 
          ? date ? format(date, 'yyyy-MM-dd') : undefined 
          : filters?.dateRange?.end
      }
    });
  };
  
  // Handle file type selection
  const handleFileTypeChange = (fileType: FileType) => {
    const newSelectedFileTypes = selectedFileTypes.includes(fileType)
      ? selectedFileTypes.filter(type => type !== fileType)
      : [...selectedFileTypes, fileType];
    
    setSelectedFileTypes(newSelectedFileTypes);
    onUpdateFilters({ fileTypes: newSelectedFileTypes.length > 0 ? newSelectedFileTypes : undefined });
  };
  
  // Handle tag selection
  const handleTagsChange = (_event: React.SyntheticEvent, newTags: string[]) => {
    setSelectedTags(newTags);
    onUpdateFilters({ tags: newTags.length > 0 ? newTags : undefined });
  };
  
  // Handle entity selection
  const handleEntitiesChange = (_event: React.SyntheticEvent, newEntities: EntityFilter[]) => {
    setSelectedEntities(newEntities);
    onUpdateFilters({ entities: newEntities.length > 0 ? newEntities : undefined });
  };
  
  // Handle search type selection
  const handleSearchTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newType = event.target.value as 'keyword' | 'semantic' | 'combined';
    setSearchType(newType);
    onUpdateFilters({ searchType: newType });
  };
  
  // Count active filters
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (startDate || endDate) count++;
    if (selectedFileTypes.length > 0) count++;
    if (selectedTags.length > 0) count++;
    if (selectedEntities.length > 0) count++;
    if (searchType !== 'combined') count++;
    return count;
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      {/* Filter toggle button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Button
          size="small"
          startIcon={<FilterListIcon />}
          onClick={onToggle}
          color="primary"
          variant={open ? "contained" : "outlined"}
          sx={{ borderRadius: 2 }}
        >
          Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
        </Button>
        
        {getActiveFilterCount() > 0 && (
          <Button 
            size="small" 
            startIcon={<ClearIcon />} 
            onClick={onClearFilters}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Clear All
          </Button>
        )}
      </Box>
      
      {/* Filter panel */}
      <Collapse in={open} timeout="auto">
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={2}>
              {/* Date Range Filter */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Date Range</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <DatePicker
                    label="From"
                    value={startDate}
                    onChange={(date) => handleDateChange('start', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DatePicker
                    label="To"
                    value={endDate}
                    onChange={(date) => handleDateChange('end', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Box>
              </Box>
              
              <Divider />
              
              {/* File Type Filter */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>File Types</Typography>
                <FormGroup row>
                  {FILE_TYPE_OPTIONS.map(option => (
                    <FormControlLabel
                      key={option.value}
                      control={
                        <Checkbox
                          checked={selectedFileTypes.includes(option.value)}
                          onChange={() => handleFileTypeChange(option.value)}
                          size="small"
                        />
                      }
                      label={option.label}
                    />
                  ))}
                </FormGroup>
              </Box>
              
              <Divider />
              
              {/* Tags Filter */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Tags</Typography>
                <Autocomplete
                  multiple
                  options={availableTags}
                  freeSolo
                  value={selectedTags}
                  onChange={handleTagsChange}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      variant="outlined" 
                      placeholder="Select or enter tags" 
                      size="small"
                    />
                  )}
                  size="small"
                />
              </Box>
              
              <Divider />
              
              {/* Entities Filter */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Entities</Typography>
                <Autocomplete
                  multiple
                  options={availableEntities}
                  getOptionLabel={(option) => `${option.text} (${option.type})`}
                  value={selectedEntities}
                  onChange={handleEntitiesChange}
                  groupBy={(option) => option.type}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      variant="outlined" 
                      placeholder="Select entities" 
                      size="small"
                    />
                  )}
                  size="small"
                />
              </Box>
              
              <Divider />
              
              {/* Search Type Selection */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Search Method</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={searchType}
                    onChange={(e) => handleSearchTypeChange(e as any)}
                    displayEmpty
                  >
                    {SEARCH_TYPE_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </LocalizationProvider>
        </Paper>
      </Collapse>
      
      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {/* Date Range Chip */}
          {(startDate || endDate) && (
            <Chip
              label={`Date: ${startDate ? format(startDate, 'MMM d, yyyy') : 'Any'} - ${endDate ? format(endDate, 'MMM d, yyyy') : 'Now'}`}
              onDelete={() => onUpdateFilters({ dateRange: undefined })}
              size="small"
            />
          )}
          
          {/* File Types Chips */}
          {selectedFileTypes.map(fileType => (
            <Chip
              key={fileType}
              label={`Type: ${fileType.charAt(0).toUpperCase() + fileType.slice(1)}`}
              onDelete={() => handleFileTypeChange(fileType)}
              size="small"
            />
          ))}
          
          {/* Tags Chips */}
          {selectedTags.map(tag => (
            <Chip
              key={tag}
              label={`Tag: ${tag}`}
              onDelete={() => {
                const newTags = selectedTags.filter(t => t !== tag);
                setSelectedTags(newTags);
                onUpdateFilters({ tags: newTags.length > 0 ? newTags : undefined });
              }}
              size="small"
            />
          ))}
          
          {/* Entity Chips */}
          {selectedEntities.map((entity, index) => (
            <Chip
              key={`${entity.type}-${entity.text}-${index}`}
              label={`${entity.type}: ${entity.text}`}
              onDelete={() => {
                const newEntities = selectedEntities.filter((_, i) => i !== index);
                setSelectedEntities(newEntities);
                onUpdateFilters({ entities: newEntities.length > 0 ? newEntities : undefined });
              }}
              size="small"
            />
          ))}
          
          {/* Search Type Chip */}
          {searchType !== 'combined' && (
            <Chip
              label={`Search: ${SEARCH_TYPE_OPTIONS.find(opt => opt.value === searchType)?.label}`}
              onDelete={() => {
                setSearchType('combined');
                onUpdateFilters({ searchType: 'combined' });
              }}
              size="small"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default AdvancedSearchFilters; 