// src/components/exercises/index.ts

import type { ExerciseType, ExerciseComponentProps } from '../../types/exercise';
import type { ComponentType } from 'react';
import { MCQExercise } from './MCQExercise';
import { MatchExercise } from './MatchExercise';

/** Registry des composants d'exercice par type */
const exerciseRegistry = new Map<ExerciseType, ComponentType<ExerciseComponentProps>>();

exerciseRegistry.set('mcq', MCQExercise);
exerciseRegistry.set('match', MatchExercise);
// exerciseRegistry.set('trace', TraceExercise);    // TODO: Étape future
// exerciseRegistry.set('fill_blank', FillBlankExercise); // TODO: Étape future

export function getExerciseComponent(
  type: ExerciseType,
): ComponentType<ExerciseComponentProps> | undefined {
  return exerciseRegistry.get(type);
}

export { exerciseRegistry };
