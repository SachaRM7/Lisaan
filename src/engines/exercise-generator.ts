// src/engines/exercise-generator.ts

import type { ExerciseConfig, ExerciseOption } from '../types/exercise';
import type { Letter } from '../hooks/useLetters';

/**
 * Génère un set d'exercices MCQ pour une leçon de lettres.
 * Chaque lettre produit 2 exercices :
 * 1. Voir la lettre arabe → trouver le nom français
 * 2. Voir le nom français → trouver la lettre arabe
 */
export function generateLetterExercises(
  lessonLetters: Letter[],
  allLetters: Letter[],
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];

  for (const letter of lessonLetters) {
    // Exercice 1 : lettre arabe → nom français
    exercises.push({
      id: `mcq-ar-to-fr-${letter.id}`,
      type: 'mcq',
      instruction_fr: 'Quelle est cette lettre ?',
      prompt: { ar: letter.form_isolated },
      options: generateOptions(letter, lessonLetters, allLetters, 'ar_to_fr'),
    });

    // Exercice 2 : nom français → lettre arabe
    exercises.push({
      id: `mcq-fr-to-ar-${letter.id}`,
      type: 'mcq',
      instruction_fr: `Trouve la lettre "${letter.name_fr}"`,
      prompt: { fr: `${letter.name_fr} (${letter.transliteration})` },
      options: generateOptions(letter, lessonLetters, allLetters, 'fr_to_ar'),
    });
  }

  return shuffleArray(exercises);
}

function generateOptions(
  correctLetter: Letter,
  lessonLetters: Letter[],
  allLetters: Letter[],
  direction: 'ar_to_fr' | 'fr_to_ar',
): ExerciseOption[] {
  const distractors = pickDistractors(correctLetter, lessonLetters, allLetters, 2);

  const options: ExerciseOption[] = [
    {
      id: correctLetter.id,
      text: direction === 'ar_to_fr'
        ? { fr: correctLetter.name_fr }
        : { ar: correctLetter.form_isolated },
      correct: true,
    },
    ...distractors.map((d) => ({
      id: d.id,
      text: direction === 'ar_to_fr'
        ? { fr: d.name_fr }
        : { ar: d.form_isolated },
      correct: false,
    })),
  ];

  return shuffleArray(options);
}

function pickDistractors(
  correct: Letter,
  lessonLetters: Letter[],
  allLetters: Letter[],
  count: number,
): Letter[] {
  const candidates = lessonLetters.filter((l) => l.id !== correct.id);

  if (candidates.length < count) {
    const others = allLetters.filter(
      (l) => l.id !== correct.id && !candidates.find((c) => c.id === l.id),
    );
    candidates.push(...others);
  }

  return shuffleArray(candidates).slice(0, count);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
