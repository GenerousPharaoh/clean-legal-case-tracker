/**
 * Redux Hooks Compatibility Layer
 * 
 * This file provides compatibility hooks for components that were previously 
 * using Redux but now use Zustand state management.
 */

import { useProjectStore } from '../store';
import { useFileStore } from '../store';

// Mock the useAppSelector hook to work with zustand stores
export const useAppSelector = (selector: Function) => {
  const { selectedProjectId } = useProjectStore();
  const { selectedFileId, files } = useFileStore();
  
  // Create a mock state object that can be selected from
  const state = {
    projects: {
      selectedProject: selectedProjectId ? { id: selectedProjectId } : null,
      projects: [] // We don't need this for the current usage
    },
    files: {
      selectedFile: selectedFileId ? files.find(f => f.id === selectedFileId) : null,
      files
    }
  };
  
  // Call the selector with our state
  return selector(state);
};

// For components that used useDispatch
export const useAppDispatch = () => {
  // Return a no-op function since we're not using Redux anymore
  return () => {};
};
