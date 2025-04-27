import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

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
      id={`content-tabpanel-${index}`}
      aria-labelledby={`content-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * ContentPanel component for displaying the main content area
 */
export const ContentPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [content, setContent] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      setContent(`Search results for "${searchQuery}"...`);
      setSearching(false);
    }, 1000);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={500}>
          Content
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="content tabs"
        >
          <Tab icon={<DescriptionIcon />} label="Document" />
          <Tab icon={<SearchIcon />} label="Search" />
          <Tab icon={<FormatQuoteIcon />} label="Notes" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Document Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" paragraph>
              Select a document from the files panel to view its contents here.
            </Typography>
            <Box 
              sx={{ 
                height: 300, 
                bgcolor: 'grey.100', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1
              }}
            >
              <Typography color="text.secondary">
                No document selected
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        {/* Search Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <Button 
                      type="submit"
                      variant="contained"
                      disabled={!searchQuery || searching}
                      sx={{ ml: 1 }}
                    >
                      {searching ? <CircularProgress size={24} /> : <SearchIcon />}
                    </Button>
                  ),
                }}
                disabled={searching}
              />
            </form>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body1">
              {content || 'Enter a search query to find content across your documents.'}
            </Typography>
          </Box>
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2, height: '100%' }}>
            <TextField
              label="Case Notes"
              multiline
              fullWidth
              minRows={10}
              value={content}
              onChange={handleContentChange}
              variant="outlined"
              placeholder="Enter your case notes here..."
              sx={{ height: 'calc(100% - 60px)' }}
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary">
                Save Notes
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Box>
    </Paper>
  );
}; 