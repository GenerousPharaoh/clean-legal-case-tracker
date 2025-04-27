import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  IconButton, 
  Toolbar, 
  TextField, 
  Typography, 
  CircularProgress, 
  Alert, 
  Slider,
  InputAdornment,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar
} from '@mui/material';
import { 
  Document, 
  Page, 
  pdfjs 
} from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the PDF.js worker source
// Important: this should match the version of pdfjs-dist installed
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

// Import icons
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TextFormatIcon from '@mui/icons-material/TextFormat';

import { stringifyLinkData } from '../../store/linkStore';
import { PdfLinkData } from '../../types';

interface EnhancedPdfViewerProps {
  fileUrl: string;
  fileName?: string;
  fileId?: string;
  initialPage?: number;
  initialSelection?: string;
  initialCoordinates?: number[];
}

interface SearchResult {
  pageIndex: number;
  matchIndex: number;
}

const EnhancedPdfViewer: React.FC<EnhancedPdfViewerProps> = ({ 
  fileUrl, 
  fileName, 
  fileId,
  initialPage,
  initialSelection,
  initialCoordinates
}) => {
  // PDF state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageInputValue, setPageInputValue] = useState<string>('1');
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fitMode, setFitMode] = useState<'width' | 'page' | 'none'>('width');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Selection state
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionCoordinates, setSelectionCoordinates] = useState<number[] | null>(null);
  
  // Context menu state for selection
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
  
  // Snackbar for feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<any>(null);
  const textLayersRef = useRef<HTMLDivElement[]>([]);
  const hasNavigatedToInitialPage = useRef(false);

  // Handle document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    
    // If there's an initial page from a link, navigate to it
    if (initialPage && !hasNavigatedToInitialPage.current) {
      if (initialPage > 0 && initialPage <= numPages) {
        setPageNumber(initialPage);
        setPageInputValue(initialPage.toString());
        hasNavigatedToInitialPage.current = true;
      }
    } else {
      // Default to page 1
      setPageNumber(1);
      setPageInputValue('1');
    }
  };

  // Handle document load error
  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again later.');
    setLoading(false);
  };

  // Reset navigation tracking when fileId changes
  useEffect(() => {
    hasNavigatedToInitialPage.current = false;
  }, [fileId]);

  // Handle text selection in the PDF
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== '') {
        setSelectedText(selection.toString());
        
        // In a real implementation, we would get accurate coordinates from the PDF.js API
        // For Phase 4, we'll just use placeholder values or approximate from selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect) {
          // Store page-relative coordinates (simplified)
          setSelectionCoordinates([rect.left, rect.top, rect.right, rect.bottom]);
        }
      } else {
        setSelectedText('');
        setSelectionCoordinates(null);
      }
    };

    document.addEventListener('selectionchange', handleTextSelection);
    
    // Cleanup function to prevent memory leaks
    return () => {
      document.removeEventListener('selectionchange', handleTextSelection);
      // Clear any selections on unmount
      setSelectedText('');
      setSelectionCoordinates(null);
      
      // Clear text layer references
      textLayersRef.current = [];
    };
  }, []);

  // Additional cleanup effect to ensure all resources are freed
  useEffect(() => {
    return () => {
      // Make sure document ref is cleared to prevent memory leaks
      documentRef.current = null;
      
      // Clear search results to free memory
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      
      // Clear any ongoing loading or error states
      setLoading(false);
      setError(null);
    };
  }, []);

  // Handle right-click on selection
  const handleContextMenu = (event: React.MouseEvent) => {
    if (selectedText) {
      event.preventDefault();
      setContextMenu({
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
      });
    }
  };

  // Close context menu
  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  // Copy link to selection
  const copySelectionLink = () => {
    if (!fileId) {
      setSnackbarMessage('Cannot copy link: missing file information');
      setSnackbarOpen(true);
      handleContextMenuClose();
      return;
    }
    
    // Create link data object
    const linkData: PdfLinkData = {
      fileId,
      fileName,
      type: 'pdf',
      page: pageNumber,
      selection: selectedText,
      coordinates: selectionCoordinates || undefined
    };
    
    // Create link string
    const linkString = stringifyLinkData(linkData);
    
    navigator.clipboard.writeText(linkString)
      .then(() => {
        setSnackbarMessage('Selection link copied to clipboard');
        setSnackbarOpen(true);
      })
      .catch(err => {
        console.error('Failed to copy selection link:', err);
        setSnackbarMessage('Failed to copy link to clipboard');
        setSnackbarOpen(true);
      });
    
    handleContextMenuClose();
  };

  // Copy selection text only
  const copySelectionText = () => {
    navigator.clipboard.writeText(selectedText)
      .then(() => {
        setSnackbarMessage('Text copied to clipboard');
        setSnackbarOpen(true);
      })
      .catch(err => {
        console.error('Failed to copy text:', err);
        setSnackbarMessage('Failed to copy text to clipboard');
        setSnackbarOpen(true);
      });
    
    handleContextMenuClose();
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Navigation functions
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      setPageInputValue(newPage.toString());
    }
  };

  const goToNextPage = () => {
    if (numPages && pageNumber < numPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      setPageInputValue(newPage.toString());
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputBlur = () => {
    const newPage = parseInt(pageInputValue, 10);
    if (!isNaN(newPage) && newPage >= 1 && numPages && newPage <= numPages) {
      setPageNumber(newPage);
    } else {
      setPageInputValue(pageNumber.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 3));
    setFitMode('none');
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
    setFitMode('none');
  };

  const handleScaleChange = (_event: Event, newValue: number | number[]) => {
    const newScale = Array.isArray(newValue) ? newValue[0] : newValue;
    setScale(newScale);
    setFitMode('none');
  };

  // Rotation functions
  const rotateLeft = () => {
    setRotation((prevRotation) => (prevRotation - 90) % 360);
  };

  const rotateRight = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  // Fit modes
  const fitToWidth = () => {
    setFitMode('width');
    // Actual scale will be calculated in the page render based on container width
  };

  const fitToPage = () => {
    setFitMode('page');
    // Actual scale will be calculated in the page render based on container dimensions
  };

  // Search functions
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const performSearch = () => {
    if (!searchQuery.trim() || !documentRef.current) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    try {
      // This is a simplified search - in a real implementation, we would use PDF.js find API
      // For Phase 3, we'll just search in the text layers that are already rendered
      const results: SearchResult[] = [];
      textLayersRef.current.forEach((textLayer, pageIndex) => {
        if (!textLayer) return;
        
        const text = textLayer.textContent || '';
        const regex = new RegExp(searchQuery, 'gi');
        let match;
        let matchIndex = 0;
        
        while ((match = regex.exec(text)) !== null) {
          results.push({ pageIndex, matchIndex });
          matchIndex++;
        }
      });
      
      setSearchResults(results);
      setCurrentSearchIndex(results.length > 0 ? 0 : -1);
      
      // Navigate to the first result
      if (results.length > 0) {
        setPageNumber(results[0].pageIndex + 1);
        setPageInputValue((results[0].pageIndex + 1).toString());
        
        // Highlight the found text - in a full implementation, we would use PDF.js findController
        // This is just a simplified version for Phase 3
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const navigateSearchResults = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }
    
    setCurrentSearchIndex(newIndex);
    const result = searchResults[newIndex];
    
    setPageNumber(result.pageIndex + 1);
    setPageInputValue((result.pageIndex + 1).toString());
  };

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  // Store text layer references for search functionality
  const storeTextLayerRef = (textLayer: HTMLDivElement | null, pageIndex: number) => {
    if (textLayer) {
      textLayersRef.current[pageIndex] = textLayer;
    }
  };

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const viewerElement = containerRef.current;
      if (viewerElement) {
        viewerElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      document.exitFullscreen().catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };

  // Check fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Toolbar */}
      <Toolbar 
        variant="dense" 
        sx={{ 
          bgcolor: 'background.paper', 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        {/* Page Navigation Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Tooltip title="Previous Page">
            <span>
              <IconButton 
                size="small" 
                onClick={goToPrevPage} 
                disabled={pageNumber <= 1 || loading}
              >
                <NavigateBeforeIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <TextField
            size="small"
            value={pageInputValue}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            sx={{ width: '50px', mx: 1 }}
            disabled={loading}
            InputProps={{
              inputProps: { 
                min: 1, 
                max: numPages || 1,
                style: { textAlign: 'center', padding: '4px' }
              }
            }}
          />
          
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
            of {numPages || '-'}
          </Typography>
          
          <Tooltip title="Next Page">
            <span>
              <IconButton 
                size="small" 
                onClick={goToNextPage} 
                disabled={!numPages || pageNumber >= numPages || loading}
              >
                <NavigateNextIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        {/* Zoom Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Tooltip title="Zoom Out">
            <span>
              <IconButton 
                size="small" 
                onClick={zoomOut} 
                disabled={scale <= 0.5 || loading}
              >
                <ZoomOutIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Slider
            size="small"
            value={scale}
            min={0.5}
            max={3}
            step={0.1}
            onChange={handleScaleChange}
            sx={{ width: 100, mx: 1 }}
            disabled={loading}
          />
          
          <Tooltip title="Zoom In">
            <span>
              <IconButton 
                size="small" 
                onClick={zoomIn} 
                disabled={scale >= 3 || loading}
              >
                <ZoomInIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Typography variant="body2" sx={{ ml: 1, width: '45px' }}>
            {Math.round(scale * 100)}%
          </Typography>
        </Box>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        {/* Rotation and Fit Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Tooltip title="Rotate Left">
            <span>
              <IconButton 
                size="small" 
                onClick={rotateLeft} 
                disabled={loading}
              >
                <RotateLeftIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Rotate Right">
            <span>
              <IconButton 
                size="small" 
                onClick={rotateRight} 
                disabled={loading}
              >
                <RotateRightIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Fit to Width">
            <span>
              <IconButton 
                size="small" 
                onClick={fitToWidth} 
                disabled={loading}
                color={fitMode === 'width' ? 'primary' : 'default'}
              >
                <AspectRatioIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Fit to Page">
            <span>
              <IconButton 
                size="small" 
                onClick={fitToPage} 
                disabled={loading}
                color={fitMode === 'page' ? 'primary' : 'default'}
              >
                <FitScreenIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        {/* Search Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 150 }}>
          <TextField
            size="small"
            placeholder="Search…"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchResults.length > 0 ? (
                <InputAdornment position="end">
                  <Typography variant="caption" sx={{ whiteSpace: 'nowrap', mr: 1 }}>
                    {currentSearchIndex + 1} of {searchResults.length}
                  </Typography>
                </InputAdornment>
              ) : null
            }}
            sx={{ flex: 1 }}
          />
          
          {searchResults.length > 0 && (
            <>
              <Tooltip title="Previous Match">
                <IconButton size="small" onClick={() => navigateSearchResults('prev')}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Next Match">
                <IconButton size="small" onClick={() => navigateSearchResults('next')}>
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        {/* Fullscreen Toggle */}
        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          <IconButton size="small" onClick={toggleFullscreen}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
      
      {/* PDF Viewer */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: 'grey.100'
        }}
      >
        {error ? (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>Loading PDF...</Typography>
          </Box>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<CircularProgress />}
            options={{
              cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
              cMapPacked: true,
            }}
          >
            <Page
              key={`page_${pageNumber}`}
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              width={fitMode === 'width' ? containerRef.current?.clientWidth - 32 : undefined}
              height={fitMode === 'page' ? containerRef.current?.clientHeight - 48 : undefined}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              customTextRenderer={({ str }) => {
                return str;
              }}
            />
          </Document>
        )}
      </Box>
      
      {/* Context Menu for Selection */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={copySelectionLink} disabled={!fileId}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Link to Selection</ListItemText>
        </MenuItem>
        <MenuItem onClick={copySelectionText}>
          <ListItemIcon>
            <TextFormatIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Text</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default EnhancedPdfViewer;