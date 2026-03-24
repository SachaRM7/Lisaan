// src/engines/word-exercise-generator.ts

import type { ExerciseConfig, ExerciseOption } from '../types/exercise';
import type { Word } from '../hooks/useWords';
import type { Root } from '../hooks/useRoots';

/**
 * Mapping leçon (sort_order dans Module 3) → type de contenu
 *
 * Leçon 1 : Mots simples (is_simple_word = true)
 * Leçon 2 : Solaires/Lunaires (mots simples + al-)
 * Leçon 3 : Racine k-t-b
 * Leçon 4 : Racines ʿ-l-m et d-r-s
 * Leçon 5 : Racines q-r-ʾ et f-t-ḥ
 * Leçon 6 : Révision de tous les mots
 */
export const LESSON_WORD_CONFIG: Record<number, {
  type: 'simple' | 'solar_lunar' | 'root' | 'revision';
  rootIds?: string[];  // translittérations des racines (ex: 'k-t-b')
}> = {
  1: { type: 'simple' },
  2: { type: 'solar_lunar' },
  3: { type: 'root', rootIds: ['k-t-b'] },
  4: { type: 'root', rootIds: ['ʿ-l-m', 'd-r-s'] },
  5: { type: 'root', rootIds: ['q-r-ʾ', 'f-t-ḥ'] },
  6: { type: 'revision' },
};

/** Mapping leçon → translittérations des racines (pour charger les mots côté écrans) */
export const LESSON_ROOT_TRANSLITS: Record<number, string[]> = {
  3: ['k-t-b'],
  4: ['ʿ-l-m', 'd-r-s'],
  5: ['q-r-ʾ', 'f-t-ḥ'],
};

/**
 * Génère des exercices pour une leçon du Module 3.
 */
