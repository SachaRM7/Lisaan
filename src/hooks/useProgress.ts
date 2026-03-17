// src/hooks/useProgress.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../db/remote';

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
  return useQuery({
    queryKey: PROGRESS_QUERY_KEY,
    queryFn: async (): Promise<LessonProgress[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as LessonProgress[];
    },
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Marquer la leçon comme complétée
      const { error: completeError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: params.lessonId,
          status: 'completed',
          score: params.score,
          completed_at: new Date().toISOString(),
          attempts: 1,
          time_spent_seconds: params.timeSpentSeconds,
        }, { onConflict: 'user_id,lesson_id' });

      if (completeError) throw completeError;

      // Trouver la leçon courante pour connaître son module et sort_order
      const { data: currentLesson } = await supabase
        .from('lessons')
        .select('module_id, sort_order')
        .eq('id', params.lessonId)
        .single();

      if (currentLesson) {
        // Trouver la leçon suivante dans le même module
        const { data: nextLesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('module_id', currentLesson.module_id)
          .eq('sort_order', currentLesson.sort_order + 1)
          .single();

        if (nextLesson) {
          await supabase
            .from('user_progress')
            .upsert({
              user_id: user.id,
              lesson_id: nextLesson.id,
              status: 'available',
              score: 0,
              attempts: 0,
              time_spent_seconds: 0,
            }, {
              onConflict: 'user_id,lesson_id',
              ignoreDuplicates: true,
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
    },
  });
}

export function useInitFirstLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'available',
          score: 0,
          attempts: 0,
          time_spent_seconds: 0,
        }, {
          onConflict: 'user_id,lesson_id',
          ignoreDuplicates: true,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
    },
  });
}
