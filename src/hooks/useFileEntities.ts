import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Entity {
  id: string;
  entity_text: string;
  entity_type: string;
  project_id: string;
  source_file_id: string;
  created_at: string;
}

interface UseFileEntitiesResult {
  entities: Entity[];
  groupedEntities: Record<string, Entity[]>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to fetch entities associated with a specific file
 * @param fileId - The ID of the file to fetch entities for
 * @returns Object containing entities, loading state, error state, and refresh function
 */
export function useFileEntities(fileId: string | null): UseFileEntitiesResult {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Group entities by type for easier rendering
  const groupedEntities = entities.reduce<Record<string, Entity[]>>((groups, entity) => {
    const group = groups[entity.entity_type] || [];
    group.push(entity);
    groups[entity.entity_type] = group;
    return groups;
  }, {});

  // Function to manually trigger a refresh
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    async function fetchEntities() {
      if (!fileId) {
        setEntities([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('entities')
          .select('*')
          .eq('source_file_id', fileId)
          .order('entity_type')
          .order('entity_text');

        if (fetchError) {
          throw fetchError;
        }

        setEntities(data || []);
      } catch (err: any) {
        console.error('Error fetching entities:', err);
        setError(err.message || 'Failed to fetch entities');
      } finally {
        setLoading(false);
      }
    }

    fetchEntities();
  }, [fileId, refreshTrigger]);

  return { entities, groupedEntities, loading, error, refresh };
} 