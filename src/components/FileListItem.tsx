import React, { useState } from 'react';
import { ListItemButton, ListItemIcon, ListItemText, ListItemSecondaryAction, Typography, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField, ListItemIcon as MuiListItemIcon } from '@mui/material';
import { Fade } from './SafeTransitions';
import FileIcon from './FileIcon';
import { File, useFileStore } from '../store';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EnhancedTooltip from './EnhancedTooltip';
import { cssTransitions } from '../utils/transitions';

interface FileListItemProps {
  file: File;
  readOnly?: boolean; // Add readOnly prop for client uploaders
}

/**
 * FileListItem - Displays a file in the file list with actions
 */
const FileListItem: React.FC<FileListItemProps> = ({ file, readOnly = false }) => {
  const { selectedFileId, setSelectedFileId, setSelectedFile, deleteFile, updateFile } = useFileStore();
  
  // Local state for menus and dialogs
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    fileName: string;
    error: string;
  }>({
    open: false,
    fileName: file.name,
    error: ''
  });
  
  // Format file size to human-readable
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date in a readable way
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get file extension
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  const handleSelectFile = () => {
    setSelectedFileId(file.id);
    setSelectedFile(file);
  };
  
  // Menu handling
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };
  
  // Delete file
  const handleDeleteFile = () => {
    setConfirmDialog({
      open: true,
      title: 'Delete File',
      message: `Are you sure you want to delete "${file.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        await deleteFile(file.id);
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
    handleCloseMenu();
  };
  
  // Rename file
  const handleOpenRenameDialog = () => {
    setRenameDialog({
      open: true,
      fileName: file.name,
      error: ''
    });
    handleCloseMenu();
  };
  
  const handleCloseRenameDialog = () => {
    setRenameDialog({
      ...renameDialog,
      open: false
    });
  };
  
  const handleRenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRenameDialog({
      ...renameDialog,
      fileName: e.target.value,
      error: e.target.value.trim() === '' ? 'File name cannot be empty' : ''
    });
  };
  
  const handleRenameSubmit = async () => {
    if (renameDialog.fileName.trim() === '') {
      setRenameDialog({
        ...renameDialog,
        error: 'File name cannot be empty'
      });
      return;
    }
    
    await updateFile(file.id, { name: renameDialog.fileName });
    handleCloseRenameDialog();
  };
  
  // Dialog closing
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  const isSelected = selectedFileId === file.id;
  
  // Prepare tooltip description
  const tooltipDescription = (
    <>
      <strong>Size:</strong> {formatFileSize(file.size)}<br />
      <strong>Type:</strong> {file.file_type}<br />
      <strong>Added:</strong> {formatDate(file.added_at)}<br />
      {getFileExtension(file.name) && (
        <><strong>Format:</strong> {getFileExtension(file.name)}</>
      )}
    </>
  );

  return (
    <>
      <EnhancedTooltip 
        title={file.name}
        description={tooltipDescription}
        placement="right"
        enterDelay={700}
      >
        <ListItemButton
          selected={isSelected}
          onClick={handleSelectFile}
          sx={{ 
            py: 0.75,
            borderRadius: 1,
            mb: 0.5,
            paddingRight: '40px', // Make room for the menu button
            transition: cssTransitions.fast,
            '&.Mui-selected': {
              backgroundColor: (theme) => theme.palette.primary.light + '20', // 20% opacity
              '&:hover': {
                backgroundColor: (theme) => theme.palette.primary.light + '30', // 30% opacity
              }
            },
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              '& .MuiListItemSecondaryAction-root .MuiIconButton-root': {
                opacity: 1,
                transform: 'translateX(0)',
              }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <FileIcon 
              fileType={file.file_type} 
              sx={{ 
                transition: cssTransitions.fast,
                color: isSelected ? 'primary.main' : 'text.secondary',
              }} 
            />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Typography
                variant="body2"
                noWrap
                sx={{
                  maxWidth: '100%',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: isSelected ? 500 : 400,
                  transition: cssTransitions.fast,
                }}
              >
                {file.name}
              </Typography>
            }
          />
          <ListItemSecondaryAction>
            {!readOnly && (
              <IconButton 
                edge="end" 
                size="small"
                onClick={handleOpenMenu}
                aria-label="file options"
                sx={{ 
                  opacity: menuAnchor || isSelected ? 1 : 0.3,
                  transform: 'translateX(4px)',
                  transition: cssTransitions.fast,
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </ListItemSecondaryAction>
        </ListItemButton>
      </EnhancedTooltip>
      
      {/* File context menu - only available in non-readOnly mode */}
      {!readOnly && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleCloseMenu}
          TransitionComponent={Fade}
          transitionDuration={{
            enter: 200,
            exit: 150,
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          slotProps={{
            paper: {
              elevation: 3,
              sx: {
                minWidth: 180,
                overflow: 'visible',
                mt: 0.5,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 16,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              }
            }
          }}
        >
          <MenuItem onClick={handleOpenRenameDialog} dense>
            <MuiListItemIcon>
              <EditIcon fontSize="small" color="primary" />
            </MuiListItemIcon>
            <ListItemText primary="Rename" />
          </MenuItem>
          <MenuItem onClick={handleDeleteFile} dense>
            <MuiListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </MuiListItemIcon>
            <ListItemText primary="Delete" />
          </MenuItem>
          <MenuItem onClick={handleSelectFile} dense>
            <MuiListItemIcon>
              <InfoOutlinedIcon fontSize="small" color="info" />
            </MuiListItemIcon>
            <ListItemText primary="View Details" />
          </MenuItem>
        </Menu>
      )}
      
      {/* Confirmation dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
        TransitionComponent={Fade}
        transitionDuration={{
          enter: 300,
          exit: 200,
        }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 500 }}>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={handleCloseConfirmDialog} 
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDialog.onConfirm} 
            color="error" 
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rename dialog */}
      <Dialog 
        open={renameDialog.open} 
        onClose={handleCloseRenameDialog}
        TransitionComponent={Fade}
        transitionDuration={{
          enter: 300,
          exit: 200,
        }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 500 }}>Rename File</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter a new name for this file.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="File Name"
            fullWidth
            variant="outlined"
            value={renameDialog.fileName}
            onChange={handleRenameChange}
            error={!!renameDialog.error}
            helperText={renameDialog.error}
            InputProps={{
              sx: {
                borderRadius: 1.5,
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={handleCloseRenameDialog}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRenameSubmit} 
            disabled={!!renameDialog.error}
            variant="contained"
            color="primary"
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileListItem; 