// src/hooks/useProgress.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import {
  getProgressForUser, upsertProgress, getLessonById, getLessonsByModule,
  getFirstLessonOfNextModule,
} from '../db/local-queries';
import { runSync } from '../engines/sync-manager';

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  score: number;
  completed_at: string | null;
  attempts: number;
  time_spent_seconds: number;
}

const PROGRESS_QUERY_KEY = ['user_progress'];

export function useProgress() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: PROGRESS_QUERY_KEY,
    queryFn: async (): Promise<LessonProgress[]> => {
      if (!userId) return [];
      return getProgressForUser(userId);
    },
    enabled: !!userId,
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      lessonId: string;
      score: number;
      timeSpentSeconds: number;
    }) => {
      const userId = useAuthStore.getState().userId;
      if (!userId) throw new Error('Not authenticated');

      // Marquer la leçon comme complétée (local)
      await upsertProgress({
        id: crypto.randomUUID(),
        user_id: userId,
        lesson_id: params.lessonId,
        status: 'completed',
        score: params.score,
        completed_at: new Date().toISOString(),
        attempts: 1,
        time_spent_seconds: params.timeSpentSeconds,
      });

      // Trouver la leçon suivante localement
      const currentLesson = await getLessonById(params.lessonId);
      if (currentLesson) {
        const moduleLessons = await getLessonsByModule(currentLesson.module_id);
        const nextLesson = moduleLessons.find(
          l => l.sort_order === currentLesson.sort_order + 1
        );

        if (nextLesson) {
          await upsertProgress({
            id: crypto.randomUUID(),
            user_id: userId,
            lesson_id: nextLesson.id,
            status: 'available',
            score: 0,
            completed_at: null,
            attempts: 0,
            time_spent_seconds: 0,
          });
        } else {
          // Dernière leçon du module → déverrouiller la 1ère leçon du module suivant
          const firstNextLesson = await getFirstLessonOfNextModule(currentLesson.module_id);
          if (firstNextLesson) {
            await upsertProgress({
              id: crypto.randomUUID(),
              user_id: userId,
              lesson_id: firstNextLesson.id,
              status: 'available',
              score: 0,
              completed_at: null,
              attempts: 0,
              time_spent_seconds: 0,
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
      // Fire-and-forget sync vers Cloud
      runSync().catch(console.warn);
    },
  });
}

export function useInitFirstLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      const userId = useAuthStore.getState().userId;
      if (!userId) return;

      await upsertProgress({
        id: crypto.randomUUID(),
        user_id: userId,
        lesson_id: lessonId,
        status: 'available',
        score: 0,
        completed_at: null,
        attempts: 0,
        time_spent_seconds: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
      runSync().catch(console.warn);
    },
  });
}
