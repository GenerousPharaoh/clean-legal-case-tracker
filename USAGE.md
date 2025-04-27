# Using the Modern Components & Features

This document provides examples of how to use the newly added components and features in the Legal Case Tracker application.

## Table of Contents

1. [Toast Notifications](#toast-notifications)
2. [Progress Stepper](#progress-stepper)
3. [Data Table](#data-table)
4. [Loading States](#loading-states)
5. [Accessible Wrapper](#accessible-wrapper)
6. [Theme Toggle](#theme-toggle)
7. [File Upload](#file-upload)
8. [Local Storage](#local-storage)
9. [Keyboard Shortcuts](#keyboard-shortcuts)

## Toast Notifications

The toast notification system provides consistent feedback to users.

```tsx
import { useToast } from '../hooks/useToast';

function MyComponent() {
  const toast = useToast();
  
  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Data saved successfully', 'Your changes have been saved.');
    } catch (error) {
      toast.error('Failed to save data', error.message);
    }
  };
  
  return (
    <button onClick={handleSave}>Save</button>
  );
}
```

### Available Toast Types

- `toast.success(message, details?)` - Success notifications
- `toast.error(message, details?)` - Error notifications
- `toast.warning(message, details?)` - Warning notifications
- `toast.info(message, details?)` - Informational notifications
- `toast.security(message, details?)` - Security-related notifications

### Advanced Options

```tsx
toast.warning(
  'Your session will expire soon',
  'Please save your work and log in again.',
  {
    duration: 10000, // 10 seconds
    position: 'top',
    alignment: 'center',
    isImportant: true, // Won't auto-dismiss
    action: (
      <Button size="small" onClick={handleExtendSession}>
        Extend Session
      </Button>
    )
  }
);
```

## Progress Stepper

The ProgressStepper component visualizes multi-step processes.

```tsx
import ProgressStepper from '../components/ProgressStepper';
import { useState } from 'react';

function OnboardingWizard() {
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [
    {
      label: 'Account Setup',
      description: 'Set up your basic account information',
      content: <AccountSetupForm />
    },
    {
      label: 'Profile Details',
      description: 'Fill in your profile information',
      content: <ProfileDetailsForm />
    },
    {
      label: 'Preferences',
      description: 'Set your preferences',
      optional: true,
      content: <PreferencesForm />
    },
    {
      label: 'Confirmation',
      description: 'Review and confirm your information',
      content: <ConfirmationStep />
    }
  ];
  
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleComplete = () => {
    // Handle completion
    console.log('Process completed');
  };
  
  return (
    <ProgressStepper
      steps={steps}
      activeStep={activeStep}
      onNext={handleNext}
      onBack={handleBack}
      onComplete={handleComplete}
      onStepChange={setActiveStep}
      orientation="vertical"
      showContent
    />
  );
}
```

### Horizontal Stepper

```tsx
<ProgressStepper
  steps={steps}
  activeStep={activeStep}
  onNext={handleNext}
  onBack={handleBack}
  onComplete={handleComplete}
  orientation="horizontal"
  variant="dots"
  showContent
/>
```

## Data Table

The DataTable component provides sorting, filtering, and selection capabilities.

```tsx
import DataTable from '../components/DataTable';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: 'active' | 'inactive';
}

function UsersList() {
  const columns = [
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'email', label: 'Email', minWidth: 200 },
    { id: 'role', label: 'Role', minWidth: 120 },
    {
      id: 'lastLogin',
      label: 'Last Login',
      minWidth: 170,
      align: 'right',
      format: (value) => new Date(value).toLocaleString()
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      align: 'center',
      format: (value) => (
        <Chip
          label={value}
          color={value === 'active' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    { id: 'actions', label: 'Actions', align: 'right', sortable: false }
  ];
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);
  
  const handleDeleteSelected = (selectedIds: string[]) => {
    // Handle deletion of selected users
    console.log('Deleting users:', selectedIds);
  };
  
  const handleRowClick = (user: User) => {
    // Handle row click
    console.log('User clicked:', user);
  };
  
  const renderRowActions = (user: User) => (
    <>
      <IconButton size="small" onClick={() => handleEditUser(user)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => handleDeleteUser(user)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </>
  );
  
  return (
    <DataTable<User>
      columns={columns}
      data={users}
      keyField="id"
      title="Users"
      loading={loading}
      selectable
      searchable
      pagination
      onRowClick={handleRowClick}
      onDeleteSelected={handleDeleteSelected}
      renderRowActions={renderRowActions}
      emptyMessage="No users found"
    />
  );
}
```

## Loading States

The LoadingState component provides consistent loading indicators.

```tsx
import LoadingState from '../components/LoadingState';

function DataView() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const fetchData = async () => {
      // Simulate progress updates
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setLoading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 500);
      
      // Clean up
      return () => clearInterval(interval);
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <LoadingState
        message="Loading data..."
        type="linear"
        value={progress}
        contained
        size="large"
      />
    );
  }
  
  return <DataContent />;
}
```

### Loading Variations

```tsx
// Circular spinner
<LoadingState type="circular" message="Loading..." />

// Linear progress bar
<LoadingState type="linear" value={75} message="Loading files..." />

// Dots animation
<LoadingState type="dots" message="Processing..." />

// Full-screen overlay
<LoadingState 
  fullScreen 
  overlay 
  message="Processing your request..." 
  size="large" 
/>
```

## Accessible Wrapper

The AccessibleWrapper component enhances accessibility.

```tsx
import AccessibleWrapper from '../components/AccessibleWrapper';

function SearchResults() {
  return (
    <AccessibleWrapper
      role="region"
      label="Search Results"
      aria-live="polite"
      tabIndex={0}
    >
      {results.map((result) => (
        <ResultItem key={result.id} result={result} />
      ))}
    </AccessibleWrapper>
  );
}
```

### Common ARIA Patterns

```tsx
// Tab panel
<AccessibleWrapper
  role="tabpanel"
  id="panel-1"
  labelledBy="tab-1"
  tabIndex={0}
  hidden={activeTab !== 'tab1'}
>
  <h3>Tab 1 Content</h3>
  <p>This is the content for tab 1.</p>
</AccessibleWrapper>

// Alert message
<AccessibleWrapper
  role="alert"
  aria-live="assertive"
  sx={{ 
    backgroundColor: 'error.light', 
    p: 2, 
    borderRadius: 1 
  }}
>
  <Typography>Your session will expire in 5 minutes.</Typography>
</AccessibleWrapper>

// Dialog
<AccessibleWrapper
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirm Delete</h2>
  <p id="dialog-description">Are you sure you want to delete this item?</p>
  <Button>Cancel</Button>
  <Button>Delete</Button>
</AccessibleWrapper>
```

## Theme Toggle

The ThemeToggle component allows users to switch between light and dark mode.

```tsx
import ThemeToggle from '../components/ThemeToggle';
import { useThemeMode } from '../hooks/useThemeMode';

function Header() {
  const { toggleThemeMode } = useThemeMode();
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6">Legal Case Tracker</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <ThemeToggle onToggle={toggleThemeMode} />
        <IconButton color="inherit">
          <NotificationsIcon />
        </IconButton>
        <IconButton color="inherit">
          <AccountCircleIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
```

## File Upload

The useFileUpload hook provides a convenient way to upload files.

```tsx
import { useFileUpload } from '../hooks/useFileUpload';

function FileUploader() {
  const { uploadFile, uploading, uploadProgress } = useFileUpload();
  const [fileId, setFileId] = useState<string | null>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const result = await uploadFile(file, {
      folderPath: 'documents',
      projectId: currentProjectId,
      onProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`);
      }
    });
    
    if (result.error) {
      console.error('Upload failed:', result.error);
    } else {
      setFileId(result.fileId);
    }
  };
  
  return (
    <Box>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        accept=".pdf,.docx,.txt"
      />
      
      {uploading && fileId && (
        <LinearProgress
          variant="determinate"
          value={uploadProgress[fileId] || 0}
          sx={{ mt: 2 }}
        />
      )}
    </Box>
  );
}
```

### Multiple File Upload

```tsx
const { uploadFiles } = useFileUpload();

const handleMultipleFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;
  
  const result = await uploadFiles(files, {
    folderPath: 'documents',
    projectId: currentProjectId
  });
  
  console.log(`${result.fileIds.length} files uploaded successfully`);
  if (result.errors.length > 0) {
    console.error(`${result.errors.length} files failed to upload`);
  }
};
```

## Local Storage

The useLocalStorage hook provides type-safe access to localStorage.

```tsx
import useLocalStorage from '../hooks/useLocalStorage';

function UserPreferences() {
  const [preferences, setPreferences, removePreferences] = useLocalStorage('user-preferences', {
    theme: 'light',
    fontSize: 'medium',
    notifications: true,
    emailFrequency: 'daily'
  });
  
  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      theme: event.target.value
    }));
  };
  
  const handleFontSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      fontSize: event.target.value
    }));
  };
  
  const handleNotificationsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      notifications: event.target.checked
    }));
  };
  
  const handleReset = () => {
    removePreferences();
  };
  
  return (
    <Box>
      <FormControl>
        <FormLabel>Theme</FormLabel>
        <RadioGroup
          value={preferences.theme}
          onChange={handleThemeChange}
        >
          <FormControlLabel value="light" control={<Radio />} label="Light" />
          <FormControlLabel value="dark" control={<Radio />} label="Dark" />
          <FormControlLabel value="system" control={<Radio />} label="System" />
        </RadioGroup>
      </FormControl>
      
      <FormControl>
        <FormLabel>Font Size</FormLabel>
        <RadioGroup
          value={preferences.fontSize}
          onChange={handleFontSizeChange}
        >
          <FormControlLabel value="small" control={<Radio />} label="Small" />
          <FormControlLabel value="medium" control={<Radio />} label="Medium" />
          <FormControlLabel value="large" control={<Radio />} label="Large" />
        </RadioGroup>
      </FormControl>
      
      <FormControlLabel
        control={
          <Switch
            checked={preferences.notifications}
            onChange={handleNotificationsChange}
          />
        }
        label="Enable Notifications"
      />
      
      <Button onClick={handleReset}>Reset to Defaults</Button>
    </Box>
  );
}
```

## Keyboard Shortcuts

The useKeyboardShortcut hook simplifies adding keyboard shortcuts.

```tsx
import useKeyboardShortcut from '../hooks/useKeyboardShortcut';

