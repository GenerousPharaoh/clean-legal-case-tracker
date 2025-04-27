import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  IconButton, 
  Collapse, 
  CircularProgress, 
  Alert, 
  Chip
} from '@mui/material';
import { Suggestion } from '../services/AIService';
import { useLinkStore } from '../store/linkStore';

// Icons
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface SuggestionPanelProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  suggestions,
  isLoading,
  error,
  isOpen,
  onToggle
}) => {
  const { setActivationRequest } = useLinkStore();

  // Group suggestions by type
  const supportSuggestions = suggestions.filter(s => s.type === 'support');
  const contradictionSuggestions = suggestions.filter(s => s.type === 'contradiction');
  const questionSuggestions = suggestions.filter(s => s.type === 'question');
  const elaborateSuggestions = suggestions.filter(s => s.type === 'elaborate');

  // Handle click on a suggestion to view the source
  const handleViewSource = (suggestion: Suggestion) => {
    if (suggestion.fileId) {
      // Create activation request based on the source type
      // For PDF files, navigate to the correct page
      if (suggestion.location?.startsWith('Page')) {
        const page = parseInt(suggestion.location.replace('Page ', ''), 10);
        setActivationRequest({
          fileId: suggestion.fileId,
          page: !isNaN(page) ? page : 1,
          selectionText: suggestion.quote
        });
      } 
      // For media files, navigate to the timestamp
      else if (suggestion.location?.includes(':')) {
        const [minutes, seconds] = suggestion.location.split(':').map(part => parseInt(part, 10));
        const timestamp = (isNaN(minutes) ? 0 : minutes * 60) + (isNaN(seconds) ? 0 : seconds);
        setActivationRequest({
          fileId: suggestion.fileId,
          timestamp
        });
      }
      // Default case, just open the file
      else {
        setActivationRequest({
          fileId: suggestion.fileId
        });
      }
    }
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'support':
        return <CheckCircleOutlineIcon color="success" />;
      case 'contradiction':
        return <WarningAmberIcon color="warning" />;
      case 'question':
        return <HelpOutlineIcon color="info" />;
      case 'elaborate':
        return <EditNoteIcon color="action" />;
      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={1}
      sx={{
        width: '100%',
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'height 0.3s ease',
        borderRadius: 0
      }}
    >
      {/* Header with toggle */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          px: 2,
          backgroundColor: 'background.default',
          borderBottom: isOpen ? '1px solid' : 'none',
          borderColor: 'divider',
          cursor: 'pointer'
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={500}>
            Writing Analysis
          </Typography>
          {isLoading && (
            <CircularProgress 
              size={18} 
              sx={{ ml: 1.5 }} 
              color="primary" 
            />
          )}
          {suggestions.length > 0 && isOpen && (
            <Chip 
              label={suggestions.length} 
              size="small" 
              color="primary" 
              sx={{ ml: 1.5, height: 22 }} 
            />
          )}
        </Box>
        <IconButton 
          size="small" 
          sx={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}
        >
          {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Content area */}
      <Collapse in={isOpen}>
        <Box sx={{ p: 2, maxHeight: '400px', overflowY: 'auto' }}>
          {/* Loading state */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Empty state */}
          {!isLoading && !error && suggestions.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Select some text and click "Analyze Section" to get suggestions based on project evidence.
            </Alert>
          )}

          {/* Suggestion lists grouped by type */}
          {!isLoading && !error && suggestions.length > 0 && (
            <Box>
              {/* Supporting Evidence */}
              {supportSuggestions.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
                    Supporting Evidence
                  </Typography>
                  <List dense disablePadding>
                    {supportSuggestions.map((suggestion, index) => (
                      <React.Fragment key={`support-${index}`}>
                        <ListItem 
                          alignItems="flex-start"
                          secondaryAction={
                            suggestion.fileId && (
                              <IconButton 
                                edge="end" 
                                size="small"
                                onClick={() => handleViewSource(suggestion)}
                                sx={{ 
                                  color: 'primary.main',
                                  '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            )
                          }
                        >
                          <ListItemIcon sx={{ minWidth: '32px' }}>
                            {getSuggestionIcon(suggestion.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={suggestion.text}
                            secondary={
                              suggestion.quote && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ 
                                    mt: 0.5,
                                    p: 1,
                                    backgroundColor: 'action.hover',
                                    borderLeft: '3px solid',
                                    borderColor: 'success.main',
                                    borderRadius: '0 4px 4px 0',
                                    fontStyle: 'italic'
                                  }}
                                >
                                  "{suggestion.quote}"
                                  {suggestion.location && (
                                    <Chip
                                      label={suggestion.location}
                                      size="small"
                                      variant="outlined"
                                      color="success"
                                      sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Typography>
                              )
                            }
                          />
                        </ListItem>
                        {index < supportSuggestions.length - 1 && (
                          <Divider variant="inset" component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}

              {/* Contradicting Evidence */}
              {contradictionSuggestions.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <WarningAmberIcon color="warning" sx={{ mr: 1 }} />
                    Potential Contradictions
                  </Typography>
                  <List dense disablePadding>
                    {contradictionSuggestions.map((suggestion, index) => (
                      <React.Fragment key={`contradiction-${index}`}>
                        <ListItem 
                          alignItems="flex-start"
                          secondaryAction={
                            suggestion.fileId && (
                              <IconButton 
                                edge="end" 
                                size="small"
                                onClick={() => handleViewSource(suggestion)}
                                sx={{ 
                                  color: 'primary.main',
                                  '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            )
                          }
                        >
                          <ListItemIcon sx={{ minWidth: '32px' }}>
                            {getSuggestionIcon(suggestion.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={suggestion.text}
                            secondary={
                              suggestion.quote && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ 
                                    mt: 0.5,
                                    p: 1,
                                    backgroundColor: 'action.hover',
                                    borderLeft: '3px solid',
                                    borderColor: 'warning.main',
                                    borderRadius: '0 4px 4px 0',
                                    fontStyle: 'italic'
                                  }}
                                >
                                  "{suggestion.quote}"
                                  {suggestion.location && (
                                    <Chip
                                      label={suggestion.location}
                                      size="small"
                                      variant="outlined"
                                      color="warning"
                                      sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Typography>
                              )
                            }
                          />
                        </ListItem>
                        {index < contradictionSuggestions.length - 1 && (
                          <Divider variant="inset" component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}

              {/* Questions to Consider */}
              {questionSuggestions.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <HelpOutlineIcon color="info" sx={{ mr: 1 }} />
                    Questions to Consider
                  </Typography>
                  <List dense disablePadding>
                    {questionSuggestions.map((suggestion, index) => (
                      <React.Fragment key={`question-${index}`}>
                        <ListItem alignItems="flex-start">
                          <ListItemIcon sx={{ minWidth: '32px' }}>
                            {getSuggestionIcon(suggestion.type)}
                          </ListItemIcon>
                          <ListItemText primary={suggestion.text} />
                        </ListItem>
                        {index < questionSuggestions.length - 1 && (
                          <Divider variant="inset" component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}

              {/* Areas to Elaborate */}
              {elaborateSuggestions.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <EditNoteIcon color="action" sx={{ mr: 1 }} />
                    Areas to Elaborate
                  </Typography>
                  <List dense disablePadding>
                    {elaborateSuggestions.map((suggestion, index) => (
                      <React.Fragment key={`elaborate-${index}`}>
                        <ListItem alignItems="flex-start">
                          <ListItemIcon sx={{ minWidth: '32px' }}>
                            {getSuggestionIcon(suggestion.type)}
                          </ListItemIcon>
                          <ListItemText primary={suggestion.text} />
                        </ListItem>
                        {index < elaborateSuggestions.length - 1 && (
                          <Divider variant="inset" component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SuggestionPanel; 