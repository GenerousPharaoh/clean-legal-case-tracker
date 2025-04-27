import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

interface Entity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money';
  confidence: number;
}

interface Insight {
  title: string;
  description: string;
  relevance: number;
}

/**
 * InsightsPanel component for displaying AI-generated insights
 */
export const InsightsPanel: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState<string | false>('panel1');

  // Mock data
  const entities: Entity[] = [
    { name: 'John Smith', type: 'person', confidence: 0.95 },
    { name: 'Acme Corporation', type: 'organization', confidence: 0.88 },
    { name: 'May 15, 2023', type: 'date', confidence: 0.92 },
    { name: 'San Francisco', type: 'location', confidence: 0.85 },
    { name: '$250,000', type: 'money', confidence: 0.9 }
  ];

  const insights: Insight[] = [
    {
      title: 'Potential Contract Breach',
      description: 'Document suggests a potential breach of contract regarding delivery timelines.',
      relevance: 0.87
    },
    {
      title: 'Missing Documentation',
      description: 'References to exhibits A and C, but exhibit B is not mentioned.',
      relevance: 0.75
    },
    {
      title: 'Related Case Reference',
      description: 'Case number 2023-CV-4872 mentioned may relate to ongoing litigation.',
      relevance: 0.82
    }
  ];

  const handleAnalyze = () => {
    setAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      setAnalyzing(false);
    }, 2000);
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getEntityIcon = (type: Entity['type']) => {
    switch (type) {
      case 'person':
        return <PersonIcon color="primary" />;
      case 'organization':
        return <BusinessIcon color="secondary" />;
      case 'location':
        return <LocationOnIcon color="error" />;
      case 'date':
        return <CalendarTodayIcon color="success" />;
      case 'money':
        return <AttachMoneyIcon color="warning" />;
      default:
        return <PersonIcon />;
    }
  };

  const formatConfidence = (confidence: number) => `${Math.round(confidence * 100)}%`;

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }}>
          <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
          Insights
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        {/* Analysis Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleAnalyze}
          disabled={analyzing}
          sx={{ mb: 2 }}
        >
          {analyzing ? 'Analyzing...' : 'Analyze Selected Document'}
        </Button>
        
        {analyzing && (
          <LinearProgress sx={{ mb: 2 }} />
        )}

        {/* Entities Section */}
        <Accordion 
          expanded={expanded === 'panel1'} 
          onChange={handleAccordionChange('panel1')}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography fontWeight={500}>Entities</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {entities.map((entity, index) => (
                <ListItem 
                  key={index}
                  sx={{ 
                    py: 1, 
                    borderBottom: index < entities.length - 1 ? '1px solid' : 'none', 
                    borderColor: 'divider' 
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getEntityIcon(entity.type)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={entity.name} 
                    secondary={entity.type.charAt(0).toUpperCase() + entity.type.slice(1)} 
                  />
                  <Chip 
                    label={formatConfidence(entity.confidence)} 
                    size="small" 
                    variant="outlined"
                    color={entity.confidence > 0.9 ? 'success' : 'default'}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Insights Section */}
        <Accordion 
          expanded={expanded === 'panel2'} 
          onChange={handleAccordionChange('panel2')}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2a-content"
            id="panel2a-header"
          >
            <Typography fontWeight={500}>Key Insights</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {insights.map((insight, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: 2, 
                    p: 1.5, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {insight.title}
                    </Typography>
                    <Chip 
                      label={`${Math.round(insight.relevance * 100)}%`} 
                      size="small"
                      color={insight.relevance > 0.8 ? 'primary' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2">
                    {insight.description}
                  </Typography>
                </Box>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Paper>
  );
}; 