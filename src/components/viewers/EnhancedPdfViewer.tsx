import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Box, CircularProgress, Typography, TextField, IconButton, Tooltip, Paper, Alert, Button } from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Search as SearchIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Rotate90DegreesCcw as RotateLeftIcon,
  Rotate90DegreesCw as RotateRightIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import storageService from '../../services/storageService';

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  '/pdf/pdf.worker.min.js',
  window.location.origin
).href;

// Interface for component props
interface EnhancedPdfViewerProps {
  url?: string;
  fileName?: string;
  onPageChange?: (pageNumber: number) => void;
  initialPage?: number;
}

// Export handle interface so parent components can control the viewer
export interface PdfViewerHandle {
  goToPage: (pageNumber: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  rotate: (delta: number) => void;
}

// Internal component that will receive the forwarded ref
const EnhancedPdfViewerInner = (
  { url, fileName, onPageChange, initialPage = 1 }: EnhancedPdfViewerProps,
  ref: React.ForwardedRef<PdfViewerHandle>
) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const documentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Log when URL changes
  useEffect(() => {
    if (url) {
      console.log('[EnhancedPdfViewer] Received URL:', url);
    setLoading(true);
    setError(null);
        } else {
        setLoading(false);
      }
  }, [url]);

  // Document load success handler
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  // Document load error handler
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('[EnhancedPdfViewer] Error loading document:', error);
    setLoading(false);
    setError(`Failed to load PDF: ${error.message}`);
  }, []);

  // Page change handlers
  const goToPrevPage = useCallback(() => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      if (onPageChange) onPageChange(newPage);
    }
  }, [pageNumber, onPageChange]);

  const goToNextPage = useCallback(() => {
    if (numPages && pageNumber < numPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      if (onPageChange) onPageChange(newPage);
    }
  }, [pageNumber, numPages, onPageChange]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && (!numPages || page <= numPages)) {
      setPageNumber(page);
      if (onPageChange) onPageChange(page);
    }
  }, [numPages, onPageChange]);

  // Zoom handlers
  const zoomIn = useCallback(() => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  }, []);

  // Rotation handlers
  const rotateLeft = useCallback(() => {
    setRotation((prevRotation) => (prevRotation - 90) % 360);
  }, []);

  const rotateRight = useCallback(() => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  }, []);

  const rotate = useCallback((delta: number) => {
    setRotation((prevRotation) => (prevRotation + delta) % 360);
  }, []);

  // Search handler
  const handleSearch = useCallback(() => {
    // Simple implementation using browser search functionality if available
    if (searchText) {
      try {
        // Check if find is available as a method on window (not in all browsers)
        if (typeof window !== 'undefined' && 'find' in window) {
          // @ts-ignore - window.find is not in TypeScript definitions but exists in most browsers
          window.find(searchText);
        } else {
          // Fallback if window.find is not available
          console.log('Browser search not available, implementing custom search would be needed');
        }
      } catch (error) {
        console.error('Error using find functionality:', error);
      }
    }
  }, [searchText]);

  // Handle page number input
  const handlePageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (!isNaN(value) && value > 0 && numPages && value <= numPages) {
        setPageNumber(value);
        if (onPageChange) onPageChange(value);
      }
    },
    [numPages, onPageChange]
  );

  // Retry loading
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRetries(retries + 1);
  }, [retries]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [url, fileName]);

  // Add keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') {
        return; // Don't trigger shortcuts when typing in an input field
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          if (!e.ctrlKey) goToPrevPage();
          break;
        case 'ArrowRight':
          if (!e.ctrlKey) goToNextPage();
          break;
        case '+':
        case '=':
          if (e.ctrlKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case 'r':
          if (e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            rotateRight();
          } else if (e.ctrlKey) {
            e.preventDefault();
            rotateLeft();
          }
          break;
        case 'f':
          if (e.ctrlKey) {
            e.preventDefault();
            // Focus on the search input
            const searchInput = document.querySelector('[data-testid="pdf-search-input"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
      }
          }
          break;
        default:
          break;
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut, rotateLeft, rotateRight]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    goToPage,
    goToNextPage,
    goToPrevPage,
    zoomIn,
    zoomOut,
    rotate,
  }), [goToPage, goToNextPage, goToPrevPage, zoomIn, zoomOut, rotate]);

  // Render toolbar
  const renderToolbar = () => (
    <Paper
      elevation={2}
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 1,
        mb: 2,
        flexWrap: 'wrap',
      }}
    >
      <IconButton onClick={goToPrevPage} disabled={pageNumber <= 1 || loading} size="small">
        <PrevIcon />
              </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          size="small"
          type="number"
          value={pageNumber}
          onChange={handlePageChange}
          inputProps={{ min: 1, max: numPages || 1, style: { width: '40px', textAlign: 'center' } }}
          sx={{ mx: 1 }}
          disabled={loading || !numPages}
        />
        <Typography variant="body2">
          / {numPages || '-'}
          </Typography>
        </Box>
        
      <IconButton onClick={goToNextPage} disabled={loading || !numPages || pageNumber >= numPages} size="small">
        <NextIcon />
      </IconButton>

      <Box sx={{ height: '24px', width: '1px', bgcolor: 'divider', mx: 1 }} />

      <Tooltip title="Zoom out (Ctrl+-)">
            <span>
          <IconButton onClick={zoomOut} size="small" disabled={loading}>
            <ZoomOutIcon />
              </IconButton>
            </span>
          </Tooltip>
          
      <Typography variant="body2" sx={{ minWidth: '40px', textAlign: 'center' }}>
        {Math.round(scale * 100)}%
          </Typography>
          
      <Tooltip title="Zoom in (Ctrl++)">
            <span>
          <IconButton onClick={zoomIn} size="small" disabled={loading}>
            <ZoomInIcon />
              </IconButton>
            </span>
          </Tooltip>

      <Box sx={{ height: '24px', width: '1px', bgcolor: 'divider', mx: 1 }} />
        
      <Tooltip title="Rotate left (Ctrl+r)">
            <span>
          <IconButton onClick={rotateLeft} size="small" disabled={loading}>
            <RotateLeftIcon />
              </IconButton>
            </span>
          </Tooltip>
          
      <Tooltip title="Rotate right (Ctrl+Shift+r)">
            <span>
          <IconButton onClick={rotateRight} size="small" disabled={loading}>
            <RotateRightIcon />
              </IconButton>
            </span>
          </Tooltip>

      <Box sx={{ height: '24px', width: '1px', bgcolor: 'divider', mx: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            size="small"
          placeholder="Search... (Ctrl+f)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ width: '120px' }}
          disabled={loading}
          data-testid="pdf-search-input"
        />
        <IconButton onClick={handleSearch} size="small" disabled={loading || !searchText}>
          <SearchIcon />
        </IconButton>
      </Box>

      <Box sx={{ height: '24px', width: '1px', bgcolor: 'divider', mx: 1 }} />
          
      <Tooltip title="Download PDF">
            <span>
          <IconButton onClick={handleDownload} size="small" disabled={!url || loading}>
            <DownloadIcon />
              </IconButton>
            </span>
          </Tooltip>
      </Paper>
  );

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.default',
        p: 2,
        overflowY: 'auto',
        tabIndex: 0, // Make the container focusable for keyboard events
      }}
    >
      {renderToolbar()}

      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflowY: 'auto',
          position: 'relative',
        }}
        ref={documentRef}
      >
        {loading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box 
            sx={{ 
              p: 3, 
              textAlign: 'center', 
              maxWidth: '80%',
              marginX: 'auto',
            }}
          >
            <Alert 
              severity="error" 
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  startIcon={<RefreshIcon />}
                  onClick={handleRetry}
                >
                  Retry
                </Button>
              }
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              You can try to download the file and open it externally
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 2 }}
              disabled={!url}
            >
              Download
            </Button>
          </Box>
        )}

        {!error && url ? (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<></>}
            key={`pdf-document-${retries}`} // Force re-render on retry
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              loading={<></>}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              canvasBackground="transparent"
            />
          </Document>
        ) : !error && !loading ? (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 4 }}>
            No document selected
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
};

// Export the component wrapped with forwardRef
const EnhancedPdfViewer = forwardRef<PdfViewerHandle, EnhancedPdfViewerProps>(EnhancedPdfViewerInner);

export default EnhancedPdfViewer; 