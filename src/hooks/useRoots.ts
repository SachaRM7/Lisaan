// src/hooks/useRoots.ts

import { useQuery } from '@tanstack/react-query';
import { getAllRoots, getRootById } from '../db/local-queries';

export interface Root {
  id: string;
  consonants: string[];
  transliteration: string;
  core_meaning_fr: string;
  core_meaning_ar: string | null;
  frequency_rank: number;
  pedagogy_notes: string | null;
}

export function useRoots() {
  return useQuery({
    queryKey: ['roots'],
    queryFn: getAllRoots,
    staleTime: Infinity,
  });
}

export function useRoot(rootId: string | null) {
  return useQuery({
    queryKey: ['root', rootId],
    queryFn: () => getRootById(rootId!),
    enabled: !!rootId,
    staleTime: Infinity,
  });
}
