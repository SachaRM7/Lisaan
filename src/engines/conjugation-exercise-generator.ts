// src/engines/conjugation-exercise-generator.ts

import type { ConjugationEntry } from '../types/grammar';
import type { ExerciseConfig, DialogueTurn, DialogueChoice } from '../types/exercise';
import type { LessonSections } from '../types/section';
import { buildSection, buildLessonSections } from './section-utils';

const PRIORITY_PRONOUNS = ['ana', 'anta', 'huwa', 'hiya', 'nahnu'];

/**
 * Génère des exercices de conjugaison pour un verbe et un temps donnés.
 * Mélange MCQ (identifier la forme / le pronom) + dialogue (utiliser en contexte).
 */
export function generateConjugationExercises(
  _wordId: string,
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

/**
 * Génère des leçons de présent sous forme de LessonSections.
 * Une section par verbe : pronoun-MCQ + form-MCQ + fill_blank pour chaque pronom prioritaire.
 *
 * @param verbGroups  Tableau de { wordId, verbLabel_fr, entries } — un élément par verbe
 * @param showTransliteration  Afficher la translittération dans les exercices
 */
export function generatePresentTenseFillBlanks(
  verbGroups: Array<{
    wordId: string;
    verbLabel_fr: string;
    entries: ConjugationEntry[];
  }>,
  showTransliteration = true,
): LessonSections {
  const sections = verbGroups.map((group, index) => {
    const presentEntries = group.entries.filter(e => e.tense === 'present');
    const targetEntries = presentEntries.filter(e => PRIORITY_PRONOUNS.includes(e.pronoun_code));
    const allPresentEntries = presentEntries;

    const exercises: ExerciseConfig[] = [];

    // MCQ pronom + MCQ forme pour chaque pronom prioritaire
    for (const entry of targetEntries) {
      exercises.push(generatePronounMCQ(entry, allPresentEntries, showTransliteration));
      exercises.push(generateFormMCQ(entry, allPresentEntries, showTransliteration));
    }

    // fill_blank : une phrase par pronom prioritaire (si example_sentence disponible)
    const withSentences = targetEntries.filter(e => e.example_sentence_ar_vocalized);
    for (const entry of withSentences) {
      const distractors = allPresentEntries
        .filter(e => e.id !== entry.id && e.conjugated_ar !== entry.conjugated_ar)
        .slice(0, 3)
        .map(e => ({
          id: e.id,
          text: { ar: e.conjugated_ar_vocalized },
          correct: false,
        }));

      exercises.push({
        id: `present-fillblank-${entry.id}`,
        type: 'fill_blank',
        instruction_fr: 'Complète la phrase avec la bonne forme du verbe',
        prompt: { ar: entry.conjugated_ar_vocalized },
        sentence: {
          ar: entry.example_sentence_ar ?? entry.conjugated_ar,
          fr: entry.example_sentence_translation_fr ?? '',
          transliteration: showTransliteration ? entry.conjugated_transliteration : '',
        },
        blank_word: {
          ar: entry.conjugated_ar_vocalized,
          position: 0,
        },
        options: shuffleArray([
          { id: entry.id, text: { ar: entry.conjugated_ar_vocalized }, correct: true },
          ...distractors,
        ]),
        show_transliteration: showTransliteration,
        metadata: { conjugation_id: entry.id, word_id: entry.word_id },
      });
    }

    // Dialogue si suffisamment d'exemples
    if (withSentences.length >= 2) {
      exercises.push(generateConjugationDialogue(withSentences, showTransliteration));
    }

    return buildSection(
      index,
      `${group.verbLabel_fr} — présent`,
      [group.wordId],
      exercises,
    );
  });

  return buildLessonSections('conjugation', sections);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
