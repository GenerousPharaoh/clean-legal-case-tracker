import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  CardHeader,
  Avatar,
  Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import type { Case } from '../types/database';

interface CaseCardProps {
  caseItem: Case;
  onEdit: (caseItem: Case) => void;
  onArchive: (caseId: string, isArchived: boolean) => Promise<void>;
  onOpen: (caseId: string) => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({
  caseItem,
  onEdit,
  onArchive,
  onOpen
}) => {
  // Format date string
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Unknown date';
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.warn('[CaseCard] Invalid date format:', dateString);
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('[CaseCard] Error formatting date:', err);
      return 'Error with date';
    }
  };

  // Get status chip color
  const getStatusColor = (status?: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'closed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        opacity: caseItem.is_archived ? 0.7 : 1,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: getStatusColor(caseItem.status) }}>
            <PersonIcon />
          </Avatar>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {caseItem.name}
            {caseItem.is_archived && (
              <Chip size="small" label="Archived" color="default" />
            )}
          </Box>
        }
        subheader={`Created: ${formatDate(caseItem.created_at)}`}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={caseItem.status || 'Active'} 
            size="small" 
            color={getStatusColor(caseItem.status)}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ 
          minHeight: '3em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {caseItem.description || 'No description provided'}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title="Open Case">
            <span>
              <IconButton 
                size="small"
                onClick={() => onOpen(caseItem.id)}
                sx={{ color: 'primary.main' }}
              >
                Open
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <Box>
          <Tooltip title="Edit">
            <IconButton 
              size="small"
              onClick={() => onEdit(caseItem)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={caseItem.is_archived ? 'Unarchive' : 'Archive'}>
            <IconButton 
              size="small"
              onClick={() => onArchive(caseItem.id, !!caseItem.is_archived)}
            >
              {caseItem.is_archived ? 
                <UnarchiveIcon fontSize="small" /> : 
                <ArchiveIcon fontSize="small" />
              }
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default CaseCard;
