# Phase 13 - Advanced Search & Filtering Implementation

This phase adds powerful search and filtering capabilities to the Legal Case Tracker application, allowing users to find project files based on:

- Text-based search (filenames)
- Semantic content (vector search)
- Extracted entities (People, Organizations, Dates, Tags)
- Standard metadata (file type, date ranges)

## Implementation Details

### 1. Backend Components

#### Supabase Edge Function: `project-search`

A powerful search API that combines multiple filtering and search approaches:

- **File Metadata Filtering**: Filter by file type, date added, and tags
- **Entity Filtering**: Filter by extracted entities (e.g., people, organizations)
- **Text Search**:
  - Keyword-based (matching filenames)
  - Semantic search (using vector embeddings for concept-based search)
  - Combined search (merging both approaches)

#### Database Optimizations

Added several indexes to improve search performance:

```sql
-- File date filtering
CREATE INDEX idx_files_project_date ON files(project_id, added_at);

-- File type filtering
CREATE INDEX idx_files_project_filetype ON files(project_id, file_type);

-- Tag filtering (JSONB)
CREATE INDEX idx_files_metadata_tags ON files USING GIN((metadata->'tags'));

-- Entity filtering
CREATE INDEX idx_entities_composite ON entities(project_id, entity_type, lower(entity_text));

-- Vector search optimization
CREATE INDEX idx_document_chunks_project_id ON document_chunks(project_id);
```

### 2. Frontend Components

#### New React Hook: `useAdvancedSearch`

A custom hook that interacts with the search edge function and manages search state:

- Handles debouncing search queries
- Manages filter state
- Provides pagination support
- Exposes methods for updating filters and clearing searches

#### AdvancedSearchFilters Component

A new UI component that provides:

- Date range pickers (using MUI X Date Pickers)
- File type checkboxes 
- Tag autocomplete with multiple selection
- Entity selection with type grouping
- Search method selection (keyword, semantic, combined)
- Active filter chips with individual removal

#### Enhanced LeftPanel

The left panel now incorporates the advanced search functionality:

- Toggleable filter panel
- Active filter display with chips
- Integration with search results and pagination
- Clear handling of search/filter states

## Setup Instructions

1. **Install Required Dependencies**:
   ```bash
   npm install @mui/x-date-pickers
   ```

2. **Deploy Edge Function**:
   ```bash
   supabase functions deploy project-search
   ```

3. **Apply Database Migrations**:
   ```bash
   supabase migration up
   ```

## Usage

1. Select a project
2. Use the search bar for basic text search
3. Click the "Filters" button to access advanced filtering options:
   - Set date ranges for file uploads
   - Select specific file types
   - Choose from extracted tags
   - Filter by entity types (people, organizations, etc.)
   - Select search method (keyword, semantic, or combined)
4. Active filters appear as chips that can be individually removed
5. Click "Clear All" to reset all filters
6. Search results update in real-time as filters are applied

## Technical Notes

- Semantic search uses vector embeddings generated during file processing
- Entity filtering leverages the entities table populated during document analysis
- The pgvector extension powers similarity search capabilities
- All search and filtering operations respect existing access control rules
- Pagination is implemented for handling large result sets 