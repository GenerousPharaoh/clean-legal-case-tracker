import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ZoomOut,
  ZoomIn,
  AutoAwesome as AnalyzeIcon,
} from '@mui/icons-material';
import { Editor } from '@tinymce/tinymce-react';
import { useAuth } from '../../contexts/AuthContext';
import useAppStore from '../../store';
import supabaseClient from '../../services/supabaseClient';
import { Note, Link } from '../../types';
import SuggestionPanel from '../../components/ai/SuggestionPanel';
import CitationFinder from '../../components/dialogs/CitationFinder';
import { debounce } from 'lodash';

// Define a local interface to match the actual database schema
interface NoteData {
  id: string;
  project_id: string;
  content: string;
  updated_at: string;
  user_id: string;
}

const CenterPanel = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<string>('');
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCitationFinderOpen, setCitationFinderOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  
  // Use individual selectors instead of object destructuring
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const isSuggestionPanelOpen = useAppStore((state) => state.isSuggestionPanelOpen);
  const toggleSuggestionPanel = useAppStore((state) => state.toggleSuggestionPanel);
  const linkActivation = useAppStore((state) => state.linkActivation);
  const setLinkActivation = useAppStore((state) => state.setLinkActivation);
  const files = useAppStore((state) => state.files);

  // Load note when project changes
  useEffect(() => {
    if (selectedProjectId && user) {
      fetchNote();
    } else {
      setNote(null);
      setContent('');
    }
  }, [selectedProjectId, user]);

  // Create debounced save function
  const debouncedSaveNote = useCallback(
    debounce((noteToSave: NoteData, contentToSave: string) => {
      saveNote(noteToSave, contentToSave);
    }, 2000),
    []
  );

  // Auto-save content changes
  useEffect(() => {
    if (note && content !== note.content) {
      debouncedSaveNote(note, content);
    }
  }, [content, note, debouncedSaveNote]);

  // Link activation handler - scroll to and highlight citation when a link is activated
  useEffect(() => {
    if (linkActivation && editorInstance) {
      highlightLinkedCitation(linkActivation.fileId);
    }
  }, [linkActivation, editorInstance]);

  // Highlight citation in the editor
  const highlightLinkedCitation = (fileId: string) => {
    if (!editorInstance) return;
    
    const editor = editorInstance;
    const content = editor.getContent();
    
    // Find all citation elements with the matching file ID
    const body = editor.getBody();
    const citations = body.querySelectorAll(`a.exhibit-citation[data-file-id="${fileId}"]`);
    
    if (citations.length > 0) {
      // Scroll to the first occurrence
      citations[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight all matching citations
      citations.forEach((citation: HTMLElement) => {
        editor.selection.select(citation);
        editor.focus();
      });
    }
  };

  // Fetch the note for the current project
  const fetchNote = async () => {
    if (!selectedProjectId) return;
    
    setLoading(true);
    
    try {
      // Always get the authenticated user from Supabase auth first
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !authUser) {
        console.error('Error getting authenticated user:', authError || 'No user found');
        throw authError || new Error('No user found');
      }
      
      const userId = authUser.id;
      
      console.log('Fetching note for project:', selectedProjectId, 'and user:', userId);
      const { data, error } = await supabaseClient
        .from('notes')
        .select('id, project_id, user_id, content, updated_at')
        .eq('project_id', selectedProjectId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error in note query:', error);
        throw error;
      }
      
      if (data) {
        console.log('Found existing note:', data);
        setNote(data);
        setContent(data.content || '');
      } else {
        // Create a new note if one doesn't exist
        console.log('Creating new note for project:', selectedProjectId);
        
        const newNote = {
          project_id: selectedProjectId,
          user_id: userId,
          content: '',
        };
        
        const { data: createdNote, error: createError } = await supabaseClient
          .from('notes')
          .upsert([newNote], { onConflict: ['project_id', 'user_id'] })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating note:', createError);
          throw createError;
        }
        
        console.log('Created new note:', createdNote);
        setNote(createdNote);
        setContent('');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save note to the database
  const saveNote = async (noteToSave: NoteData, contentToSave: string) => {
    if (!noteToSave || !selectedProjectId) return;
    
    setSaving(true);
    
    try {
      // Always get the authenticated user from Supabase auth first
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !authUser) {
        console.error('Error getting authenticated user:', authError || 'No user found');
        throw authError || new Error('No user found');
      }
      
      const userId = authUser.id;
      
      const { error } = await supabaseClient
        .from('notes')
        .update({ 
          content: contentToSave, 
          updated_at: new Date().toISOString(),
          user_id: userId
        })
        .eq('id', noteToSave.id)
        .eq('user_id', userId); // Add user_id constraint for extra security
      
      if (error) throw error;
      
      // Update local note
      setNote({ ...noteToSave, content: contentToSave, updated_at: new Date().toISOString() });
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  // Save link to database when citation is inserted
  const saveLink = async (fileId: string, exhibitId: string) => {
    if (!selectedProjectId || !note) return;
    
    try {
      // Always get the authenticated user from Supabase auth first
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !authUser) {
        console.error('Error getting authenticated user:', authError || 'No user found');
        throw authError || new Error('No user found');
      }
      
      const userId = authUser.id;
      
      const linkData = {
        project_id: selectedProjectId,
        user_id: userId,
        source_file_id: fileId,
        source_details_json: {
          type: 'exhibit',
          exhibitId: exhibitId,
        },
        target_context_json: {
          note_id: note.id,
        },
      };
      
      const { data, error } = await supabaseClient
        .from('links')
        .insert(linkData)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Link saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error saving link:', error);
    }
  };

  // TinyMCE configuration
  const editorConfig = {
    height: '100%',
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
      'save', 'autoresize'
    ],
    toolbar: 'undo redo | formatselect | ' +
      'bold italic backcolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help | cite',
    content_style: `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; }
      .exhibit-citation { 
        background-color: #e3f2fd; 
        color: #1976d2; 
        padding: 2px 4px; 
        border-radius: 4px; 
        text-decoration: none; 
        font-weight: bold;
        cursor: pointer;
      }
      .exhibit-citation:hover { 
        background-color: #bbdefb; 
      }
    `,
    // Add base_url to ensure TinyMCE can find its resources
    base_url: '/tinymce',
    // Add skin_url to ensure TinyMCE can find its skin
    skin_url: '/tinymce/skins/ui/oxide',
    // Add content_css to ensure TinyMCE loads the proper CSS for the editor content
    content_css: '/tinymce/skins/content/default/content.min.css',
    // Add license key for TinyMCE
    license_key: 'gpl',
    inline_styles: true,
    extended_valid_elements: 'a[*]',
    // Setup editor
    setup: (editor) => {
      // Store editor instance for later use
      editor.on('init', () => {
        setEditorInstance(editor);
      });
      
      // Add custom cite button
      editor.ui.registry.addButton('cite', {
        text: 'Cite Exhibit',
        tooltip: 'Insert citation to an exhibit',
        onAction: () => {
          setCitationFinderOpen(true);
        }
      });
      
      // Add citation click handler
      editor.on('click', (e) => {
        const clickedEl = e.target as HTMLElement;
        
        if (clickedEl.classList.contains('exhibit-citation')) {
          e.preventDefault();
          
          const fileId = clickedEl.getAttribute('data-file-id');
          const exhibitId = clickedEl.getAttribute('data-exhibit-id');
          
          if (fileId) {
            // Activate the file in the right panel
            setLinkActivation({
              fileId,
              page: undefined, // Will be set by the viewer if applicable
              timestamp: undefined, // Will be set by the viewer if applicable
            });
          }
        }
      });
    }
  };

  // Editor change handler
  const handleEditorChange = (newContent: string) => {
    setContent(newContent);
  };

  // Citation insertion handler
  const handleInsertCitation = async (exhibitId: string, fileId: string) => {
    setCitationFinderOpen(false);
    
    // Get the file details
    const file = files.find(f => f.id === fileId);
    const displayName = file?.exhibit_id || exhibitId;
    
    // Save link to database
    await saveLink(fileId, displayName);
    
    // Insert the citation at cursor position
    const citation = `<a href="#" data-exhibit-id="${displayName}" data-file-id="${fileId}" class="exhibit-citation">[Exhibit ${displayName}]</a>`;
    
    // Get editor instance
    if (editorInstance) {
      editorInstance.execCommand('mceInsertContent', false, citation);
    }
  };

  // Toggle AI suggestions panel
  const handleAnalyzeContent = () => {
    if (!isSuggestionPanelOpen) {
      toggleSuggestionPanel();
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
      }}
      data-test="center-panel"
    >
      {/* Editor Area */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        {loading && selectedProjectId ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
          }}>
            <CircularProgress />
          </Box>
        ) : !selectedProjectId ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            p: 3,
            opacity: 0, // Keep hidden as we'll show the WelcomePlaceholder from CenterPanelWrapper instead
          }}>
            {/* Empty placeholder - this should never be seen */}
          </Box>
        ) : (
          <Editor
            apiKey={import.meta.env.VITE_TINYMCE_API_KEY as string}
            value={content}
            onEditorChange={handleEditorChange}
            init={editorConfig}
            // Add onInit handler to log successful initialization
            onInit={(evt, editor) => {
              console.log('TinyMCE initialized successfully');
              setEditorInstance(editor);
              if (editor.getContainer()) {
                editor.getContainer().setAttribute('data-test', 'note-editor');
              }
            }}
            // Add onError handler to catch any editor loading errors
            onLoadError={(err) => {
              console.error('TinyMCE failed to load:', err);
            }}
          />
        )}
        
        {/* Action buttons */}
        {selectedProjectId && !loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10,
            display: 'flex',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <Tooltip title="Analyze with AI">
              <span>
                <IconButton
                  onClick={handleAnalyzeContent}
                  color={isSuggestionPanelOpen ? 'primary' : 'default'}
                  sx={{ 
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'background.default' }
                  }}
                  disabled={!content || content.length < 100}
                >
                  <AnalyzeIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
        
        {/* Saving indicator */}
        {saving && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: 10, 
            right: 10,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            p: 0.5,
            borderRadius: 1,
            boxShadow: 1,
          }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="caption">Saving...</Typography>
          </Box>
        )}
      </Box>
      
      {/* Suggestion Panel */}
      {isSuggestionPanelOpen && (
        <Box sx={{ 
          height: '30%', 
          borderTop: 1, 
          borderColor: 'divider',
          overflow: 'auto',
          p: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">AI Suggestions</Typography>
            <IconButton size="small" onClick={toggleSuggestionPanel}>
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          <SuggestionPanel content={content} />
        </Box>
      )}
      
      {/* Citation Finder Dialog */}
      <CitationFinder
        open={isCitationFinderOpen}
        onClose={() => setCitationFinderOpen(false)}
        onSelectFile={handleInsertCitation}
      />
    </Box>
  );
};

export default CenterPanel; 