import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_LEFT_PANEL_WIDTH = 280;
export const DEFAULT_RIGHT_PANEL_WIDTH = 350;
export const MIN_PANEL_WIDTH = 200;
// Store previous panel widths when collapsing
export const COLLAPSED_WIDTH = 0;

interface LayoutState {
  leftPanelWidth: number;
  rightPanelWidth: number;
  
  // Track collapsed state
  isLeftPanelCollapsed: boolean;
  isRightPanelCollapsed: boolean;
  
  // Store previous widths to restore when expanding
  previousLeftPanelWidth: number;
  previousRightPanelWidth: number;
  
  // Methods for updating panel widths
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  
  // Methods for collapsing/expanding panels
  toggleLeftPanelCollapse: () => void;
  toggleRightPanelCollapse: () => void;
  
  // Reset panel layouts to defaults
  resetLayout: () => void;
}

/**
 * Store for managing panel sizes and layout preferences
 */
export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      // Initial state
      leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
      rightPanelWidth: DEFAULT_RIGHT_PANEL_WIDTH,
      isLeftPanelCollapsed: false,
      isRightPanelCollapsed: false,
      previousLeftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
      previousRightPanelWidth: DEFAULT_RIGHT_PANEL_WIDTH,
      
      // Methods
      setLeftPanelWidth: (width: number) => {
        // Only constrain minimum width, maximum is handled by resize logic
        const constrainedWidth = Math.max(MIN_PANEL_WIDTH, width);
        set({ 
          leftPanelWidth: constrainedWidth,
          // Update previous width for collapse/expand if not currently collapsed
          previousLeftPanelWidth: get().isLeftPanelCollapsed 
            ? get().previousLeftPanelWidth 
            : constrainedWidth
        });
      },
      
      setRightPanelWidth: (width: number) => {
        // Only constrain minimum width, maximum is handled by resize logic
        const constrainedWidth = Math.max(MIN_PANEL_WIDTH, width);
        set({ 
          rightPanelWidth: constrainedWidth,
          // Update previous width for collapse/expand if not currently collapsed
          previousRightPanelWidth: get().isRightPanelCollapsed 
            ? get().previousRightPanelWidth 
            : constrainedWidth
        });
      },
      
      toggleLeftPanelCollapse: () => {
        const { isLeftPanelCollapsed, leftPanelWidth, previousLeftPanelWidth } = get();
        
        if (isLeftPanelCollapsed) {
          // Expand panel
          set({ 
            isLeftPanelCollapsed: false,
            leftPanelWidth: previousLeftPanelWidth
          });
        } else {
          // Collapse panel - store current width first
          set({ 
            isLeftPanelCollapsed: true,
            previousLeftPanelWidth: leftPanelWidth,
            leftPanelWidth: COLLAPSED_WIDTH
          });
        }
      },
      
      toggleRightPanelCollapse: () => {
        const { isRightPanelCollapsed, rightPanelWidth, previousRightPanelWidth } = get();
        
        if (isRightPanelCollapsed) {
          // Expand panel
          set({ 
            isRightPanelCollapsed: false,
            rightPanelWidth: previousRightPanelWidth
          });
        } else {
          // Collapse panel - store current width first
          set({ 
            isRightPanelCollapsed: true,
            previousRightPanelWidth: rightPanelWidth,
            rightPanelWidth: COLLAPSED_WIDTH
          });
        }
      },
      
      resetLayout: () => set({
        leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
        rightPanelWidth: DEFAULT_RIGHT_PANEL_WIDTH,
        isLeftPanelCollapsed: false,
        isRightPanelCollapsed: false,
        previousLeftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
        previousRightPanelWidth: DEFAULT_RIGHT_PANEL_WIDTH,
      }),
    }),
    {
      name: 'clarity-suite-layout',
    }
  )
); 