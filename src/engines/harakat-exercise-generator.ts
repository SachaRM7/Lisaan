// src/engines/harakat-exercise-generator.ts

import type { ExerciseConfig, ExerciseOption, MatchPair } from '../types/exercise';
import type { Diacritic } from '../hooks/useDiacritics';
import type { Letter } from '../hooks/useLetters';

/**
 * Mapping leçon (sort_order dans Module 2) → diacritiques (sort_order dans la table diacritics)
 *
 * Ordre dans la DB :
 *   1 = Fatha, 2 = Damma, 3 = Kasra,
 *   4 = Fathatan, 5 = Dammatan, 6 = Kasratan,
 *   7 = Soukoun, 8 = Chadda
 *
 * Ordre pédagogique des leçons :
 *   Leçon 1 : Fatha (sort_order 1)
 *   Leçon 2 : Kasra (sort_order 3)
 *   Leçon 3 : Damma (sort_order 2)
 *   Leçon 4 : Tanwin — Fathatan, Dammatan, Kasratan (sort_order 4, 5, 6)
 *   Leçon 5 : Soukoun (sort_order 7)
 *   Leçon 6 : Chadda (sort_order 8)
 */
export const LESSON_DIACRITIC_RANGES: Record<number, number[]> = {
  1: [1],       // Fatha
  2: [3],       // Kasra
  3: [2],       // Damma
  4: [4, 5, 6], // Tanwin (Fathatan, Dammatan, Kasratan)
  5: [7],       // Soukoun
  6: [8],       // Chadda
};

/**
 * Génère un set d'exercices pour une leçon du Module 2.
 *
 * @param lessonSortOrder - Le sort_order de la leçon dans le Module 2 (1-6)
 * @param lessonDiacritics - Les diacritiques de la leçon courante
 * @param allDiacritics - Tous les diacritiques (pour les distracteurs)
 * @param knownLetters - Les lettres connues de l'utilisateur (du Module 1)
 */
export function generateHarakatExercises(
  lessonSortOrder: number,
  lessonDiacritics: Diacritic[],
  allDiacritics: Diacritic[],
  _knownLetters: Letter[],
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];

  for (const diacritic of lessonDiacritics) {
    // === EXERCICE 1 : MCQ — Identifier le diacritique ===
    if (diacritic.example_letters.length > 0) {
      const exampleSyllable = diacritic.example_letters[0];
      exercises.push({
        id: `mcq-identify-diacritic-${diacritic.id}`,
        type: 'mcq',
        instruction_fr: 'Quel diacritique est sur cette lettre ?',
        prompt: { ar: exampleSyllable },
        options: generateDiacriticOptions(diacritic, allDiacritics, 'name'),
      });
    }

    // === EXERCICE 2 : MCQ — Quel son produit ce diacritique ? ===
    exercises.push({
      id: `mcq-sound-of-${diacritic.id}`,
      type: 'mcq',
      instruction_fr: `Quel son produit la ${diacritic.name_fr.toLowerCase()} ?`,
      prompt: { ar: diacritic.name_ar, fr: diacritic.name_fr },
      options: generateDiacriticOptions(diacritic, allDiacritics, 'sound'),
    });

    // === EXERCICE 3 : MCQ inversé — Trouver la syllabe ===
    if (diacritic.example_letters.length > 0) {
      exercises.push({
        id: `mcq-find-syllable-${diacritic.id}`,
        type: 'mcq',
        instruction_fr: `Trouve la syllabe avec ${diacritic.name_fr.toLowerCase()}`,
        prompt: {
          fr: diacritic.transliteration
            ? `${diacritic.name_fr} — son "${diacritic.transliteration}"`
            : diacritic.name_fr,
        },
        options: generateSyllableOptions(diacritic, allDiacritics),
      });
    }
  }

  // === EXERCICE 4 : Match (association) ===
  // Pour les leçons 2, 3, 4 (comparaison entre diacritiques)
  if (lessonSortOrder >= 2 && lessonSortOrder <= 4) {
    const matchDiacritics = getMatchDiacritics(lessonSortOrder, allDiacritics);
    if (matchDiacritics.length >= 2) {
      exercises.push({
        id: `match-diacritics-lesson-${lessonSortOrder}`,
        type: 'match',
        instruction_fr: 'Associe chaque syllabe à son diacritique',
        prompt: {},
        matchPairs: generateMatchPairs(matchDiacritics),
      });
    }
  }

  // === EXERCICE 5 : MCQ de discrimination visuelle ===
  if (lessonSortOrder >= 2) {
    // Les 3 voyelles courtes (sort_orders 1, 2, 3)
    const shortVowels = allDiacritics.filter(d => d.sort_order >= 1 && d.sort_order <= 3);
    if (shortVowels.length >= 2) {
      const targetDiac = lessonDiacritics[0];
      if (targetDiac && targetDiac.sort_order <= 3) {
        exercises.push({
          id: `mcq-visual-discrimination-${targetDiac.id}`,
          type: 'mcq',
          instruction_fr: `Laquelle de ces syllabes porte une ${targetDiac.name_fr.toLowerCase()} ?`,
          prompt: { fr: targetDiac.name_fr },
          options: generateVisualDiscriminationOptions(targetDiac, shortVowels),
        });
      }
    }
  }

  return shuffleArray(exercises);
}

