import { useState } from 'react';
import { Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import aiService from '../../services/aiService';

interface LegalAnalyzerProps {
  projectId?: string;
  onAnalysisComplete?: (analysis: any) => void;
}

/**
 * Legal text analyzer component using Gemini 2.5 Pro
 */
export default function LegalAnalyzer({ projectId, onAnalysisComplete }: LegalAnalyzerProps) {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await aiService.analyzeWritingContext(text, projectId);
      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err: any) {
      console.error('Error analyzing text:', err);
      setError(err.message || 'Failed to analyze text');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        label="Enter legal text to analyze"
        multiline
        rows={6}
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isAnalyzing}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={handleAnalyze}
        disabled={isAnalyzing || !text.trim()}
        startIcon={isAnalyzing ? <CircularProgress size={20} /> : null}
        sx={{ mb: 2 }}
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
      </Button>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.lightest' }}>
          <Typography color="error" variant="body2">
            Error: {error}
          </Typography>
        </Paper>
      )}

      {analysis && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Analysis Results
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Summary</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{analysis.summary}</Typography>
          
          <Typography variant="subtitle1">Key Entities</Typography>
          <Box component="ul" sx={{ mb: 2 }}>
            {analysis.entities.map((entity: any, i: number) => (
              <Typography component="li" key={i} variant="body2">
                <strong>{entity.name}</strong> ({entity.type})
              </Typography>
            ))}
          </Box>
          
          <Typography variant="subtitle1">Important Dates</Typography>
          <Box component="ul" sx={{ mb: 2 }}>
            {analysis.dates.map((date: any, i: number) => (
              <Typography component="li" key={i} variant="body2">
                <strong>{date.date}</strong>: {date.significance}
              </Typography>
            ))}
          </Box>
          
          <Typography variant="subtitle1">Legal Concepts</Typography>
          <Box component="ul" sx={{ mb: 2 }}>
            {analysis.legalConcepts.map((concept: string, i: number) => (
              <Typography component="li" key={i} variant="body2">
                {concept}
              </Typography>
            ))}
          </Box>
          
          <Typography variant="subtitle1">Suggested Topics</Typography>
          <Box component="ul" sx={{ mb: 2 }}>
            {analysis.suggestedTopics.map((topic: string, i: number) => (
              <Typography component="li" key={i} variant="body2">
                {topic}
              </Typography>
            ))}
          </Box>
          
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
            AI Confidence: {(analysis.confidenceScore * 100).toFixed(0)}%
          </Typography>
        </Paper>
      )}
    </Box>
  );
} 