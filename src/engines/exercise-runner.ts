import type { ComponentType } from 'react';
import type { ExerciseConfig, ExerciseResult } from '../types';

/**
 * Lisaan Exercise Engine
 * Generic exercise runner with a plugin-based component registry.
 * Adding a new exercise type = creating a component + registering it here.
 */

// ─── Component Registry ───────────────────────────────────

export interface ExerciseComponentProps {
  config: ExerciseConfig;
  onComplete: (result: ExerciseResult) => void;
  onSkip?: () => void;
}

const registry = new Map<string, ComponentType<ExerciseComponentProps>>();

/**
 * Register an exercise component for a given type.
 */
export function registerExercise(
  type: string,
  component: ComponentType<ExerciseComponentProps>
): void {
  registry.set(type, component);
}

/**
 * Get the component for an exercise type.
 * Throws if the type is not registered.
 */
export function getExerciseComponent(type: string): ComponentType<ExerciseComponentProps> {
  const component = registry.get(type);
  if (!component) {
    throw new Error(`Exercise type "${type}" is not registered. Available: ${[...registry.keys()].join(', ')}`);
  }
  return component;
}

/**
 * Check if an exercise type is registered.
 */
export function isExerciseRegistered(type: string): boolean {
  return registry.has(type);
}

// ─── Exercise Sequencer ───────────────────────────────────

export interface LessonSequence {
  exercises: ExerciseConfig[];
  currentIndex: number;
  results: ExerciseResult[];
  startedAt: number;
}

/**
 * Create a new lesson sequence from exercise configs.
 */
export function createSequence(exercises: ExerciseConfig[]): LessonSequence {
  return {
    exercises,
    currentIndex: 0,
    results: [],
    startedAt: Date.now(),
  };
}

/**
 * Get the current exercise in the sequence.
 */
export function currentExercise(sequence: LessonSequence): ExerciseConfig | null {
  return sequence.exercises[sequence.currentIndex] ?? null;
}

/**
 * Record a result and advance to the next exercise.
 * Returns updated sequence (immutable).
 */
export function advanceSequence(
  sequence: LessonSequence,
  result: ExerciseResult
): LessonSequence {
  return {
    ...sequence,
    results: [...sequence.results, result],
    currentIndex: sequence.currentIndex + 1,
  };
}

/**
 * Check if the lesson is complete.
 */
export function isSequenceComplete(sequence: LessonSequence): boolean {
  return sequence.currentIndex >= sequence.exercises.length;
}

/**
 * Compute lesson score from results.
 */
export function computeScore(sequence: LessonSequence): number {
  if (sequence.results.length === 0) return 0;
  const correct = sequence.results.filter(r => r.correct).length;
  return Math.round((correct / sequence.results.length) * 100);
}

/**
 * Compute total time spent on the lesson.
 */
export function computeTotalTime(sequence: LessonSequence): number {
  return sequence.results.reduce((sum, r) => sum + r.time_ms, 0);
}
