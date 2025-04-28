import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Tabs, Tab, Paper, Divider, IconButton, Alert, Tooltip, Skeleton, Chip, Snackbar, InputAdornment } from '@mui/material';
import { Fade } from './SafeTransitions';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import HistoryIcon from '@mui/icons-material/History';
import ArticleIcon from '@mui/icons-material/Article';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { AIService, AnalyzeResponse } from '../services/AIService';
import { useFileStore } from '../store';
import { Fade as SafeFade } from './SafeTransitions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface HistoryItem {
  question?: string;
  response: AnalyzeResponse;
  timestamp: number;
  type: 'summary' | 'qa';
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      style={{ height: '100%', overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AIAssistPanel: React.FC = () => {
  // Get selected file from store
  const { selectedFile } = useFileStore();
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Question state
  const [question, setQuestion] = useState('');
  
  // Results state
  const [summary, setSummary] = useState<AnalyzeResponse | null>(null);
  const [answer, setAnswer] = useState<AnalyzeResponse | null>(null);
  
  // Loading states
  const [summarizing, setSummarizing] = useState(false);
  const [answering, setAnswering] = useState(false);
  
  // History tracking
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Clipboard feedback
  const [copySnackbar, setCopySnackbar] = useState(false);
  
  // Reset responses when file changes
  useEffect(() => {
    setSummary(null);
    setAnswer(null);
    setQuestion('');
  }, [selectedFile?.id]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);
  };
  
  const clearQuestion = () => {
    setQuestion('');
  };
  
  const toggleHistory = () => {
    setShowHistory(prev => !prev);
  };
  
  const handleSummarize = async () => {
    if (!selectedFile) return;
    
    setSummarizing(true);
    setSummary(null);
    
    try {
      const result = await AIService.summarizeFile(selectedFile.id);
      setSummary(result);
      
      // Add to history if successful
      if (result.success) {
        setHistory(prev => [
          {
            response: result,
            timestamp: Date.now(),
            type: 'summary'
          },
          ...prev.slice(0, 9) // Keep only 10 most recent
        ]);
      }
    } catch (error: unknown) {
      console.error('Error summarizing file:', error);
      setSummary({
        success: false,
        result: '',
        task: 'summarize',
        error: error instanceof Error ? error.message : 'Failed to summarize file'
      });
    } finally {
      setSummarizing(false);
    }
  };
  
  const handleAskQuestion = async () => {
    if (!selectedFile || !question.trim()) return;
    
    setAnswering(true);
    setAnswer(null);
    
    try {
      const result = await AIService.askQuestion(selectedFile.id, question);
      setAnswer(result);
      
      // Add to history if successful
      if (result.success) {
        setHistory(prev => [
          {
            question,
            response: result,
            timestamp: Date.now(),
            type: 'qa'
          },
          ...prev.slice(0, 9) // Keep only 10 most recent
        ]);
      }
    } catch (error: unknown) {
      console.error('Error asking question:', error);
      setAnswer({
        success: false,
        result: '',
        task: 'qa',
        error: error instanceof Error ? error.message : 'Failed to answer question'
      });
    } finally {
      setAnswering(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySnackbar(true);
  };

  const handleCloseCopySnackbar = () => {
    setCopySnackbar(false);
  };
  
  const loadHistoryItem = (item: HistoryItem) => {
    if (item.type === 'summary') {
      setSummary(item.response);
      setTabValue(0);
    } else {
      setAnswer(item.response);
      setQuestion(item.question || '');
      setTabValue(1);
    }
    setShowHistory(false);
  };
  
  if (!selectedFile) {
    return (
      <Box sx={{ 
        p: 3, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 2
      }}>
        <ArticleIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.7 }} />
        <Typography variant="h6" color="text.secondary" align="center">
          Select a file to use AI assistance
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          The AI can summarize documents and answer questions about their content
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="AI assist tabs"
          sx={{ flex: 1 }}
        >
          <Tab 
            icon={<ArticleIcon fontSize="small" />} 
            iconPosition="start" 
            label="Summarize" 
            id="ai-tab-0" 
            aria-controls="ai-tabpanel-0" 
          />
          <Tab 
            icon={<QuestionAnswerIcon fontSize="small" />} 
            iconPosition="start" 
            label="Ask" 
            id="ai-tab-1" 
            aria-controls="ai-tabpanel-1" 
          />
        </Tabs>
        <Tooltip title="View history">
          <IconButton 
            onClick={toggleHistory}
            color={showHistory ? "primary" : "default"}
            sx={{ mr: 1 }}
          >
            <HistoryIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <SafeFade in={showHistory}>
        {showHistory ? (
          <Paper 
            elevation={0} 
            variant="outlined" 
            sx={{ 
              m: 1, 
              maxHeight: '300px',
              overflow: 'auto'
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Recent History
              </Typography>
              {history.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No history yet. Summarize a document or ask a question to get started.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {history.map((item, index) => (
                    <Paper 
                      key={index} 
                      variant="outlined" 
                      sx={{ 
                        p: 1.5, 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' } 
                      }}
                      onClick={() => loadHistoryItem(item)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {item.type === 'summary' ? (
                          <ArticleIcon fontSize="small" color="primary" />
                        ) : (
                          <QuestionAnswerIcon fontSize="small" color="primary" />
                        )}
                        <Typography variant="body2" fontWeight="medium">
                          {item.type === 'summary' 
                            ? 'Document Summary' 
                            : `Q: ${item.question?.substring(0, 50)}${item.question && item.question.length > 50 ? '...' : ''}`}
                        </Typography>
                        <Chip 
                          label={new Date(item.timestamp).toLocaleTimeString()} 
                          size="small" 
                          variant="outlined"
                          sx={{ ml: 'auto', fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.response.result.substring(0, 100)}
                        {item.response.result.length > 100 ? '...' : ''}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        ) : <Box />}
      </SafeFade>
      
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip 
              label={selectedFile.name} 
              variant="outlined" 
              size="small" 
            />
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {new Intl.NumberFormat().format(selectedFile.size)} bytes | {selectedFile.content_type}
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleSummarize}
            disabled={summarizing}
            startIcon={summarizing ? <CircularProgress size={16} /> : undefined}
            sx={{ mb: 2, alignSelf: 'flex-start' }}
          >
            {summarizing ? 'Generating Summary...' : 'Generate Summary'}
          </Button>
          
          {summarizing && (
            <Box sx={{ my: 2 }}>
              <Skeleton variant="rounded" height={120} animation="wave" sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={120} animation="wave" />
            </Box>
          )}
          
          {summary && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                flex: 1, 
                overflow: 'auto',
                backgroundColor: 'background.paper',
                transition: 'all 0.2s'
              }}
            >
              {summary.error ? (
                <Alert severity="error">
                  {summary.error}
                </Alert>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Document Summary</Typography>
                    <Tooltip title="Copy to clipboard">
                      <IconButton 
                        size="small" 
                        onClick={() => copyToClipboard(summary.result)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" component="div" sx={{ lineHeight: 1.6 }}>
                    {summary.result.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip 
              label={selectedFile.name} 
              variant="outlined" 
              size="small" 
            />
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {new Intl.NumberFormat().format(selectedFile.size)} bytes | {selectedFile.content_type}
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            label="Ask a question about this file"
            placeholder="e.g., What are the key terms of this agreement? Who are the main parties involved?"
            multiline
            rows={2}
            value={question}
            onChange={handleQuestionChange}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: question && (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear question"
                    onClick={clearQuestion}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleAskQuestion}
            disabled={answering || !question.trim()}
            startIcon={answering ? <CircularProgress size={16} /> : undefined}
            sx={{ mb: 2, alignSelf: 'flex-start' }}
          >
            {answering ? 'Finding Answer...' : 'Ask Question'}
          </Button>
          
          {answering && (
            <Box sx={{ my: 2 }}>
              <Skeleton variant="rounded" height={120} animation="wave" sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={120} animation="wave" />
            </Box>
          )}
          
          {answer && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                flex: 1, 
                overflow: 'auto',
                backgroundColor: 'background.paper',
                transition: 'all 0.2s'
              }}
            >
              {answer.error ? (
                <Alert severity="error">
                  {answer.error}
                </Alert>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Answer</Typography>
                    <Tooltip title="Copy to clipboard">
                      <IconButton 
                        size="small" 
                        onClick={() => copyToClipboard(answer.result)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" component="div" sx={{ lineHeight: 1.6 }}>
                    {answer.result.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </TabPanel>
      
      <Snackbar
        open={copySnackbar}
        autoHideDuration={2000}
        onClose={handleCloseCopySnackbar}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AIAssistPanel; 