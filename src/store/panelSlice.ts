import { StateCreator } from 'zustand';
import { AppState } from '.';

// Panel Slice types
export interface PanelState {
  // Panel sizes as percentages (0-100)
  panelSizes: number[];
  // Stored sizes before folding for restoration
  leftPreFold: number | null;
  rightPreFold: number | null;
  // Collapsed state flags
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  // Actions
  setPanelSizes: (sizes: number[]) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  storePreFold: (panel: 'left' | 'right', size: number) => void;
}

// Minimum visible size for collapsed panels (percentage)
const MIN_COLLAPSED_SIZE = 8;
// Default panel sizes
const DEFAULT_PANEL_SIZES = [20, 60, 20];

// Load stored panel state from localStorage
const loadPanelState = () => {
  try {
    const savedState = localStorage.getItem('clarity-hub-panel-state');
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Failed to load panel state from localStorage:', error);
  }
  
  // Default state if nothing is stored
  return {
    panelSizes: DEFAULT_PANEL_SIZES,
    leftPreFold: null,
    rightPreFold: null,
    leftCollapsed: false,
    rightCollapsed: false,
  };
};

// Panel slice creator with persistence
export const createPanelSlice: StateCreator<
  AppState,
  [],
  [],
  PanelState
> = (set, get) => {
  // Load initial state from localStorage
  const initialState = loadPanelState();
  
  return {
    // Initialize state
    panelSizes: initialState.panelSizes || DEFAULT_PANEL_SIZES,
    leftPreFold: initialState.leftPreFold,
    rightPreFold: initialState.rightPreFold,
    leftCollapsed: initialState.leftCollapsed,
    rightCollapsed: initialState.rightCollapsed,
    
    // Update panel sizes and persist
    setPanelSizes: (sizes) => {
      // Enforce minimum sizes to prevent panels from disappearing
      const { leftCollapsed, rightCollapsed } = get();
      const newSizes = [...sizes];
      
      // If left panel is collapsed, make sure it maintains minimum size
      if (leftCollapsed && newSizes[0] < MIN_COLLAPSED_SIZE) {
        const diff = MIN_COLLAPSED_SIZE - newSizes[0];
        newSizes[0] = MIN_COLLAPSED_SIZE;
        // Adjust center panel size proportionally
        newSizes[1] = Math.max(30, newSizes[1] - diff);
      }
      
      // If right panel is collapsed, make sure it maintains minimum size
      if (rightCollapsed && newSizes[2] < MIN_COLLAPSED_SIZE) {
        const diff = MIN_COLLAPSED_SIZE - newSizes[2];
        newSizes[2] = MIN_COLLAPSED_SIZE;
        // Adjust center panel size proportionally
        newSizes[1] = Math.max(30, newSizes[1] - diff);
      }
      
      set({ panelSizes: newSizes });
      
      // Persist state
      localStorage.setItem(
        'clarity-hub-panel-state', 
        JSON.stringify({ ...get(), panelSizes: newSizes })
      );
    },
    
    // Toggle left panel collapse state
    toggleLeft: () => {
      const { panelSizes, leftCollapsed, leftPreFold } = get();
      
      if (leftCollapsed) {
        // Expand panel - restore from pre-fold size
        const newSizes = [...panelSizes];
        const restoreSize = leftPreFold || 20; // Default to 20% if no stored size
        
        // Adjust the other panels proportionally (maintain center/right ratio)
        const centerRightRatio = newSizes[1] / (newSizes[1] + newSizes[2]);
        const remainingSpace = 100 - restoreSize;
        
        newSizes[0] = restoreSize;
        newSizes[1] = remainingSpace * centerRightRatio;
        newSizes[2] = remainingSpace * (1 - centerRightRatio);
        
        set({ 
          leftCollapsed: false,
          panelSizes: newSizes
        });
        
        // Persist the expanded state
        localStorage.setItem(
          'clarity-hub-panel-state', 
          JSON.stringify({ ...get(), leftCollapsed: false, panelSizes: newSizes })
        );
      } else {
        // Collapse panel - store current size for later restoration
        const currentSize = panelSizes[0];
        const newSizes = [...panelSizes];
        
        // Store current size for later restoration if not already stored
        if (leftPreFold === null) {
          set({ leftPreFold: currentSize });
        }
        
        // Adjust the other panels proportionally (maintain center/right ratio)
        const centerRightRatio = newSizes[1] / (newSizes[1] + newSizes[2]);
        const remainingSpace = 100 - MIN_COLLAPSED_SIZE; // Use minimum visible size
        
        newSizes[0] = MIN_COLLAPSED_SIZE; // Use minimum visible size when collapsed
        newSizes[1] = remainingSpace * centerRightRatio;
        newSizes[2] = remainingSpace * (1 - centerRightRatio);
        
        set({ 
          leftCollapsed: true,
          panelSizes: newSizes
        });
        
        // Persist the collapsed state
        localStorage.setItem(
          'clarity-hub-panel-state', 
          JSON.stringify({ ...get(), leftCollapsed: true, panelSizes: newSizes })
        );
      }
    },
    
    // Toggle right panel collapse state
    toggleRight: () => {
      const { panelSizes, rightCollapsed, rightPreFold } = get();
      
      if (rightCollapsed) {
        // Expand panel - restore from pre-fold size
        const newSizes = [...panelSizes];
        const restoreSize = rightPreFold || 20; // Default to 20% if no stored size
        
        // Adjust the other panels proportionally (maintain left/center ratio)
        const leftCenterRatio = newSizes[0] / (newSizes[0] + newSizes[1]);
        const remainingSpace = 100 - restoreSize;
        
        newSizes[2] = restoreSize;
        newSizes[0] = remainingSpace * leftCenterRatio;
        newSizes[1] = remainingSpace * (1 - leftCenterRatio);
        
        set({ 
          rightCollapsed: false,
          panelSizes: newSizes
        });
        
        // Persist the expanded state
        localStorage.setItem(
          'clarity-hub-panel-state', 
          JSON.stringify({ ...get(), rightCollapsed: false, panelSizes: newSizes })
        );
      } else {
        // Collapse panel - store current size for later restoration
        const currentSize = panelSizes[2];
        const newSizes = [...panelSizes];
        
        // Store current size for later restoration if not already stored
        if (rightPreFold === null) {
          set({ rightPreFold: currentSize });
        }
        
        // Adjust the other panels proportionally (maintain left/center ratio)
        const leftCenterRatio = newSizes[0] / (newSizes[0] + newSizes[1]);
        const remainingSpace = 100 - MIN_COLLAPSED_SIZE; // Use minimum visible size
        
        newSizes[2] = MIN_COLLAPSED_SIZE; // Use minimum visible size when collapsed
        newSizes[0] = remainingSpace * leftCenterRatio;
        newSizes[1] = remainingSpace * (1 - leftCenterRatio);
        
        set({ 
          rightCollapsed: true,
          panelSizes: newSizes
        });
        
        // Persist the collapsed state
        localStorage.setItem(
          'clarity-hub-panel-state', 
          JSON.stringify({ ...get(), rightCollapsed: true, panelSizes: newSizes })
        );
      }
    },
    
    // Store pre-fold size for a panel
    storePreFold: (panel, size) => {
      if (panel === 'left') {
        set({ leftPreFold: size });
      } else {
        set({ rightPreFold: size });
      }
      
      // Persist the updated pre-fold state
      localStorage.setItem(
        'clarity-hub-panel-state', 
        JSON.stringify({ ...get() })
      );
    },
  };
}; 