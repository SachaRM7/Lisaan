// src/hooks/useModules.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/remote';

export interface Module {
  id: string;
  title_fr: string;
  title_ar: string;
  description_fr: string | null;
  sort_order: number;
  variant: string;
}

export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Module[];
    },
    staleTime: Infinity,
  });
}
