import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { File, Project, User, LinkActivation, SearchFilters } from '../types';
import { createPanelSlice, PanelState } from './panelSlice';

export interface AppState extends PanelState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Theme state
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Project state
  selectedProjectId: string | null;
  projects: Project[];
  setSelectedProject: (projectId: string | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  
  // File state
  selectedFileId: string | null;
  files: File[];
  setSelectedFile: (fileId: string | null) => void;
  setFiles: (files: File[]) => void;
  addFile: (file: File) => void;
  updateFile: (fileId: string, updates: Partial<File>) => void;
  deleteFile: (fileId: string) => void;
  
  // Link activation state
  linkActivation: LinkActivation | null;
  setLinkActivation: (linkActivation: LinkActivation | null) => void;
  
  // Search state
  searchFilters: SearchFilters;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetSearchFilters: () => void;
  
  // UI state
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  isSuggestionPanelOpen: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleSuggestionPanel: () => void;
}

const defaultSearchFilters: SearchFilters = {
  searchTerm: '',
  fileTypes: [],
  tags: [],
  entities: [],
  dateFrom: null,
  dateTo: null,
  searchType: 'combined',
};

// Create store with shallow equality comparison to avoid unnecessary re-renders
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        // Include panel state slice
        ...createPanelSlice(...a),
        
        // User state
        user: null,
        setUser: (user) => a[0]({ user }),
        
        // Theme state
        themeMode: 'light',
        toggleTheme: () => a[0]((state) => ({ 
          themeMode: state.themeMode === 'light' ? 'dark' : 'light' 
        })),
        
        // Project state
        selectedProjectId: null,
        projects: [],
        setSelectedProject: (projectId) => a[0]({ selectedProjectId: projectId }),
        setProjects: (projects) => a[0]({ projects }),
        addProject: (project) => a[0]((state) => ({ 
          projects: [...state.projects, project] 
        })),
        updateProject: (projectId, updates) => a[0]((state) => ({
          projects: state.projects.map((project) => 
            project.id === projectId ? { ...project, ...updates } : project
          ),
        })),
        deleteProject: (projectId) => a[0]((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId),
          selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId,
        })),
        
        // File state
        selectedFileId: null,
        files: [],
        setSelectedFile: (fileId) => a[0]({ selectedFileId: fileId }),
        setFiles: (files) => a[0]({ files }),
        addFile: (file) => a[0]((state) => ({ 
          files: [...state.files, file] 
        })),
        updateFile: (fileId, updates) => a[0]((state) => ({
          files: state.files.map((file) => 
            file.id === fileId ? { ...file, ...updates } : file
          ),
        })),
        deleteFile: (fileId) => a[0]((state) => ({
          files: state.files.filter((file) => file.id !== fileId),
          selectedFileId: state.selectedFileId === fileId ? null : state.selectedFileId,
          linkActivation: state.linkActivation?.fileId === fileId ? null : state.linkActivation,
        })),
        
        // Link activation state
        linkActivation: null,
        setLinkActivation: (linkActivation) => a[0]({ linkActivation }),
        
        // Search state
        searchFilters: defaultSearchFilters,
        setSearchFilters: (filters) => a[0]((state) => ({ 
          searchFilters: { ...state.searchFilters, ...filters } 
        })),
        resetSearchFilters: () => a[0]({ searchFilters: defaultSearchFilters }),
        
        // UI state
        isLeftPanelOpen: true,
        isRightPanelOpen: true,
        isSuggestionPanelOpen: false,
        toggleLeftPanel: () => a[0]((state) => ({ 
          isLeftPanelOpen: !state.isLeftPanelOpen 
        })),
        toggleRightPanel: () => a[0]((state) => ({ 
          isRightPanelOpen: !state.isRightPanelOpen 
        })),
        toggleSuggestionPanel: () => a[0]((state) => ({ 
          isSuggestionPanelOpen: !state.isSuggestionPanelOpen 
        })),
      }),
      {
        name: 'clarity-hub-storage',
        partialize: (state) => ({
          themeMode: state.themeMode,
          selectedProjectId: state.selectedProjectId,
          isLeftPanelOpen: state.isLeftPanelOpen,
          isRightPanelOpen: state.isRightPanelOpen,
          // Don't persist panel state here as it's handled separately in the panel slice
        }),
      }
    )
  )
);

// Helper for using Zustand with shallow comparison
export function useShallowAppStore<U>(selector: (state: AppState) => U) {
  return useAppStore(selector, shallow);
}

export default useAppStore; 