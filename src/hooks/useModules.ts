// src/hooks/useModules.ts

import { useQuery } from '@tanstack/react-query';
import { getAllModules } from '../db/local-queries';

export interface Module {
  id: string;
  title_fr: string;
  title_ar: string;
  description_fr: string | null;
  sort_order: number;
  icon: string | null;
}

export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: getAllModules,
    staleTime: Infinity,
  });
}
