import React from 'react';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { FileType } from '../store';
import { SvgIconProps } from '@mui/material/SvgIcon';

interface FileIconProps extends SvgIconProps {
  fileType: string;
}

const FileIcon: React.FC<FileIconProps> = ({ fileType, ...props }) => {
  switch (fileType) {
    case FileType.PDF:
      return <PictureAsPdfIcon color="error" {...props} />;
    case FileType.IMAGE:
      return <ImageIcon color="primary" {...props} />;
    case FileType.VIDEO:
      return <VideocamIcon color="secondary" {...props} />;
    case FileType.AUDIO:
      return <AudioFileIcon color="success" {...props} />;
    default:
      return <InsertDriveFileIcon color="action" {...props} />;
  }
};

export default FileIcon; 