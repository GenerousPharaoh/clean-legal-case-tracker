import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, IconButton, Divider, Chip, Tabs, Tab, TextField, Button, Card, CardContent, Tooltip, Alert, Accordion, AccordionSummary, AccordionDetails, Skeleton, List, ListItem, ListItemText } from '@mui/material';
import { Fade } from '../../components/SafeTransitions';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GavelIcon from '@mui/icons-material/Gavel';
import CategoryIcon from '@mui/icons-material/Category';
import { useFileStore, FileType } from '../../store';
import { useLinkStore } from '../../store';
import { useProjectStore } from '../../store';
import { useFileEntities } from '../../hooks/useFileEntities';
import FileIcon from '../../components/FileIcon';
import { getDownloadUrl } from '../../utils/storageUtils';
import { supabase } from '../../supabaseClient';
import { useLayoutStore } from '../../store/layoutStore';
import PanelCollapseButton from '../../components/PanelCollapseButton';

// Import viewer components
import EnhancedPdfViewer from '../../components/viewers/EnhancedPdfViewer';
import EnhancedImageViewer from '../../components/viewers/EnhancedImageViewer';
import AudioVideoViewer from '../../components/viewers/AudioVideoViewer';

// Import utility components
import EmptyState from '../../components/EmptyState';
import FeedbackMessage from '../../components/FeedbackMessage';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EnhancedTooltip from '../../components/EnhancedTooltip';
import { transitions, cssTransitions } from '../../utils/transitions';

// Define tab values
enum RightPanelTab {
  FILE_VIEWER = 0,
  AI_ASSIST = 1
}

// Define AI features
enum AIFeature {
  PROJECT_QA = 'project-qa',
  FILE_ANALYSIS = 'file-analysis',
  EXTRACTED_ENTITIES = 'extracted-entities'
}

/**
 * RightPanel - The right panel displaying file viewers and details
 */
