import useAppStore from '../store';

/**
 * Shared hook to access panel-related state needed across components
 */
export const usePanelState = () => {
  // In the current data model, a single note exists per user per project.
  // Therefore, we treat `selectedProjectId` as the presence/absence of a note.
  const selectedNoteId = useAppStore((state) => state.selectedProjectId);
  const selectedFileId = useAppStore((state) => state.selectedFileId);

  return {
    selectedNoteId,
    selectedFileId,
  } as const;
}; 