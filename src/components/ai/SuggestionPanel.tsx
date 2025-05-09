import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Link,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Alert,
  Skeleton,
  TextField,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AutoAwesome as AutoAwesomeIcon,
  ContentCopy as CopyIcon,
  FormatQuote as QuoteIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Psychology as PsychologyIcon,
  Help as HelpIcon,
  Error as ErrorIcon,
  Check as CheckIcon,
  HistoryEdu as HistoryEduIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import useAppStore from '../../store';
import supabaseClient from '../../services/supabaseClient';
import { AiSuggestionResponse } from '../../types';
import { debounce } from 'lodash';

interface SuggestionPanelProps {
  content: string;
}

interface SuggestionCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

// Define suggestion categories with consistent styling and icons
const SUGGESTION_CATEGORIES: Record<string, SuggestionCategory> = {
  support: {
    id: 'support',
    label: 'Supporting Evidence',
    icon: <CheckIcon />,
    color: '#4caf50',
  },
  contradiction: {
    id: 'contradiction',
    label: 'Contradictory Evidence',
    icon: <ErrorIcon />,
    color: '#f44336',
  },
  question: {
    id: 'question',
    label: 'Questions to Address',
    icon: <HelpIcon />,
    color: '#ff9800',
  },
  elaborate: {
    id: 'elaborate',
    label: 'Elaboration Suggestions',
    icon: <LightbulbIcon />,
    color: '#2196f3',
  },
  insight: {
    id: 'insight',
    label: 'Key Insights',
    icon: <PsychologyIcon />,
    color: '#9c27b0',
  },
  precedent: {
    id: 'precedent',
    label: 'Relevant Precedents',
    icon: <HistoryEduIcon />,
    color: '#795548',
  },
};

// Default categories to show when no content is provided
const DEFAULT_CATEGORIES = ['support', 'contradiction', 'question', 'elaborate'];

