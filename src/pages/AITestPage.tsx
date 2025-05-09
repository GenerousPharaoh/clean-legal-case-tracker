import { Box, Container, Typography } from '@mui/material';
import LegalAnalyzer from '../components/ai/LegalAnalyzer';

/**
 * Test page for AI features
 */
export default function AITestPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Feature Test Page
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4 }}>
        This page lets you test the Gemini 2.5 Pro integration with our app. Enter some legal text to analyze
        and see the AI-generated results.
      </Typography>
      
      <Box sx={{ 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 3,
        boxShadow: 1
      }}>
        <Typography variant="h5" gutterBottom>
          Legal Text Analyzer
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Powered by Google Gemini 2.5 Pro
        </Typography>
        
        <LegalAnalyzer />
      </Box>
    </Container>
  );
} 