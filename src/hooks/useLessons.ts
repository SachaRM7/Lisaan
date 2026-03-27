// src/hooks/useLessons.ts

import { useQuery } from '@tanstack/react-query';
import { getLessonsByModule, getLessonWithModule } from '../db/local-queries';

export interface Lesson {
  id: string;
  module_id: string;
  title_fr: string;
  title_ar: string;
  description_fr: string;
  sort_order: number;
  xp_reward: number;
  estimated_minutes: number;
  content_refs?: string; // JSON string: string[]
}

export interface LessonWithModule extends Lesson {
  modules: { sort_order: number };
}

export function useLessons(moduleId: string) {
  return useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: () => getLessonsByModule(moduleId),
    enabled: !!moduleId,
    staleTime: Infinity,
  });
}

/** Charge une leçon avec le sort_order de son module */
export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async (): Promise<LessonWithModule | null> => {
      const row = await getLessonWithModule(lessonId);
      if (!row) return null;
      return {
        ...row,
        modules: { sort_order: row.module_sort_order },
      };
    },
    enabled: !!lessonId,
    staleTime: Infinity,
  });
}