const SuggestionPanel = ({ content }: SuggestionPanelProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({});
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const setLinkActivation = useAppStore((state) => state.setLinkActivation);

  // Group suggestions by category for tabbed display
  const groupedSuggestions = suggestions?.suggestions?.reduce((acc, suggestion) => {
    const category = suggestion.category.toLowerCase();
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(suggestion);
    return acc;
  }, {} as Record<string, any[]>) || {};

  // Get all available categories from suggestions
  const availableCategories = Object.keys(groupedSuggestions).length > 0
    ? Object.keys(groupedSuggestions)
    : DEFAULT_CATEGORIES;

  // Set initial active category when suggestions change
  useEffect(() => {
    if (availableCategories.length > 0 && !activeCategory) {
      setActiveCategory(availableCategories[0]);
    }
  }, [availableCategories, activeCategory]);

  // Create debounced analysis function to avoid excessive API calls
  const debouncedAnalyze = useCallback(
    debounce((textContent: string) => {
      if (textContent.length >= 100) {
        generateSuggestions(textContent);
      }
    }, 2000),
    [selectedProjectId]
  );

  // Generate suggestions when the content changes (with debounce)
  useEffect(() => {
    if (!selectedProjectId || !content) {
      return;
    }

    debouncedAnalyze(content);

    return () => {
      debouncedAnalyze.cancel();
    };
  }, [content, selectedProjectId, debouncedAnalyze]);

  // Generate AI suggestions
  const generateSuggestions = async (textContent: string = content) => {
    if (!selectedProjectId || !textContent) return;

    try {
      setLoading(true);
      setError(null);

      const response = await supabaseClient.functions.invoke('analyze-writing-context', {
        body: {
          projectId: selectedProjectId,
          currentText: textContent,
          customPrompt: tabValue === 1 ? customPrompt : undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setSuggestions(response.data as AiSuggestionResponse);
      
      // Reset to the first category tab if we're on the suggestions tab
      if (tabValue === 0 && response.data?.suggestions?.length > 0) {
        const categories = Array.from(new Set(response.data.suggestions.map(s => s.category.toLowerCase())));
        if (categories.length > 0) {
          setActiveCategory(categories[0]);
        }
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError('Failed to generate suggestions. Please try again.');
    } finally {
      setLoading(false);
      setIsGeneratingCustom(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    generateSuggestions();
  };

  // Handle custom prompt generation
  const handleGenerateCustom = () => {
    if (!customPrompt.trim()) return;
    
    setIsGeneratingCustom(true);
    generateSuggestions(content);
  };

  // Handle clicking on a link suggestion
  const handleLinkClick = (linkData: any) => {
    try {
      const parsedLink = JSON.parse(linkData);
      if (parsedLink.fileId) {
        setLinkActivation(parsedLink);
      }
    } catch (e) {
      console.error('Invalid link data:', e);
    }
  };

  // Handle category tab change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle feedback submission
  const handleSendFeedback = (suggestionText: string, isHelpful: boolean) => {
    // In a real implementation, you would send this feedback to your backend
    console.log('Feedback:', { suggestion: suggestionText, isHelpful });
    
    // For now, just record that feedback was sent for this suggestion
    setFeedbackSent({
      ...feedbackSent,
      [suggestionText]: true
    });
  };

  // Copy suggestion to clipboard
  const handleCopySuggestion = (text: string) => {
    // Strip any link placeholders like [LINK:...]
    const cleanText = text.replace(/\[LINK:.*?\]/g, '');
    navigator.clipboard.writeText(cleanText);
  };

  // Render suggestion content with clickable links
  const renderSuggestionContent = (text: string) => {
    // Check if text contains citation placeholders like [LINK:{"fileId":"xxx","page":1}]
    const linkRegex = /\[LINK:(.*?)\]/g;
    
    if (!linkRegex.test(text)) {
      return <Typography variant="body2">{text}</Typography>;
    }
    
    // Split text by link placeholders and render with clickable links
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    linkRegex.lastIndex = 0; // Reset regex state
    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <Typography key={`text-${lastIndex}`} variant="body2" component="span">
            {text.substring(lastIndex, match.index)}
          </Typography>
        );
      }
      
      try {
        const linkData = match[1];
        const linkObj = JSON.parse(linkData);
        
        const exhibitId = linkObj.exhibitId || 'Exhibit';
        
        parts.push(
          <Chip
            key={`link-${match.index}`}
            label={exhibitId}
            size="small"
            color="primary"
            variant="outlined"
            onClick={() => handleLinkClick(linkData)}
            sx={{ mx: 0.5, height: 20, cursor: 'pointer' }}
          />
        );
      } catch (e) {
        parts.push(
          <Typography key={`invalid-${match.index}`} variant="body2" component="span">
            {match[0]}
          </Typography>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push(
        <Typography key={`text-${lastIndex}`} variant="body2" component="span">
          {text.substring(lastIndex)}
        </Typography>
      );
    }
    
    return <Box sx={{ display: 'inline' }}>{parts}</Box>;
  };

  // Get the current category's styling
  const getCurrentCategory = () => {
    if (!activeCategory) return null;
    
    // Try to match the category to our predefined ones, or use a default
    const normalizedCategory = activeCategory.toLowerCase();
    
    return Object.values(SUGGESTION_CATEGORIES).find(
      cat => cat.id === normalizedCategory
    ) || {
      id: normalizedCategory,
      label: normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1),
      icon: <AutoAwesomeIcon />,
      color: '#757575',
    };
  };

  const currentCategory = getCurrentCategory();

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
        pb: 1,
        mb: 2
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="suggestion panel tabs"
          sx={{ minHeight: 'unset' }}
        >
          <Tab 
            label="Suggestions" 
            id="suggestion-tab-0"
            aria-controls="suggestion-tabpanel-0"
            sx={{ minHeight: 'unset', py: 1 }}
          />
          <Tab 
            label="Custom Prompt" 
            id="suggestion-tab-1"
            aria-controls="suggestion-tabpanel-1"
            sx={{ minHeight: 'unset', py: 1 }}
          />
        </Tabs>
        
        <Box>
          <Tooltip title="Refresh suggestions">
            <span>
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={loading || !selectedProjectId || content.length < 100}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <div
        role="tabpanel"
        hidden={tabValue !== 0}
        id="suggestion-tabpanel-0"
        aria-labelledby="suggestion-tab-0"
      >
        {tabValue === 0 && (
          <>
            {!selectedProjectId ? (
              <Typography variant="body2" color="text.secondary">
                Select a project to enable AI suggestions.
              </Typography>
            ) : content.length < 100 ? (
              <Typography variant="body2" color="text.secondary">
                Start writing more content to get AI suggestions. At least 100 characters are needed.
              </Typography>
            ) : loading ? (
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={32} sx={{ mb: 2 }} />
                <Typography variant="body2">Analyzing your writing...</Typography>
              </Box>
            ) : suggestions && Object.keys(groupedSuggestions).length > 0 ? (
              <>
                {/* Category Tabs */}
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {availableCategories.map((category) => {
                    const catConfig = Object.values(SUGGESTION_CATEGORIES).find(
                      cat => cat.id === category.toLowerCase()
                    ) || {
                      id: category.toLowerCase(),
                      label: category,
                      icon: <AutoAwesomeIcon />,
                      color: '#757575',
                    };
                    
                    return (
                      <Chip 
                        key={category}
                        label={catConfig.label}
                        icon={catConfig.icon}
                        onClick={() => handleCategoryChange(category)}
                        variant={activeCategory === category ? 'filled' : 'outlined'}
                        color={activeCategory === category ? 'primary' : 'default'}
                        sx={{ 
                          '& .MuiChip-icon': { 
                            color: activeCategory === category ? 'inherit' : catConfig.color 
                          } 
                        }}
                      />
                    );
                  })}
                </Box>
                
                {/* Suggestions for Selected Category */}
                {activeCategory && groupedSuggestions[activeCategory] ? (
                  <List disablePadding>
                    {groupedSuggestions[activeCategory].map((suggestion, index) => (
                      <Paper
                        key={index}
                        elevation={1}
                        sx={{ mb: 2, p: 2, borderLeft: 3, borderColor: currentCategory?.color || 'primary.main' }}
                      >
                        <Box sx={{ mb: 1 }}>
                          {renderSuggestionContent(suggestion.text)}
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Box>
                            {!feedbackSent[suggestion.text] ? (
                              <>
                                <Tooltip title="This was helpful">
                                  <span>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleSendFeedback(suggestion.text, true)}
                                    >
                                      <ThumbUpIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="This wasn't helpful">
                                  <span>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleSendFeedback(suggestion.text, false)}
                                    >
                                      <ThumbDownIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </>
                            ) : (
                              <Chip
                                label="Thanks for your feedback"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          <Box>
                            <Tooltip title="Copy text">
                              <span>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleCopySuggestion(suggestion.text)}
                                >
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Insert as quote">
                              <span>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleCopySuggestion(`"${suggestion.text}"`)}
                                >
                                  <QuoteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No suggestions available for this category.
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                AI suggestions will appear here as you write. Click the refresh button to generate suggestions.
              </Typography>
            )}
          </>
        )}
      </div>
      
      <div
        role="tabpanel"
        hidden={tabValue !== 1}
        id="suggestion-tabpanel-1"
        aria-labelledby="suggestion-tab-1"
      >
        {tabValue === 1 && (
          <>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Enter a custom prompt for the AI, e.g., 'Find case law supporting this argument' or 'Suggest counterarguments to this position'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isGeneratingCustom || !selectedProjectId}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleGenerateCustom}
                disabled={!customPrompt.trim() || isGeneratingCustom || !selectedProjectId || content.length < 100}
                sx={{ mt: 1 }}
                startIcon={isGeneratingCustom ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
              >
                {isGeneratingCustom ? 'Generating...' : 'Generate Response'}
              </Button>
            </Box>
            
            {!selectedProjectId ? (
              <Typography variant="body2" color="text.secondary">
                Select a project to use custom prompts.
              </Typography>
            ) : content.length < 100 ? (
              <Typography variant="body2" color="text.secondary">
                Write at least 100 characters before using custom prompts.
              </Typography>
            ) : isGeneratingCustom ? (
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={32} sx={{ mb: 2 }} />
                <Typography variant="body2">Generating custom response...</Typography>
              </Box>
            ) : suggestions?.customResponse ? (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="body2" whiteSpace="pre-wrap">
                  {renderSuggestionContent(suggestions.customResponse)}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Tooltip title="Copy response">
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopySuggestion(suggestions.customResponse || '')}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Custom responses will appear here after you enter a prompt and click "Generate Response".
              </Typography>
            )}
          </>
        )}
      </div>
    </Box>
  );
};

export default SuggestionPanel; 