export function generateWordExercises(
  lessonSortOrder: number,
  lessonWords: Word[],
  allWords: Word[],
  roots: Root[],
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];
  const config = LESSON_WORD_CONFIG[lessonSortOrder];

  if (!config) return [];

  if (config.type === 'simple' || config.type === 'revision') {
    // MCQ : Mot arabe → traduction française
    for (const word of lessonWords) {
      exercises.push({
        id: `mcq-ar-to-fr-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        audio_url: word.audio_url ?? undefined,
        audio_fallback_text: word.arabic_vocalized,
        options: generateTranslationOptions(word, allWords, 'ar_to_fr'),
        metadata: { word_id: word.id },
      });
    }

    // MCQ : Traduction française → mot arabe
    for (const word of lessonWords.slice(0, 4)) {
      exercises.push({
        id: `mcq-fr-to-ar-${word.id}`,
        type: 'mcq',
        instruction_fr: `Trouve le mot "${word.translation_fr}"`,
        prompt: { fr: word.translation_fr },
        options: generateTranslationOptions(word, allWords, 'fr_to_ar'),
        metadata: { word_id: word.id },
      });
    }

    // MCQ : Mot arabe → translittération (exercice de décodage)
    for (const word of lessonWords.slice(0, 4)) {
      exercises.push({
        id: `mcq-decode-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Comment se prononce ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        audio_url: word.audio_url ?? undefined,
        audio_fallback_text: word.arabic_vocalized,
        options: generateDecodingOptions(word, allWords),
        metadata: { word_id: word.id },
      });
    }
  }

  if (config.type === 'solar_lunar') {
    // Exercices spécifiques solaires/lunaires — uniquement pour les noms
    const nounsOnly = lessonWords.filter(w => w.pos === 'noun');
    for (const word of nounsOnly) {
      exercises.push({
        id: `mcq-article-${word.id}`,
        type: 'mcq',
        instruction_fr: `Comment se prononce "le/la" + "${word.transliteration}" ?`,
        prompt: { ar: word.arabic_vocalized, fr: word.translation_fr },
        audio_url: word.audio_url ?? undefined,
        audio_fallback_text: word.arabic_vocalized,
        options: generateArticleOptions(word),
        metadata: { word_id: word.id },
      });
    }

    // MCQ de traduction classiques en complément
    for (const word of lessonWords) {
      exercises.push({
        id: `mcq-ar-to-fr-solar-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        audio_url: word.audio_url ?? undefined,
        audio_fallback_text: word.arabic_vocalized,
        options: generateTranslationOptions(word, allWords, 'ar_to_fr'),
        metadata: { word_id: word.id },
      });
    }
  }

  if (config.type === 'root') {
    const lessonRoots = roots.filter(r => config.rootIds?.includes(r.transliteration));

    for (const root of lessonRoots) {
      const rootWords = lessonWords.filter(w => w.root_id === root.id);

      // MCQ : Mot arabe → traduction
      for (const word of rootWords) {
        exercises.push({
          id: `mcq-root-ar-to-fr-${word.id}`,
          type: 'mcq',
          instruction_fr: 'Que signifie ce mot ?',
          prompt: { ar: word.arabic_vocalized },
          audio_url: word.audio_url ?? undefined,
          audio_fallback_text: word.arabic_vocalized,
          options: generateTranslationOptions(word, allWords, 'ar_to_fr'),
          metadata: { word_id: word.id, root_id: root.id },
        });
      }

      // Match : Associer les mots de la racine à leurs traductions
      if (rootWords.length >= 2) {
        exercises.push({
          id: `match-root-${root.id}`,
          type: 'match',
          instruction_fr: `Associe les mots de la racine ${root.transliteration}`,
          prompt: { fr: `Racine : ${root.consonants.join('-')} (${root.core_meaning_fr})` },
          matchPairs: rootWords.slice(0, 4).map(w => ({
            id: w.id,
            left: { ar: w.arabic_vocalized },
            right: { fr: w.translation_fr },
          })),
          metadata: { root_id: root.id },
        });
      }

      // MCQ : "Quel mot vient de la racine ?"
      if (rootWords.length > 0) {
        const correctWord = rootWords[0];
        const distractors = allWords
          .filter(w => w.root_id !== root.id && w.root_id !== null)
          .slice(0, 2);

        exercises.push({
          id: `mcq-identify-root-${root.id}`,
          type: 'mcq',
          instruction_fr: `Quel mot vient de la racine ${root.consonants.join('-')} (${root.core_meaning_fr}) ?`,
          prompt: { fr: `Racine : ${root.consonants.join(' - ')}` },
          options: shuffleArray([
            { id: correctWord.id, text: { ar: correctWord.arabic_vocalized, fr: correctWord.translation_fr }, correct: true },
            ...distractors.map(d => ({
              id: d.id, text: { ar: d.arabic_vocalized, fr: d.translation_fr }, correct: false,
            })),
          ]),
          metadata: { root_id: root.id },
        });
      }
    }
  }

  return shuffleArray(exercises);
}

// ── Helpers ──────────────────────────────────────────────────

function generateTranslationOptions(
  correct: Word,
  allWords: Word[],
  direction: 'ar_to_fr' | 'fr_to_ar',
): ExerciseOption[] {
  const distractors = allWords
    .filter(w => w.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  return shuffleArray([
    {
      id: correct.id,
      text: direction === 'ar_to_fr'
        ? { fr: correct.translation_fr }
        : { ar: correct.arabic_vocalized },
      correct: true,
    },
    ...distractors.map(d => ({
      id: d.id,
      text: direction === 'ar_to_fr'
        ? { fr: d.translation_fr }
        : { ar: d.arabic_vocalized },
      correct: false,
    })),
  ]);
}

function generateDecodingOptions(correct: Word, allWords: Word[]): ExerciseOption[] {
  const distractors = allWords
    .filter(w => w.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  return shuffleArray([
    { id: correct.id, text: { fr: correct.transliteration }, correct: true },
    ...distractors.map(d => ({
      id: d.id, text: { fr: d.transliteration }, correct: false,
    })),
  ]);
}

// Lettres solaires arabes : le ل de l'article s'assimile à la lettre suivante
const SOLAR_LETTERS = new Set([
  'ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ل', 'ن',
]);

function generateArticleOptions(word: Word): ExerciseOption[] {
  // Ignore les diacritiques pour trouver la première lettre de base
  const firstLetter = word.arabic_vocalized.replace(/[\u064B-\u065F\u0670]/g, '').charAt(0);
  const isSolar = SOLAR_LETTERS.has(firstLetter);

  const firstTranslit = word.transliteration.charAt(0);
  const assimilated = `a${firstTranslit}-${word.transliteration}`;
  const regular = `al-${word.transliteration}`;

  return shuffleArray([
    { id: 'regular',     text: { fr: regular },    correct: !isSolar },
    { id: 'assimilated', text: { fr: assimilated }, correct: isSolar },
  ]);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
