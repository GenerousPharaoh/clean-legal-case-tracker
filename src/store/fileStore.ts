// Re-export the useFileStore and related types from the main store file
import { useFileStore, FileType, type File } from './store';

export { useFileStore, FileType, type File };
export default useFileStore;