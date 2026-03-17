/**
 * Exercise Component Registry
 *
 * Import and register all exercise components here.
 * Adding a new exercise type:
 * 1. Create the component in this folder
 * 2. Import it here
 * 3. Call registerExercise()
 *
 * That's it. No other file needs to change.
 */

import { registerExercise } from '../../engines/exercise-runner';

// Import exercise components as they're built
// import MCQExercise from './MCQExercise';
// import TraceExercise from './TraceExercise';
// import MatchExercise from './MatchExercise';
// import FillBlankExercise from './FillBlankExercise';
// import ListenSelectExercise from './ListenSelectExercise';
// import ReorderExercise from './ReorderExercise';

/**
 * Initialize the exercise registry.
 * Call this once at app startup.
 */
export function initializeExerciseRegistry(): void {
  // Register each exercise type
  // registerExercise('mcq', MCQExercise);
  // registerExercise('trace', TraceExercise);
  // registerExercise('match', MatchExercise);
  // registerExercise('fill_blank', FillBlankExercise);
  // registerExercise('listen_select', ListenSelectExercise);
  // registerExercise('reorder', ReorderExercise);

  // Suppress unused import warning during development
  void registerExercise;
}

// Re-export components for direct use if needed
// export { MCQExercise, TraceExercise, MatchExercise, FillBlankExercise };
