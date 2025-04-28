import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ListItemIcon,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
} from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';

// Import custom TinyMCE content CSS
import '../../styles/tinymce-content.css';
import { getEnhancedEditorConfig } from '../../utils/tinymce-init';

import { useProjectStore } from '../../store';
import { useNoteStore, debounceSave } from '../../store/noteStore';
import { useLinkStore, isLinkString, parseLinkString } from '../../store/linkStore';
import { Link, LinkData } from '../../types';

// Import icons for different file types
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideocamIcon from '@mui/icons-material/Videocam';
// Use our fallback-aware import for AudioTrack
import { AudioTrackIcon } from '../../components/icons';
import SaveIcon from '@mui/icons-material/Save';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ClearIcon from '@mui/icons-material/Clear';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';

import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import FeedbackMessage from '../../components/FeedbackMessage';
import EnhancedTooltip from '../../components/EnhancedTooltip';
import SuggestionPanel from '../../components/SuggestionPanel';
import CitationFinder from '../../components/CitationFinder';
import { cssTransitions } from '../../utils/transitions';
import { AIService, Suggestion } from '../../services/AIService';
import { Fade } from '../../components/SafeTransitions';

/**
 * CenterPanel - The main editing area for note synthesis
 */
const CenterPanel: React.FC = () => {
  // TinyMCE editor ref
  const editorRef = useRef<any>(null);
  
  // Project selection from store
  const { selectedProjectId } = useProjectStore();
  
  // Note state from store
  const { 
    content, 
    isLoading, 
    saveStatus, 
    lastSaved, 
    error,
    note,
    setContent,
    fetchNote,
    saveNote,
    deleteNote,
    clearNote
  } = useNoteStore();
  
  // Link store for activation and management
  const { 
    setActivationRequest, 
    saveLink, 
    links, 
    fetchLinks, 
    deleteLink,
  } = useLinkStore();
  
  // Local state for tracking editor initialization
  const [editorReady, setEditorReady] = useState(false);
  
  // Menu state for note operations
  const [noteMenuAnchor, setNoteMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Dialog state for confirmations
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  // Link management dialog
  const [linkDialog, setLinkDialog] = useState<{
    open: boolean;
    links: Link[];
  }>({
    open: false,
    links: []
  });

  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    type: 'info'
  });
  
  // Writing analysis state
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzingError, setAnalyzingError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  
  // Citation finder dialog state
  const [citationFinderOpen, setCitationFinderOpen] = useState(false);
  const [currentEditor, setCurrentEditor] = useState<any>(null);
  
  // Store the editor cleanup function
  const editorCleanupRef = useRef<(() => void) | null>(null);

  // Load the note when the selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchNote(selectedProjectId);
      fetchLinks(selectedProjectId);
    }
    
    // Memory cleanup on unmount for TinyMCE
    return () => {
      // Run event handler cleanup first
      if (editorCleanupRef.current) {
        try {
          editorCleanupRef.current();
        } catch (err) {
          console.error('Error cleaning up editor event handlers:', err);
        }
      }
      
      // Clean up TinyMCE instance when component unmounts
      if (editorRef.current) {
        try {
          editorRef.current.destroy();
          editorRef.current = null;
        } catch (err) {
          console.error('Error destroying TinyMCE editor', err);
        }
      }
      
      // Clean up any suggestions to free memory
      setSuggestions([]);
    };
  }, [selectedProjectId, fetchNote, fetchLinks]);
  
  // TinyMCE initialization handler
  const handleEditorInit = (_evt: any, _editor: any) => {
    editorRef.current = _editor;
    setEditorReady(true);
    
    // Click handler for link placeholders
    const handleLinkClick = (e: any) => {
      const target = e.target;
      if (target.classList.contains('evidence-link-placeholder')) {
        try {
          const linkData = JSON.parse(target.getAttribute('data-link'));
          // Create activation request based on link type
          if (linkData.type === 'pdf') {
            setActivationRequest({
              fileId: linkData.fileId,
              page: linkData.page,
              selectionText: linkData.selection,
              coordinates: linkData.coordinates
            });
            showNotification('Navigating to linked content', 'info');
          } else if (linkData.type === 'media') {
            setActivationRequest({
              fileId: linkData.fileId,
              timestamp: linkData.timestamp
            });
            showNotification('Navigating to linked content', 'info');
          } else if (linkData.type === 'file_link') {
            // Simple file link with no specific location
            setActivationRequest({
              fileId: linkData.fileId
            });
            showNotification('Opening file', 'info');
          }
        } catch (_err) {
          console.error('Error parsing link data:', _err);
        }
      }
    };
    
    // Paste handler for link detection
    const handleEditorPaste = (_e: any) => {
      setTimeout(() => {
        handlePaste();
      }, 0);
    };
    
    // Change handler for auto-saving
    const handleEditorChange = () => {
      const newContent = _editor.getContent();
      setContent(newContent);
      
      // Debounce save operation
      if (selectedProjectId) {
        debounceSave(selectedProjectId);
      }
    };
    
    // Set up event handlers
    _editor.on('click', handleLinkClick);
    _editor.on('paste', handleEditorPaste);
    _editor.on('input', handleEditorChange);
    
    // Store cleanup function in ref
    const cleanupFunction = () => {
      if (_editor) {
        _editor.off('click', handleLinkClick);
        _editor.off('paste', handleEditorPaste);
        _editor.off('input', handleEditorChange);
      }
    };
    
    // Store the cleanup function for later use in useEffect cleanup
    return cleanupFunction;
  };
  
  // Handle content change in the editor (handled directly in init via input event)
  const handleEditorChange = (content: string, _editor: any) => {
    // This is redundant with the input event handler, but keeping it as a fallback
    setContent(content);
    
    // Debounce save operation 
    if (selectedProjectId) {
      debounceSave(selectedProjectId);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      open: true,
      message,
      type
    });
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Get save status indicator
  const getSaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <Chip 
            icon={<SaveIcon fontSize="small" />}
            label="Saving..." 
            size="small" 
            color="default"
            sx={{ 
              height: 28,
              fontWeight: 500,
              transition: cssTransitions.fast,
              '& .MuiChip-icon': {
                fontSize: '1rem',
              }
            }}
          />
        );
      case 'saved':
        return (
          <Fade in={true} timeout={500}>
            <Chip 
              icon={<CheckCircleIcon fontSize="small" />}
              label={lastSaved ? `Saved ${formatDate(lastSaved)}` : 'Saved'} 
              size="small" 
              color="success"
              sx={{ 
                height: 28,
                fontWeight: 500,
                transition: cssTransitions.fast,
                '& .MuiChip-icon': {
                  fontSize: '1rem',
                }
              }}
            />
          </Fade>
        );
      case 'error':
        return (
          <EnhancedTooltip title="Error saving" description={error || 'An error occurred while saving your note'}>
            <Chip 
              icon={<ErrorIcon fontSize="small" />}
              label="Error saving" 
              size="small" 
              color="error"
              sx={{ 
                height: 28,
                fontWeight: 500,
                transition: cssTransitions.fast,
                '& .MuiChip-icon': {
                  fontSize: '1rem',
                }
              }}
            />
          </EnhancedTooltip>
        );
      case 'unsaved':
        return (
          <Chip 
            label="Unsaved changes" 
            size="small" 
            color="warning"
            variant="outlined"
            sx={{ 
              height: 28,
              fontWeight: 500,
              transition: cssTransitions.fast,
            }}
          />
        );
      default:
        return null;
    }
  };
  
  // Insert evidence link placeholder
  const insertLinkPlaceholder = (linkData: LinkData) => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    let displayText = '';
    let tooltipText = '';
    
    // Create tooltip content
    tooltipText = `${linkData.fileName || 'Unknown file'}`;
    if (linkData.exhibitId) {
      tooltipText += ` (${linkData.exhibitId})`;
    }
    
    if (linkData.type === 'pdf') {
      displayText = linkData.exhibitId ? `${linkData.exhibitId}` : `Page ${linkData.page}`;
      tooltipText += ` • Page ${linkData.page}`;
      if (linkData.selection) {
        tooltipText += ` • "${linkData.selection.substring(0, 50)}${linkData.selection.length > 50 ? '...' : ''}"`;
      }
    } else if (linkData.type === 'media') {
      const timestamp = linkData.timestamp;
      const minutes = Math.floor(timestamp / 60);
      const seconds = Math.floor(timestamp % 60);
      const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      displayText = linkData.exhibitId ? `${linkData.exhibitId}` : formattedTime;
      tooltipText += ` • Timestamp: ${formattedTime}`;
    } else if (linkData.type === 'file_link') {
      // Simple file link with no specific location
      displayText = linkData.exhibitId ? `${linkData.exhibitId}` : 'Link';
    }
    
    // Create a non-editable span element with the link data
    const linkPlaceholder = `<span class="evidence-link-placeholder" 
      data-link='${JSON.stringify(linkData)}' 
      title="${tooltipText}"
      contenteditable="false">[${displayText}]</span>`;
      
    // Insert at cursor position
    editor.insertContent(linkPlaceholder);
    
    // Save the link to Supabase
    if (selectedProjectId) {
      saveLink(linkData, selectedProjectId, note?.id)
        .then(() => {
          showNotification('Link created successfully', 'success');
        })
        .catch(_err => {
          showNotification('Failed to create link', 'error');
        });
    }
  };
  
  // Handle paste events with improved error handling
  const handlePaste = () => {
    navigator.clipboard.readText().then(clipboardText => {
      if (isLinkString(clipboardText)) {
        try {
          const linkData = parseLinkString(clipboardText);
          if (linkData && editorRef.current) {
            // Insert link placeholder instead of raw text
            insertLinkPlaceholder(linkData);
            return; // Exit early after successful link insertion
          }
        } catch (err) {
          console.error('Failed to parse link data:', err);
          showNotification('Invalid link format', 'error');
        }
      }
      // If we get here, just let the default paste behavior happen
    }).catch(err => {
      console.error('Failed to read clipboard:', err);
      // No need to show notification for clipboard read errors as this could be normal
      // when the user doesn't have clipboard permission
    });
  };
  
  // Manual save handler
  const handleManualSave = () => {
    if (selectedProjectId && saveStatus === 'unsaved') {
      saveNote(selectedProjectId)
        .then(() => {
          showNotification('Note saved successfully', 'success');
        })
        .catch(() => {
          showNotification('Failed to save note', 'error');
        });
    }
    handleCloseNoteMenu();
  };
  
  // Open note menu
  const handleOpenNoteMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNoteMenuAnchor(event.currentTarget);
  };
  
  // Close note menu
  const handleCloseNoteMenu = () => {
    setNoteMenuAnchor(null);
  };
  
  // Clear note content
  const handleClearNote = () => {
    setConfirmDialog({
      open: true,
      title: 'Clear Note',
      message: 'Are you sure you want to clear the note content? This cannot be undone.',
      onConfirm: () => {
        if (editorRef.current) {
          editorRef.current.setContent('');
          setContent('');
          if (selectedProjectId) {
            saveNote(selectedProjectId)
              .then(() => {
                showNotification('Note cleared successfully', 'success');
              });
          }
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
    handleCloseNoteMenu();
  };
  
  // Delete note
  const handleDeleteNote = () => {
    if (!note) return;
    
    setConfirmDialog({
      open: true,
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note? This action cannot be undone.',
      onConfirm: () => {
        deleteNote(note.id)
          .then(() => {
            // Note deleted
            clearNote();
            if (editorRef.current) {
              editorRef.current.setContent('');
            }
            showNotification('Note deleted successfully', 'success');
          })
          .catch(() => {
            showNotification('Failed to delete note', 'error');
          });
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
    handleCloseNoteMenu();
  };
  
  // Open links dialog
  const handleOpenLinksDialog = () => {
    setLinkDialog({
      open: true,
      links: links
    });
    handleCloseNoteMenu();
  };
  
  // Close links dialog
  const handleCloseLinksDialog = () => {
    setLinkDialog({
      ...linkDialog,
      open: false
    });
  };
  
  // Delete link
  const handleDeleteLink = (linkId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Link',
      message: 'Are you sure you want to delete this link? This action cannot be undone.',
      onConfirm: () => {
        deleteLink(linkId)
          .then(() => {
            // Update links dialog list
            setLinkDialog({
              ...linkDialog,
              links: links.filter(link => link.id !== linkId)
            });
            showNotification('Link deleted successfully', 'success');
          })
          .catch(() => {
            showNotification('Failed to delete link', 'error');
          });
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };
  
  // Close confirm dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };
  
  // Toggle suggestions panel
  const toggleSuggestionsPanel = () => {
    setSuggestionsOpen(!suggestionsOpen);
  };
  
  // Analyze text for suggestions
  const handleAnalyzeText = async () => {
    if (!editorRef.current) return;
    
    // Get selected text or current paragraph
    let textContext = '';
    
    if (editorRef.current.selection.getContent({ format: 'text' })) {
      // Get selected text
      textContext = editorRef.current.selection.getContent({ format: 'text' });
    } else {
      // Get current paragraph or reasonable context block
      const node = editorRef.current.selection.getNode();
      textContext = node.textContent || '';
    }
    
    if (!textContext.trim()) {
      showNotification('Please select text or position cursor in a paragraph', 'warning');
      return;
    }
    
    setAnalyzeLoading(true);
    setAnalyzingError(null);
    
    try {
      const response = await AIService.analyzeWritingContext(textContext);
      setSuggestions(response.suggestions || []);
      setSuggestionsOpen(true);
    } catch (_err: any) {
      setAnalyzingError(_err.message || 'Failed to analyze text');
      showNotification('Error analyzing text', 'error');
    } finally {
      setAnalyzeLoading(false);
    }
  };
  
  // Get the link icon for a specific file type
  const getLinkIcon = (linkData: any) => {
    if (linkData.type === 'pdf') {
      return <PictureAsPdfIcon fontSize="small" />;
    } else if (linkData.type === 'media') {
      return linkData.mediaType === 'video' 
        ? <VideocamIcon fontSize="small" />
        : <AudioTrackIcon fontSize="small" />;
    }
    return <LinkIcon fontSize="small" />;
  };
  
  // Handle Cite Evidence button click
  const handleCiteButtonClick = (editor: any) => {
    setCurrentEditor(editor);
    setCitationFinderOpen(true);
  };
  
  // Insert citation when selected from CitationFinder
  const handleInsertCitation = (file: File) => {
    // Create a simple file-level link
    const linkData: FileLinkData = {
      type: 'file_link',
      fileId: file.id,
      fileName: file.name,
      exhibitId: file.exhibit_id || null
    };
    
    // Insert placeholder at cursor position
    insertLinkPlaceholder(linkData);
  };
  
  // Get enhanced TinyMCE configuration with citation button
  const editorConfig = getEnhancedEditorConfig(handleCiteButtonClick);
  
  // Render
  return (
    <Paper
      elevation={0}
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 0,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Notes</Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Save status indicator */}
          {getSaveStatusIndicator()}
          
          {/* Analysis button */}
          <EnhancedTooltip title="AI Analysis" description="Analyze current selection or paragraph">
            <span>
              <IconButton
                size="small"
                onClick={handleAnalyzeText}
                disabled={analyzeLoading || !editorReady}
              >
                <Badge color="secondary" variant="dot" invisible={!suggestionsOpen}>
                  <PsychologyAltIcon fontSize="small" />
                </Badge>
              </IconButton>
            </span>
          </EnhancedTooltip>
          
          {/* Help button */}
          <EnhancedTooltip 
            title="Evidence Links" 
            description="Copy an evidence link from a file and paste it into the editor to create a link. Click a link to navigate to the source."
          >
            <IconButton size="small">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </EnhancedTooltip>
          
          {/* More options menu */}
          <IconButton
            size="small"
            onClick={handleOpenNoteMenu}
            aria-label="more options"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          
          <Menu
            anchorEl={noteMenuAnchor}
            open={Boolean(noteMenuAnchor)}
            onClose={handleCloseNoteMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleManualSave} disabled={saveStatus !== 'unsaved'}>
              <ListItemIcon>
                <SaveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Save Now</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleOpenLinksDialog}>
              <ListItemIcon>
                <LinkIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Manage Links</ListItemText>
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleClearNote}>
              <ListItemIcon>
                <ClearIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Clear Content</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleDeleteNote} disabled={!note}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Note</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {isLoading ? (
          <LoadingSkeleton variant="editor" />
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Editor */}
            <Editor
              onInit={(evt, editor) => {
                const cleanup = handleEditorInit(evt, editor);
                // Store the cleanup function
                editorCleanupRef.current = cleanup;
              }}
              value={content}
              onEditorChange={handleEditorChange}
              init={editorConfig}
              disabled={!selectedProjectId}
            />
            
            {/* Empty state when no project is selected */}
            {!selectedProjectId && (
              <EmptyState
                title="Select a case from the projects panel to start taking notes"
                icon={EditIcon}
              />
            )}
          </Box>
        )}
        
        {/* Suggestions panel */}
        <SuggestionPanel
          isOpen={suggestionsOpen}
          onToggle={toggleSuggestionsPanel}
          suggestions={suggestions}
          isLoading={analyzeLoading}
          error={analyzingError}
        />
      </Box>
      
      {/* Notification message */}
      <FeedbackMessage
        open={notification.open}
        message={notification.message}
        type={notification.type}
        onClose={handleCloseNotification}
      />
      
      {/* Confirm dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDialog.onConfirm} color="error" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Links management dialog */}
      <Dialog
        open={linkDialog.open}
        onClose={handleCloseLinksDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manage Evidence Links</DialogTitle>
        <DialogContent>
          <List>
            {linkDialog.links.length === 0 ? (
              <ListItem>
                <ListItemText primary="No links found. Create links by copying them from evidence files and pasting into the editor." />
              </ListItem>
            ) : (
              linkDialog.links.map((link) => {
                const linkData = link.source_details_json;
                return (
                  <ListItem
                    key={link.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteLink(link.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      {getLinkIcon(linkData)}
                    </ListItemIcon>
                    <ListItemText
                      primary={linkData.fileName || 'Unnamed file'}
                      secondary={
                        linkData.type === 'pdf'
                          ? `Page ${linkData.page}${linkData.selection ? ` - "${linkData.selection.substring(0, 40)}${linkData.selection.length > 40 ? '...' : ''}"` : ''}`
                          : `Timestamp: ${Math.floor(linkData.timestamp / 60)}:${Math.floor(linkData.timestamp % 60).toString().padStart(2, '0')}`
                      }
                    />
                  </ListItem>
                );
              })
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLinksDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Citation finder dialog */}
      <CitationFinder
        open={citationFinderOpen}
        onClose={() => setCitationFinderOpen(false)}
        onInsertCitation={handleInsertCitation}
      />
    </Paper>
  );
};

export default CenterPanel; 