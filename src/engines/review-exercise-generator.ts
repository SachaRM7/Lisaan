// src/engines/review-exercise-generator.ts

import type { ExerciseConfig, LocalizedText } from '../types/exercise';
import type { Letter } from '../hooks/useLetters';
import type { Diacritic } from '../hooks/useDiacritics';
import type { SRSCard } from './srs';
import type { ReviewDirection } from '../types/review';
import { selectReviewMode } from './review-mode-selector';

export interface ItemData {
  arabic: string;
  french: string;
  transliteration?: string;
  audio_url?: string;
}

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

// ─── 7.1 — Flashcard ─────────────────────────────────────────────────────────

export function generateFlashcardExercise(
  card: SRSCard,
  itemData: ItemData,
  direction: ReviewDirection = 'ar_to_fr',
): ExerciseConfig {
  const isArToFr = direction !== 'fr_to_ar';
  const prompt: LocalizedText = isArToFr ? { ar: itemData.arabic } : { fr: itemData.french };
  const back: LocalizedText = isArToFr ? { fr: itemData.french } : { ar: itemData.arabic };

  return {
    id: `flashcard-${card.id}-${Date.now()}`,
    type: 'flashcard',
    prompt,
    flashcard_back: back,
    audio_url: itemData.audio_url,
    metadata: { card_id: card.id },
  };
}

// ─── 7.2 — Write ─────────────────────────────────────────────────────────────

export function generateWriteExercise(
  card: SRSCard,
  itemData: ItemData,
  direction: ReviewDirection = 'ar_to_fr',
  acceptedAnswers?: string[],
): ExerciseConfig {
  const isArToFr = direction !== 'fr_to_ar';
  const prompt: LocalizedText = isArToFr ? { ar: itemData.arabic } : { fr: itemData.french };
  const answers = acceptedAnswers ?? (isArToFr ? [itemData.french] : [itemData.arabic]);

  return {
    id: `write-${card.id}-${Date.now()}`,
    type: 'write',
    instruction_fr: isArToFr ? 'Traduis en français' : 'Écris en arabe',
    prompt,
    write_accepted_answers: answers,
    write_answer_lang: isArToFr ? 'fr' : 'ar',
    metadata: { card_id: card.id },
  };
}

// ─── 7.3 — Match Review ───────────────────────────────────────────────────────

export function generateMatchReviewExercise(
  cards: SRSCard[],
  itemsData: ItemData[],
): ExerciseConfig {
  const pairs = cards.slice(0, 4).map((card, i) => ({
    id: card.id,
    left: { ar: itemsData[i]?.arabic ?? '' },
    right: { fr: itemsData[i]?.french ?? '' },
  }));

  return {
    id: `match-review-${Date.now()}`,
    type: 'match',
    prompt: {},
    instruction_fr: 'Associe chaque mot à sa traduction',
    matchPairs: pairs,
    metadata: { card_ids: cards.map(c => c.id) },
  };
}

// ─── 7.4 — Orchestrateur polymorphique ───────────────────────────────────────

export function generatePolymorphicReviewExercise(
  card: SRSCard,
  itemData: ItemData,
  distractors: ItemData[],
  options?: {
    forcedType?: ExerciseConfig['type'] | null;
    direction?: ReviewDirection;
    hasAudio?: boolean;
    acceptedAnswers?: string[];
  },
): ExerciseConfig {
  const direction = options?.direction ?? 'ar_to_fr';
  const type = options?.forcedType ?? selectReviewMode({
    card,
    hasAudio: options?.hasAudio ?? !!itemData.audio_url,
    matchAvailable: false, // groupage géré en session
  });

  switch (type) {
    case 'flashcard':
      return generateFlashcardExercise(card, itemData, direction);
    case 'write':
      return generateWriteExercise(card, itemData, direction, options?.acceptedAnswers);
    default:
      return generateMCQFromItemData(card, itemData, distractors, direction);
  }
}

// ─── 7.5 — MCQ agnostique ────────────────────────────────────────────────────

export function generateMCQFromItemData(
  card: SRSCard,
  itemData: ItemData,
  distractors: ItemData[],
  direction: ReviewDirection = 'ar_to_fr',
): ExerciseConfig {
  const isArToFr = direction !== 'fr_to_ar';
  const prompt: LocalizedText = isArToFr ? { ar: itemData.arabic } : { fr: itemData.french };

  const options = [
    {
      id: card.item_id,
      text: isArToFr ? { fr: itemData.french } : { ar: itemData.arabic },
      correct: true as const,
    },
    ...distractors.slice(0, 2).map((d, i) => ({
      id: `distractor-${i}`,
      text: isArToFr ? { fr: d.french } : { ar: d.arabic },
      correct: false as const,
    })),
  ].sort(() => Math.random() - 0.5);

  return {
    id: `mcq-${card.id}-${Date.now()}`,
    type: 'mcq',
    instruction_fr: isArToFr ? 'Que signifie ce mot ?' : 'Trouve la traduction arabe',
    prompt,
    options,
    audio_url: itemData.audio_url,
    metadata: { card_id: card.id },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Anciens générateurs (rétrocompat)
// ─────────────────────────────────────────────────────────────────────────────

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