function NoteEditor() {
  const { registerShortcut, shortcuts } = useKeyboardShortcut();
  
  useEffect(() => {
    // Register keyboard shortcuts
    const unregisterSave = registerShortcut({
      targetKey: 's',
      ctrl: true,
      callback: () => handleSave(),
      preventDefault: true,
      description: 'Save note'
    });
    
    const unregisterNew = registerShortcut({
      targetKey: 'n',
      ctrl: true,
      callback: () => handleNew(),
      preventDefault: true,
      description: 'New note'
    });
    
    const unregisterDelete = registerShortcut({
      targetKey: 'Delete',
      ctrl: true,
      shift: true,
      callback: () => handleDelete(),
      preventDefault: true,
      description: 'Delete note'
    });
    
    // Clean up on unmount
    return () => {
      unregisterSave();
      unregisterNew();
      unregisterDelete();
    };
  }, []);
  
  // Display available shortcuts in a help dialog
  const renderShortcutsHelp = () => (
    <Dialog open={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)}>
      <DialogTitle>Keyboard Shortcuts</DialogTitle>
      <DialogContent>
        <List>
          {shortcuts.map((shortcut) => (
            <ListItem key={shortcut.id}>
              <ListItemText
                primary={shortcut.description}
                secondary={shortcut.keys}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
  
  return (
    <>
      <Box>
        <TextField
          label="Note"
          multiline
          fullWidth
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button onClick={handleSave}>Save (Ctrl+S)</Button>
        <Button onClick={() => setShowShortcutsHelp(true)}>Show Shortcuts</Button>
      </Box>
      {renderShortcutsHelp()}
    </>
  );
}
```

## Conclusion

These examples demonstrate how to use the newly added components and features in the Legal Case Tracker application. By leveraging these components, you can create a more modern, accessible, and user-friendly application with consistent behavior and styling.

For more detailed information, refer to the component source code and comments.