const RightPanel: React.FC = () => {
  const { selectedFile, setSelectedFile } = useFileStore();
  const { selectedProject } = useProjectStore();
  const { activationRequest, setActivationRequest } = useLinkStore();
  const { 
    rightPanelWidth,
    isRightPanelCollapsed,
    toggleRightPanelCollapse 
  } = useLayoutStore();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<RightPanelTab>(RightPanelTab.FILE_VIEWER);
  
  // AI Assist state
  const [currentAIFeature, setCurrentAIFeature] = useState<AIFeature>(AIFeature.PROJECT_QA);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [relevantChunks, setRelevantChunks] = useState<any[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Fetch entities for the selected file
  const { groupedEntities, loading: entitiesLoading, error: entitiesError } = useFileEntities(
    currentTab === RightPanelTab.AI_ASSIST && 
    currentAIFeature === AIFeature.EXTRACTED_ENTITIES && 
    selectedFile ? 
    selectedFile.id : null
  );

  // Navigation props for viewers
  const [pdfNavigation, setPdfNavigation] = useState<{
    page?: number;
    selectionText?: string;
    coordinates?: number[];
  } | null>(null);
  
  const [mediaNavigation, setMediaNavigation] = useState<{
    timestamp?: number;
  } | null>(null);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: RightPanelTab) => {
    setCurrentTab(newValue);
  };

  // Handle user question change
  const handleQuestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserQuestion(event.target.value);
  };

  // Handle asking a question across all project documents
  const handleAskProjectQuestion = async () => {
    if (!userQuestion.trim() || !selectedProject) return;
    
    setIsProcessing(true);
    setAiError(null);
    
    try {
      // Call the project-qa edge function
      const { data, error } = await supabase.functions.invoke('project-qa', {
        body: {
          projectId: selectedProject.id,
          userQuestion: userQuestion
        }
      });
      
      if (error) throw error;
      
      setAiResponse(data.answer);
      setRelevantChunks(data.relevantChunks || []);
    } catch (err: any) {
      console.error('Error asking project question:', err);
      setAiError(err.message || 'Failed to process your question. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle link activation
  useEffect(() => {
    if (!activationRequest) return;
    
    const { fileId, page, timestamp, selectionText, coordinates } = activationRequest;
    
    // Find the file to display
    const fetchFileById = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch the file from Supabase
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('id', fileId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Set the selected file
          setSelectedFile(data);
          
          // Set navigation parameters based on link type
          if (page !== undefined) {
            setPdfNavigation({ page, selectionText, coordinates });
            setMediaNavigation(null);
          } else if (timestamp !== undefined) {
            setMediaNavigation({ timestamp });
            setPdfNavigation(null);
          }
        } else {
          setError('File not found');
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching file:', err);
        setError(err.message || 'Failed to load linked file');
        setLoading(false);
      }
      
      // Clear the activation request after handling
      setActivationRequest(null);
    };
    
    fetchFileById();
  }, [activationRequest, setSelectedFile, setActivationRequest]);

  // Generate a download URL when a file is selected
  useEffect(() => {
    let isMounted = true;

    const fetchDownloadUrl = async () => {
      if (!selectedFile) {
        setDownloadUrl(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = await getDownloadUrl(selectedFile.storage_path);
        
        if (isMounted) {
          setDownloadUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error getting download URL:', err);
        if (isMounted) {
          setError('Failed to load file. Please try again later.');
          setLoading(false);
        }
      }
    };

    fetchDownloadUrl();

    // Cleanup function to handle component unmounting
    return () => {
      isMounted = false;
    };
  }, [selectedFile]);

  // Format file size to human-readable
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date string to locale format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Get appropriate file type label
  const getFileTypeLabel = (fileType: string): string => {
    switch (fileType) {
      case FileType.PDF:
        return 'PDF Document';
      case FileType.IMAGE:
        return 'Image';
      case FileType.VIDEO:
        return 'Video';
      case FileType.AUDIO:
        return 'Audio';
      default:
        return 'Other Document';
    }
  };

  // Get file extension
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  // Get icon for entity type
  const getEntityTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PERSON':
        return <PersonIcon fontSize="small" />;
      case 'ORG':
        return <BusinessIcon fontSize="small" />;
      case 'DATE':
        return <CalendarTodayIcon fontSize="small" />;
      case 'LOCATION':
        return <LocationOnIcon fontSize="small" />;
      case 'LEGAL_TERM':
        return <GavelIcon fontSize="small" />;
      default:
        return <CategoryIcon fontSize="small" />;
    }
  };

  // Get display name for entity type
  const getEntityTypeDisplayName = (type: string): string => {
    switch (type.toUpperCase()) {
      case 'PERSON':
        return 'People';
      case 'ORG':
        return 'Organizations';
      case 'DATE':
        return 'Dates';
      case 'LOCATION':
        return 'Locations';
      case 'LEGAL_TERM':
        return 'Legal Terms';
      default:
        return type;
    }
  };

  // Render the appropriate viewer based on file type
  const renderViewer = () => {
    if (!selectedFile || !downloadUrl) return null;

    switch (selectedFile.file_type) {
      case FileType.PDF:
        return (
          <transitions.Fade in={true}>
            <Box sx={{ height: '100%' }}>
              <EnhancedPdfViewer 
                fileUrl={downloadUrl} 
                fileName={selectedFile.name}
                fileId={selectedFile.id}
                initialPage={pdfNavigation?.page}
                initialSelection={pdfNavigation?.selectionText}
                initialCoordinates={pdfNavigation?.coordinates}
              />
            </Box>
          </transitions.Fade>
        );
      
      case FileType.IMAGE:
        return (
          <transitions.Fade in={true}>
            <Box sx={{ height: '100%' }}>
              <EnhancedImageViewer fileUrl={downloadUrl} fileName={selectedFile.name} />
            </Box>
          </transitions.Fade>
        );
      
      case FileType.AUDIO:
        return (
          <transitions.Fade in={true}>
            <Box sx={{ height: '100%' }}>
              <AudioVideoViewer 
                fileUrl={downloadUrl} 
                mediaType="audio" 
                fileName={selectedFile.name}
                fileId={selectedFile.id}
                initialTimestamp={mediaNavigation?.timestamp}
              />
            </Box>
          </transitions.Fade>
        );
      
      case FileType.VIDEO:
        return (
          <transitions.Fade in={true}>
            <Box sx={{ height: '100%' }}>
              <AudioVideoViewer 
                fileUrl={downloadUrl} 
                mediaType="video" 
                fileName={selectedFile.name}
                fileId={selectedFile.id}
                initialTimestamp={mediaNavigation?.timestamp}
              />
            </Box>
          </transitions.Fade>
        );
      
      default:
        return (
          <EmptyState
            icon="file"
            title="Unsupported File Type"
            description="This file type doesn't have a dedicated viewer yet. You can download the file to view it in your preferred application."
            size="medium"
          />
        );
    }
  };

  // Render the Project Q&A interface
  const renderProjectQA = () => {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <QuestionAnswerIcon sx={{ mr: 1 }} />
          Project Q&A
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ask questions about all documents in the current project. The AI will search across 
          your files and provide relevant answers based on their content.
        </Typography>
        
        {/* Input area */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
          <TextField 
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Ask a question about your project documents..."
            value={userQuestion}
            onChange={handleQuestionChange}
            disabled={isProcessing}
            sx={{ mr: 1 }}
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleAskProjectQuestion}
            disabled={isProcessing || !userQuestion.trim() || !selectedProject}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            sx={{ mt: 1 }}
          >
            Ask
          </Button>
        </Box>
        
        {/* Error message */}
        {aiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {aiError}
          </Alert>
        )}
        
        {/* Response area */}
        {aiResponse && (
          <Box 
            sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'auto',
              bgcolor: 'background.default',
              borderRadius: 1,
              p: 2,
              mb: 2
            }}
          >
            <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {aiResponse}
            </Typography>
            
            {/* Show source files */}
            {relevantChunks.length > 0 && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Source Documents ({relevantChunks.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {relevantChunks.map((chunk, index) => (
                      <Card key={chunk.id} variant="outlined" sx={{ mb: 1 }}>
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <DescriptionIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {chunk.file_name || 'Document'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {chunk.text_preview}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}
        
        {/* Loading state */}
        {isProcessing && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Searching project documents and analyzing content...
            </Typography>
          </Box>
        )}
        
        {/* Empty state */}
        {!aiResponse && !isProcessing && (
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: 3
          }}>
            <SmartToyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" align="center">
              Ask a question about your project documents to get started.
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              The AI will search across all files and provide relevant answers.
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Render the Extracted Entities interface
  const renderExtractedEntities = () => {
    // Check if file is selected
    if (!selectedFile) {
      return (
        <Box sx={{ p: 3 }}>
          <EmptyState
            icon="description"
            title="No File Selected"
            description="Please select a file to view its extracted entities"
            size="medium"
          />
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <CategoryIcon sx={{ mr: 1 }} />
          Extracted Entities
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Key entities automatically extracted from "{selectedFile.name}" using AI-powered Named Entity Recognition.
        </Typography>
        
        {/* Loading state */}
        {entitiesLoading && (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={100} />
            <Skeleton variant="rectangular" width="100%" height={40} sx={{ mt: 2, mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={100} />
          </Box>
        )}
        
        {/* Error state */}
        {entitiesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {entitiesError}
          </Alert>
        )}
        
        {/* No entities state */}
        {!entitiesLoading && !entitiesError && Object.keys(groupedEntities).length === 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 4,
            flex: 1
          }}>
            <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" align="center">
              No entities have been extracted from this file yet.
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Entities are extracted during file processing. If this file was recently uploaded, try refreshing.
            </Typography>
          </Box>
        )}
        
        {/* Entity groups */}
        {!entitiesLoading && !entitiesError && Object.keys(groupedEntities).length > 0 && (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {Object.entries(groupedEntities).map(([entityType, entities]) => (
              <Accordion key={entityType} defaultExpanded sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getEntityTypeIcon(entityType)}
                    <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 500 }}>
                      {getEntityTypeDisplayName(entityType)} ({entities.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense disablePadding>
                    {entities.map((entity) => (
                      <ListItem key={entity.id} disableGutters>
                        <ListItemText 
                          primary={entity.entity_text}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  // Reset navigation props when file changes
  useEffect(() => {
    setPdfNavigation(null);
    setMediaNavigation(null);
  }, [selectedFile?.id]);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Collapse/Expand Button */}
      <PanelCollapseButton 
        isCollapsed={isRightPanelCollapsed}
        onToggle={toggleRightPanelCollapse}
        position="right"
      />
      
    <Paper
      elevation={2}
      sx={{
          width: isRightPanelCollapsed ? 0 : rightPanelWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        borderRadius: 0,
        overflow: 'hidden',
          transition: isRightPanelCollapsed ? cssTransitions.medium : cssTransitions.ultraFast,
          opacity: isRightPanelCollapsed ? 0 : 1,
          visibility: isRightPanelCollapsed ? 'hidden' : 'visible',
      }}
    >
      {!selectedFile && currentTab === RightPanelTab.FILE_VIEWER ? (
        // No file selected state for File Viewer tab
        <EmptyState
          icon="info"
          title="File Viewer"
          description="Select a file from the left panel to view its contents"
          size="large"
        />
      ) : !selectedProject && currentTab === RightPanelTab.AI_ASSIST ? (
        // No project selected state for AI Assist tab
        <EmptyState
          icon="smart_toy"
          title="AI Assistant"
          description="Select a project from the left panel to use AI features"
          size="large"
        />
      ) : (
        <>
          {/* Tab navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab 
                icon={<DescriptionIcon fontSize="small" />} 
                label="File Viewer" 
                disabled={!selectedFile}
              />
              <Tab 
                icon={<SmartToyIcon fontSize="small" />} 
                label="AI Assist" 
                disabled={!selectedProject}
              />
            </Tabs>
          </Box>
          
          {/* File Viewer Tab */}
          {currentTab === RightPanelTab.FILE_VIEWER && selectedFile && (
            <>
              {/* Header with file info */}
              <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                bgcolor: 'background.default',
                transition: cssTransitions.fast,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FileIcon 
                    fileType={selectedFile.file_type} 
                    sx={{ mr: 1.5, fontSize: 28, color: 'primary.main' }} 
                  />
                  <Typography 
                    variant="h6" 
                    noWrap 
                    sx={{ 
                      flex: 1,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {selectedFile.name}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={getFileTypeLabel(selectedFile.file_type)} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ height: 24, fontWeight: 500, fontSize: '0.75rem' }}
                  />
                  
                  <Chip 
                    label={formatFileSize(selectedFile.size)} 
                    size="small" 
                    color="default" 
                    variant="outlined"
                    sx={{ height: 24, fontWeight: 400, fontSize: '0.75rem' }}
                  />
                  
                  {getFileExtension(selectedFile.name) && (
                    <Chip 
                      label={getFileExtension(selectedFile.name)} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                      sx={{ height: 24, fontWeight: 400, fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Added: {formatDate(selectedFile.added_at)}
                </Typography>
              </Box>

              {/* Content area */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {error ? (
                  <FeedbackMessage
                    open={true}
                    message={error}
                    type="error"
                    inline
                  />
                ) : loading ? (
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                    <LoadingSkeleton variant="file-content" />
                  </Box>
                ) : (
                  renderViewer()
                )}
              </Box>
            </>
          )}
          
          {/* AI Assist Tab */}
          {currentTab === RightPanelTab.AI_ASSIST && selectedProject && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* AI Feature selector */}
              <Tabs
                value={currentAIFeature}
                onChange={(e, newValue) => setCurrentAIFeature(newValue)}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
                sx={{ bgcolor: 'background.default' }}
              >
                <Tab 
                  value={AIFeature.PROJECT_QA} 
                  label="Project Q&A" 
                  icon={<QuestionAnswerIcon fontSize="small" />}
                  iconPosition="start"
                />
                <Tab 
                  value={AIFeature.EXTRACTED_ENTITIES} 
                  label="Entities" 
                  icon={<CategoryIcon fontSize="small" />}
                  iconPosition="start"
                />
              </Tabs>
              
              {/* AI Feature content */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {currentAIFeature === AIFeature.PROJECT_QA && renderProjectQA()}
                {currentAIFeature === AIFeature.EXTRACTED_ENTITIES && renderExtractedEntities()}
              </Box>
            </Box>
          )}
        </>
      )}
    </Paper>
    </Box>
  );
};

export default RightPanel; 