// ---- Fonctions helper ----

function generateDiacriticOptions(
  correct: Diacritic,
  allDiacritics: Diacritic[],
  mode: 'name' | 'sound',
): ExerciseOption[] {
  const sameCategory = allDiacritics.filter(
    d => d.id !== correct.id && d.category === correct.category,
  );
  const others = allDiacritics.filter(
    d => d.id !== correct.id && d.category !== correct.category,
  );
  const distractors = [...sameCategory, ...others].slice(0, 2);

  const options: ExerciseOption[] = [
    {
      id: correct.id,
      text: mode === 'name'
        ? { fr: correct.name_fr }
        : { fr: correct.transliteration
              ? `"${correct.transliteration}" — ${correct.sound_effect}`
              : correct.sound_effect },
      correct: true,
    },
    ...distractors.map(d => ({
      id: d.id,
      text: mode === 'name'
        ? { fr: d.name_fr }
        : { fr: d.transliteration
              ? `"${d.transliteration}" — ${d.sound_effect}`
              : d.sound_effect },
      correct: false,
    })),
  ];

  return shuffleArray(options);
}

function generateSyllableOptions(
  correct: Diacritic,
  allDiacritics: Diacritic[],
): ExerciseOption[] {
  const correctSyllable = correct.example_letters[0];

  const distractors = allDiacritics
    .filter(d => d.id !== correct.id && d.example_letters.length > 0)
    .slice(0, 2)
    .map(d => d.example_letters[0]);

  const options: ExerciseOption[] = [
    { id: correct.id, text: { ar: correctSyllable }, correct: true },
    ...distractors.map((syllable, i) => ({
      id: `distractor-${i}`,
      text: { ar: syllable },
      correct: false,
    })),
  ];

  return shuffleArray(options);
}

function generateVisualDiscriminationOptions(
  target: Diacritic,
  candidates: Diacritic[],
): ExerciseOption[] {
  if (!target.example_letters[0]) return [];

  const correctExample = target.example_letters[0];
  const distractors = candidates
    .filter(d => d.id !== target.id && d.example_letters.length > 0)
    .slice(0, 2)
    .map(d => d.example_letters[0]);

  const options: ExerciseOption[] = [
    { id: target.id, text: { ar: correctExample }, correct: true },
    ...distractors.map((ex, i) => ({
      id: `visual-distractor-${i}`,
      text: { ar: ex },
      correct: false,
    })),
  ];

  return shuffleArray(options);
}

/**
 * Retourne les diacritiques à comparer selon la leçon :
 * - Leçon 2 (kasra) : fatha(1) + kasra(3)
 * - Leçon 3 (damma) : fatha(1) + damma(2) + kasra(3)
 * - Leçon 4 (tanwin) : fathatan(4) + dammatan(5) + kasratan(6)
 */
function getMatchDiacritics(lessonSortOrder: number, allDiacritics: Diacritic[]): Diacritic[] {
  if (lessonSortOrder === 2) {
    // Fatha + Kasra
    return allDiacritics.filter(d => d.sort_order === 1 || d.sort_order === 3);
  }
  if (lessonSortOrder === 3) {
    // Fatha + Damma + Kasra (les 3 voyelles courtes)
    return allDiacritics.filter(d => d.sort_order >= 1 && d.sort_order <= 3);
  }
  if (lessonSortOrder === 4) {
    // Les 3 tanwins
    return allDiacritics.filter(d => d.sort_order >= 4 && d.sort_order <= 6);
  }
  return [];
}

function generateMatchPairs(diacritics: Diacritic[]): MatchPair[] {
  return diacritics.map(d => ({
    id: d.id,
    left: { ar: d.example_letters[0] ?? d.symbol },
    right: { fr: d.name_fr },
    left_vocalized: d.example_letters[0],
  }));
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
