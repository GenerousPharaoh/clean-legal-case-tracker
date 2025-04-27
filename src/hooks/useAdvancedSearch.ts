import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useDebounce } from './useDebounce';
import { File, FileType } from '../store';

export interface EntityFilter {
  type: string;
  text: string;
}

export interface SearchFilters {
  dateRange?: { start?: string; end?: string };
  fileTypes?: FileType[];
  tags?: string[];
  entities?: EntityFilter[];
  searchType?: 'keyword' | 'semantic' | 'combined';
}

interface SearchParams {
  projectId: string;
  queryText?: string;
  filters?: SearchFilters;
  pagination?: { limit: number; offset: number };
}

export const useAdvancedSearch = () => {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [files, setFiles] = useState<File[] | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search query to prevent too many API calls
  const debouncedParams = useDebounce(searchParams, 300);

  const searchFiles = useCallback(async (params: SearchParams) => {
    setSearchParams(params);
  }, []);

  // Clear all search filters and reset to default view
  const clearSearch = useCallback(() => {
    setSearchParams(null);
    setFiles(null);
  }, []);

  // Update specific filters while keeping other search parameters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setSearchParams((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        filters: {
          ...prev.filters,
          ...newFilters,
        }
      };
    });
  }, []);

  // Update search query text
  const updateQueryText = useCallback((queryText: string) => {
    setSearchParams((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        queryText,
      };
    });
  }, []);

  // Update pagination
  const updatePagination = useCallback((pagination: { limit: number; offset: number }) => {
    setSearchParams((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        pagination,
      };
    });
  }, []);

  // Load more results for infinite scrolling
  const loadMore = useCallback(() => {
    setSearchParams((prev) => {
      if (!prev || !prev.pagination) return prev;
      return {
        ...prev,
        pagination: {
          ...prev.pagination,
          offset: prev.pagination.offset + prev.pagination.limit,
        }
      };
    });
  }, []);

  // Execute the search when parameters change
  useEffect(() => {
    const executeSearch = async () => {
      if (!debouncedParams || !debouncedParams.projectId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.functions.invoke('project-search', {
          body: debouncedParams
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data && 'files' in data) {
          // For pagination (loadMore), append to existing files
          if (debouncedParams.pagination && debouncedParams.pagination.offset > 0) {
            setFiles((prev) => 
              prev ? [...prev, ...data.files] : data.files
            );
          } else {
            // For new searches, replace files
            setFiles(data.files);
          }
          setTotalCount(data.totalCount || 0);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: any) {
        console.error('Search error:', err);
        setError(err.message || 'An error occurred while searching');
      } finally {
        setLoading(false);
      }
    };

    executeSearch();
  }, [debouncedParams]);

  // Return all the necessary state and functions
  return {
    files,
    totalCount,
    loading,
    error,
    searchFiles,
    clearSearch,
    updateFilters,
    updateQueryText,
    updatePagination,
    loadMore,
    hasActiveFilters: Boolean(searchParams?.filters || searchParams?.queryText)
  };
}; 