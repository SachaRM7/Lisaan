// src/hooks/useLessons.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../db/remote';

export interface Lesson {
  id: string;
  module_id: string;
  title_fr: string;
  title_ar: string;
  description_fr: string;
  sort_order: number;
  xp_reward: number;
  estimated_minutes: number;
}

async function fetchLessonsForModule(moduleId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as Lesson[];
}

export function useLessons(moduleId: string) {
  return useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: () => fetchLessonsForModule(moduleId),
    enabled: !!moduleId,
    staleTime: Infinity,
  });
}
