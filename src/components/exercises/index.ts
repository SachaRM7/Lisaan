// src/components/exercises/index.ts

import type { ExerciseType, ExerciseComponentProps } from '../../types/exercise';
import type { ComponentType } from 'react';
import { MCQExercise } from './MCQExercise';
import { MatchExercise } from './MatchExercise';
import { FillBlankExercise } from './FillBlankExercise';
import { ReorderExercise } from './ReorderExercise';
import { DialogueExercise } from './DialogueExercise';
import { FlashcardExercise } from './FlashcardExercise';
import { WriteExercise } from './WriteExercise';
import { SpeedRoundExercise } from './SpeedRoundExercise';
import { MemoryMatchExercise } from './MemoryMatchExercise';

/** Registry des composants d'exercice par type */
const exerciseRegistry = new Map<ExerciseType, ComponentType<ExerciseComponentProps>>();

exerciseRegistry.set('mcq', MCQExercise);
exerciseRegistry.set('match', MatchExercise);
exerciseRegistry.set('fill_blank', FillBlankExercise);
exerciseRegistry.set('reorder', ReorderExercise);
exerciseRegistry.set('dialogue', DialogueExercise);
exerciseRegistry.set('flashcard', FlashcardExercise);
exerciseRegistry.set('write', WriteExercise);
exerciseRegistry.set('speed_round', SpeedRoundExercise);
exerciseRegistry.set('memory_match', MemoryMatchExercise);
// exerciseRegistry.set('trace', TraceExercise);    // TODO: Étape future

export function getExerciseComponent(
  type: ExerciseType,
): ComponentType<ExerciseComponentProps> | undefined {
  return exerciseRegistry.get(type);
}

export { exerciseRegistry };
