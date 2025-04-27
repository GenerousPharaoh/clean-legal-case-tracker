import React from 'react';
import { Box, Typography, BoxProps, Button, SvgIconProps, Paper, useTheme } from '@mui/material';
import { SxProps, Theme } from '@mui/system';

// Available illustrations/icons for empty states
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import NotesIcon from '@mui/icons-material/Notes';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import ArticleIcon from '@mui/icons-material/Article';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LinkIcon from '@mui/icons-material/Link';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Import visual styles from our new utility
import { emptyStateStyles, animations } from '../styles/visualRefactor';

// Define available icon types
type IconType =
  | 'upload'
  | 'search'
  | 'notes'
  | 'folder'
  | 'document'
  | 'image'
  | 'article'
  | 'video'
  | 'audio'
  | 'file'
  | 'link'
  | 'info'
  | React.ElementType;

interface EmptyStateProps extends Omit<BoxProps, 'title'> {
  icon?: IconType;
  iconProps?: SvgIconProps;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  size?: 'small' | 'medium' | 'large';
  bordered?: boolean;
  iconSx?: SxProps<Theme>;
}

/**
 * EmptyState - A consistent and visually appealing component for empty states
 * 
 * Provides standardized empty state displays with optional icons, descriptions,
 * and action buttons. Can be used in different sizes and visual styles.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'info',
  iconProps,
  title,
  description,
  action,
  size = 'medium',
  bordered = false,
  iconSx = {},
  sx = {},
  ...boxProps
}) => {
  // Size-based styling
  const getSizing = () => {
    switch (size) {
      case 'small':
        return {
          padding: { xs: 1.5, sm: 2 },
          iconSize: 40,
          titleVariant: 'subtitle1' as const,
          descVariant: 'caption' as const,
          buttonSize: 'small' as const,
          gap: 1,
        };
      case 'large':
        return {
          padding: { xs: 2.5, sm: 4 },
          iconSize: 80,
          titleVariant: 'h5' as const,
          descVariant: 'body1' as const,
          buttonSize: 'medium' as const,
          gap: 2,
        };
      default: // medium
        return {
          padding: { xs: 2, sm: 3 },
          iconSize: 60,
          titleVariant: 'h6' as const,
          descVariant: 'body2' as const,
          buttonSize: 'medium' as const,
          gap: 1.5,
        };
    }
  };

  const theme = useTheme();
  const sizing = getSizing();

  // Get the appropriate icon component
  const IconComponent = (() => {
    if (typeof icon === 'string') {
      switch (icon) {
        case 'upload':
          return CloudUploadIcon;
        case 'search':
          return SearchIcon;
        case 'notes':
          return NotesIcon;
        case 'folder':
          return FolderIcon;
        case 'document':
          return DescriptionIcon;
        case 'image':
          return ImageIcon;
        case 'article':
          return ArticleIcon;
        case 'video':
          return VideoFileIcon;
        case 'audio':
          return AudioFileIcon;
        case 'file':
          return InsertDriveFileIcon;
        case 'link':
          return LinkIcon;
        case 'info':
        default:
          return InfoOutlinedIcon;
      }
    }
    return icon;
  })();

  // Container component - either Box or Paper based on bordered prop
  const Container = bordered ? Paper : Box;

  return (
    <Container
      elevation={bordered ? 0 : undefined}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: sizing.padding,
        height: size === 'small' ? 'auto' : '100%',
        ...(bordered && {
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: theme.shape.borderRadius,
          bgcolor: theme.palette.mode === 'light' 
            ? 'rgba(0, 0, 0, 0.01)' 
            : 'rgba(255, 255, 255, 0.01)',
        }),
        ...emptyStateStyles.container(theme),
        ...animations.fadeIn,
        ...sx,
      }}
      {...boxProps}
    >
      <IconComponent
        sx={{
          fontSize: sizing.iconSize,
          color: 'text.secondary',
          mb: sizing.gap,
          opacity: 0.8,
          ...animations.pulse,
          ...emptyStateStyles.icon(theme),
          ...iconSx,
        }}
        {...iconProps}
      />
      <Typography
        variant={sizing.titleVariant}
        color="text.primary"
        gutterBottom
        sx={{ 
          fontWeight: 500,
          mb: 1, 
          maxWidth: 'calc(100% - 32px)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant={sizing.descVariant}
          color="text.secondary"
          sx={{ 
            maxWidth: { xs: 240, sm: 300 }, 
            mb: action ? sizing.gap : 0,
            px: 1,
          }}
        >
          {description}
        </Typography>
      )}
      {action && (
        <Button
          variant="contained"
          color="primary"
          onClick={action.onClick}
          disabled={action.disabled}
          size={sizing.buttonSize}
          disableElevation
          sx={{ 
            mt: sizing.gap,
            transition: theme.transitions.create(['background-color', 'box-shadow', 'transform'], {
              duration: theme.transitions.duration.shorter,
            }),
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[2],
            },
          }}
        >
          {action.label}
        </Button>
      )}
    </Container>
  );
};

export default EmptyState; 