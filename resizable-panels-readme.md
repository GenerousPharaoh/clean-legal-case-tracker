# Resizable Panels Implementation

## Overview

This implementation adds a premium-feeling, resizable, and foldable three-panel layout to the Legal Case Tracker application. It wraps the existing Left, Center, and Right panels without modifying their internal business logic, ensuring that all data fetching, TinyMCE integration, and other functionality continues to work as expected.

## Features

- **Resizable Panels**: Users can drag the panel dividers to resize panels as needed
- **Collapsible Panels**: Left and right panels can be collapsed and expanded using buttons
- **State Persistence**: Panel sizes and collapsed states are saved to localStorage
- **Responsive Design**: Each panel adapts to its available space
- **Clean Integration**: Wraps existing components without modifying their core functionality

## Implementation Details

### Technology Stack

- **React** (TypeScript)
- **Material UI** for UI components
- **Zustand** for state management
- **react-resizable-panels** for panel resizing functionality

### Component Architecture

1. **ResizablePanels Component**
   - Wraps the three main panels (Left, Center, Right)
   - Manages panel resizing and collapsing
   - Clones child components and adds necessary props

2. **Zustand State Management**
   - New panel slice added to the existing Zustand store
   - Tracks panel sizes, collapse states, and pre-collapse sizes
   - Persists state to localStorage

3. **MainLayout Integration**
   - Modified to use ResizablePanels instead of fixed-width containers
   - Maintains all existing functionality

## Usage

The ResizablePanels component accepts three children (the panel components) and can be configured with initialSizes and minSizes:

```jsx
<ResizablePanels 
  initialSizes={[20, 60, 20]} 
  minSizes={[5, 30, 5]}
>
  <LeftPanel />
  <CenterPanel />
  <RightPanel />
</ResizablePanels>
```

## Design Decisions

1. **Non-Intrusive Integration**
   - The implementation wraps existing components rather than modifying them
   - Allows for easy maintenance and future updates
   
2. **State Management**
   - Zustand slice provides a clean way to manage panel state
   - localStorage persistence ensures user preferences are maintained between sessions
   
3. **Responsive Behavior**
   - Panels adapt to available space while maintaining minimum sizes
   - Collapsible panels allow for more space when needed

## User Experience

- Panels can be resized by dragging the divider handles
- Left and right panels can be collapsed and expanded with a single click
- The center panel (main content) always maintains a reasonable size
- Panel states persist between sessions
- Visual feedback (hover effects, transitions) provides a premium feel 