import React from 'react';
import { 
  PictureAsPdf,
  Image,
  AudioFile,
  VideoFile,
  Description,
  Code,
  InsertDriveFile,
  TextSnippet,
  Streetview, // Changed from Streetview360 to Streetview
  Archive,
  TableChart,
  EventNote
} from '@mui/icons-material';
import { SxProps, Box, Typography } from '@mui/material';

// Mapping of file extensions to MIME types for common file types
const FILE_EXTENSION_MAP: Record<string, string> = {
  // Documents
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'txt': 'text/plain',
  'rtf': 'application/rtf',
  'odt': 'application/vnd.oasis.opendocument.text',
  
  // Spreadsheets
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'csv': 'text/csv',
  'ods': 'application/vnd.oasis.opendocument.spreadsheet',
  
  // Presentations
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'odp': 'application/vnd.oasis.opendocument.presentation',
  
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'flac': 'audio/flac',
  'm4a': 'audio/mp4',
  
  // Video
  'mp4': 'video/mp4',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'wmv': 'video/x-ms-wmv',
  'mkv': 'video/x-matroska',
  'webm': 'video/webm',
  
  // Code
  'html': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'ts': 'text/typescript',
  'jsx': 'text/jsx',
  'tsx': 'text/tsx',
  'json': 'application/json',
  'xml': 'application/xml',
  'py': 'text/x-python',
  'java': 'text/x-java',
  'c': 'text/x-c',
  'cpp': 'text/x-c++',
  'php': 'application/x-php',
  
  // Archives
  'zip': 'application/zip',
  'rar': 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip',
  
  // Other
  'eml': 'message/rfc822',
  'msg': 'application/vnd.ms-outlook',
};

// Map MIME type categories to icon components
const MIME_TYPE_ICONS: Record<string, React.ReactNode> = {
  'application/pdf': <PictureAsPdf color="error" />,
  'image': <Image color="primary" />,
  'audio': <AudioFile color="secondary" />,
  'video': <VideoFile color="success" />,
  'text': <TextSnippet color="info" />,
  'application/msword': <Description color="primary" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <Description color="primary" />,
  'application/vnd.ms-excel': <TableChart color="success" />,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <TableChart color="success" />,
  'application/vnd.ms-powerpoint': <EventNote color="warning" />,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': <EventNote color="warning" />,
  'application/json': <Code />,
  'application/xml': <Code />,
  'text/html': <Code />,
  'text/javascript': <Code />,
  'application/zip': <Archive />,
  'application/vnd.rar': <Archive />,
  'application/x-7z-compressed': <Archive />,
  'model': <Streetview />,
};

interface FileTypeIconProps {
  fileName: string;
  mimeType?: string;
  fileType?: string;
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps;
  showExtension?: boolean;
}

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ 
  fileName, 
  mimeType, 
  fileType,
  size = 'medium', 
  sx = {},
  showExtension = false
}) => {
  const getFileExtension = (name: string): string => {
    return name.split('.').pop()?.toLowerCase() || '';
  };
  
  const getIconByFileName = (name: string, type?: string, mime?: string): React.ReactNode => {
    const extension = getFileExtension(name);
    
    // If mime type is provided, use it first
    if (mime) {
      // Check for exact match
      if (MIME_TYPE_ICONS[mime]) {
        return MIME_TYPE_ICONS[mime];
      }
      
      // Check for category match
      const category = mime.split('/')[0];
      if (MIME_TYPE_ICONS[category]) {
        return MIME_TYPE_ICONS[category];
      }
    }
    
    // If file type is provided, use that
    if (type && MIME_TYPE_ICONS[type]) {
      return MIME_TYPE_ICONS[type];
    }
    
    // Try to determine from extension
    if (extension && FILE_EXTENSION_MAP[extension]) {
      const extensionMime = FILE_EXTENSION_MAP[extension];
      
      // Check for exact match
      if (MIME_TYPE_ICONS[extensionMime]) {
        return MIME_TYPE_ICONS[extensionMime];
      }
      
      // Check for category match
      const extensionCategory = extensionMime.split('/')[0];
      if (MIME_TYPE_ICONS[extensionCategory]) {
        return MIME_TYPE_ICONS[extensionCategory];
      }
    }
    
    // Default icon
    return <InsertDriveFile />;
  };
  
  const icon = getIconByFileName(fileName, fileType, mimeType);
  const extension = getFileExtension(fileName);
  
  const iconSizing = {
    small: { width: 24, height: 24, fontSize: 12 },
    medium: { width: 40, height: 40, fontSize: 14 },
    large: { width: 56, height: 56, fontSize: 16 }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...iconSizing[size],
        ...sx
      }}
    >
      {icon}
      {showExtension && extension && (
        <Typography variant="caption" sx={{ fontSize: iconSizing[size].fontSize, mt: 0.5 }}>
          {extension.toUpperCase()}
        </Typography>
      )}
    </Box>
  );
};

export default FileTypeIcon; 