// src/engines/conjugation-exercise-generator.ts

import type { ConjugationEntry } from '../types/grammar';
import type { ExerciseConfig, DialogueTurn, DialogueChoice } from '../types/exercise';

const PRIORITY_PRONOUNS = ['ana', 'anta', 'huwa', 'hiya', 'nahnu'];

/**
 * Génère des exercices de conjugaison pour un verbe et un temps donnés.
 * Mélange MCQ (identifier la forme / le pronom) + dialogue (utiliser en contexte).
 */
export function generateConjugationExercises(
  wordId: string,
  entries: ConjugationEntry[],
  allVerbEntries: ConjugationEntry[],
  showTransliteration = true,
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];

  const targetEntries = entries.filter(e => PRIORITY_PRONOUNS.includes(e.pronoun_code));

  for (const entry of targetEntries) {
    exercises.push(generatePronounMCQ(entry, entries, showTransliteration));
    exercises.push(generateFormMCQ(entry, allVerbEntries, showTransliteration));
  }

  const withExamples = entries.filter(e => e.example_sentence_ar_vocalized);
  if (withExamples.length >= 2) {
    exercises.push(generateConjugationDialogue(withExamples, showTransliteration));
  }

  return exercises;
}

function generatePronounMCQ(
  target: ConjugationEntry,
  allEntries: ConjugationEntry[],
  showTransliteration: boolean,
): ExerciseConfig {
  const distractors = allEntries
    .filter(e => e.id !== target.id && e.pronoun_fr !== target.pronoun_fr)
    .slice(0, 2)
    .map(e => ({
      id: e.id,
      text: { fr: `${e.pronoun_fr} (${e.pronoun_ar})` },
      correct: false,
    }));

  const options = shuffleArray([
    { id: target.id, text: { fr: `${target.pronoun_fr} (${target.pronoun_ar})` }, correct: true },
    ...distractors,
  ]);

  return {
    id: `conj-pronoun-mcq-${target.id}`,
    type: 'mcq',
    instruction_fr: 'Quel est le sujet de cette forme ?',
    prompt: { ar: target.conjugated_ar_vocalized },
    options,
    show_transliteration: showTransliteration,
    metadata: { conjugation_id: target.id, word_id: target.word_id },
  };
}

function generateFormMCQ(
  target: ConjugationEntry,
  allEntries: ConjugationEntry[],
  showTransliteration: boolean,
): ExerciseConfig {
  const distractors = allEntries
    .filter(e => e.id !== target.id && e.conjugated_ar !== target.conjugated_ar)
    .slice(0, 2)
    .map(e => ({
      id: e.id,
      text: { ar: e.conjugated_ar_vocalized },
      text_vocalized: showTransliteration ? e.conjugated_transliteration : undefined,
      correct: false,
    }));

  const options = shuffleArray([
    {
      id: target.id,
      text: { ar: target.conjugated_ar_vocalized },
      text_vocalized: showTransliteration ? target.conjugated_transliteration : undefined,
      correct: true,
    },
    ...distractors,
  ]);

  return {
    id: `conj-form-mcq-${target.id}`,
    type: 'mcq',
    instruction_fr: `Comment dit-on "${target.pronoun_fr}" au passé ?`,
    prompt: { fr: `${target.pronoun_fr} (${target.pronoun_ar})` },
    options,
    show_transliteration: showTransliteration,
    metadata: { conjugation_id: target.id, word_id: target.word_id },
  };
}

function generateConjugationDialogue(
  entries: ConjugationEntry[],
  showTransliteration: boolean,
): ExerciseConfig {
  const [turnA, ...rest] = entries;
  const correctEntry = rest[0] ?? entries[1];
  const wrongEntries = entries.filter(e => e.id !== correctEntry.id).slice(0, 2);

  const turns: DialogueTurn[] = [
    {
      id: 'turn-a',
      speaker: 'a',
      arabic: turnA.example_sentence_ar ?? turnA.conjugated_ar,
      arabic_vocalized: turnA.example_sentence_ar_vocalized ?? turnA.conjugated_ar_vocalized,
      translation_fr: turnA.example_sentence_translation_fr ?? undefined,
    },
  ];

  const choices: DialogueChoice[] = shuffleArray([
    {
      id: correctEntry.id,
      arabic: correctEntry.example_sentence_ar ?? correctEntry.conjugated_ar,
      arabic_vocalized: correctEntry.example_sentence_ar_vocalized ?? correctEntry.conjugated_ar_vocalized,
      transliteration: showTransliteration ? correctEntry.conjugated_transliteration : undefined,
      is_correct: true,
      feedback_fr: 'Bonne forme verbale !',
    },
    ...wrongEntries.map(e => ({
      id: e.id,
      arabic: e.conjugated_ar,
      arabic_vocalized: e.conjugated_ar_vocalized,
      transliteration: showTransliteration ? e.conjugated_transliteration : undefined,
      is_correct: false,
      feedback_fr: `Ici le sujet est différent (${e.pronoun_fr})`,
    })),
  ]);

  return {
    id: `conj-dialogue-${correctEntry.word_id}`,
    type: 'dialogue',
    prompt: { fr: 'Complète le dialogue' },
    context_fr: 'Complète le dialogue',
    turns,
    choices,
    show_transliteration: showTransliteration,
    show_translation: true,
    metadata: { word_id: correctEntry.word_id },
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
