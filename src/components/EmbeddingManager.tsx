import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Alert, 
  Paper, 
  Tooltip,
  Divider,
} from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useProjectStore } from '../store/projectStore';

interface EmbeddingManagerProps {
  projectId: string;
}

/**
 * Component for managing document embeddings for RAG capabilities
 */
const EmbeddingManager: React.FC<EmbeddingManagerProps> = ({ projectId }) => {
  const { generateEmbeddingsForProject } = useProjectStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  }>({});

  const handleGenerateEmbeddings = async () => {
    if (!projectId || isProcessing) return;
    
    setIsProcessing(true);
    setResult({});
    
    try {
      const result = await generateEmbeddingsForProject(projectId);
      setResult(result);
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'An unexpected error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <BiotechIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Document Embeddings
        </Typography>
        <Tooltip title="Generate embeddings to enable AI-powered search and Q&A across all documents in this project">
          <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: 0.5, opacity: 0.7 }} />
        </Tooltip>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Generate vector embeddings for all documents in this project to enable cross-document search and question answering.
      </Typography>
      
      {result.success === true && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {result.message || 'Embeddings generated successfully'}
        </Alert>
      )}
      
      {result.success === false && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {result.error || 'Failed to generate embeddings'}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={isProcessing ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleGenerateEmbeddings}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Generate Embeddings'}
        </Button>
      </Box>
    </Paper>
  );
};

export default EmbeddingManager; 