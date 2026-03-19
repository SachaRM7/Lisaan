// src/engines/review-exercise-generator.ts

import type { ExerciseConfig } from '../types/exercise';
import type { Letter } from '../hooks/useLetters';
import type { Diacritic } from '../hooks/useDiacritics';
import type { SRSCard } from './srs';

/**
 * Génère un exercice MCQ pour une carte SRS de type lettre.
 * Utilise toutes les lettres connues comme distracteurs potentiels.
 */
export function generateReviewExercise(
  card: SRSCard,
  targetLetter: Letter,
  allKnownLetters: Letter[],
): ExerciseConfig {
  // Alterner entre ar→fr et fr→ar
  const direction = Math.random() > 0.5 ? 'ar_to_fr' : 'fr_to_ar';

  // Prendre 2 distracteurs parmi les lettres connues (pas la cible)
  const distractors = allKnownLetters
    .filter(l => l.id !== targetLetter.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const options = [
    {
      id: targetLetter.id,
      text: direction === 'ar_to_fr'
        ? { fr: targetLetter.name_fr }
        : { ar: targetLetter.form_isolated },
      correct: true as const,
    },
    ...distractors.map(d => ({
      id: d.id,
      text: direction === 'ar_to_fr'
        ? { fr: d.name_fr }
        : { ar: d.form_isolated },
      correct: false as const,
    })),
  ].sort(() => Math.random() - 0.5);

  return {
    id: `review-${card.id}-${Date.now()}`,
    type: 'mcq',
    instruction_fr: direction === 'ar_to_fr'
      ? 'Quelle est cette lettre ?'
      : `Trouve la lettre "${targetLetter.name_fr}"`,
    prompt: direction === 'ar_to_fr'
      ? { ar: targetLetter.form_isolated }
      : { fr: `${targetLetter.name_fr} (${targetLetter.transliteration})` },
    options,
    metadata: { letter_id: targetLetter.id, card_id: card.id },
  };
}

/**
 * Génère un exercice MCQ pour une carte SRS de type diacritique.
 * "Quel est ce diacritique ?" — syllabe arabe → nom du diacritique
 */
export function generateDiacriticReviewExercise(
  card: SRSCard,
  targetDiacritic: Diacritic,
  allDiacritics: Diacritic[],
): ExerciseConfig {
  const exampleSyllable = targetDiacritic.example_letters[0] ?? targetDiacritic.symbol;

  const distractors = allDiacritics
    .filter(d => d.id !== targetDiacritic.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const options = [
    { id: targetDiacritic.id, text: { fr: targetDiacritic.name_fr }, correct: true as const },
    ...distractors.map(d => ({
      id: d.id,
      text: { fr: d.name_fr },
      correct: false as const,
    })),
  ].sort(() => Math.random() - 0.5);

  return {
    id: `review-diacritic-${card.id}-${Date.now()}`,
    type: 'mcq',
    instruction_fr: 'Quel diacritique est sur cette lettre ?',
    prompt: { ar: exampleSyllable },
    options,
    metadata: { diacritic_id: targetDiacritic.id, card_id: card.id },
  };
}
