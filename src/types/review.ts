// src/types/review.ts

import type { ExerciseType } from './exercise';

export type ReviewDirection = 'ar_to_fr' | 'fr_to_ar' | 'mixed';
export type ReviewSessionMode = 'daily' | 'free';
export type WriteTolerance = 'strict' | 'normal' | 'indulgent';

export interface ReviewSessionConfig {
  mode: ReviewSessionMode;
  free_options?: {
    direction: ReviewDirection;
    forced_exercise_type?: ExerciseType | null;
    module_ids?: string[];
    max_cards?: number;
    exam_mode?: boolean;
  };
}

export interface ExamQuestionResult {
  exercise_id: string;
  exercise_type: ExerciseType;
  prompt_text: string;
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
}
