// src/engines/word-exercise-generator.ts

import type { ExerciseConfig, ExerciseOption } from '../types/exercise';
import type { Word } from '../hooks/useWords';
import type { Root } from '../hooks/useRoots';

/**
 * Mapping leçon (sort_order dans Module 3) → type de contenu
 *
 * POST-PIVOT É10.5 :
 * Les leçons sont organisées par thème (fréquence d'abord),
 * pas par racine. Les racines apparaissent en bonus quand
 * plusieurs mots d'une leçon partagent la même racine.
 *
 * Leçon 1 : Premiers mots simples (is_simple_word + theme first_words)
 * Leçon 2 : Solaires/Lunaires (mots simples + al-)
 * Leçon 3 : Famille (theme family)
 * Leçon 4 : Quotidien (theme daily)
 * Leçon 5 : Environnement/Lieux (theme places)
 * Leçon 6 : Décrire (theme describe — adjectifs et révision)
 */
export const LESSON_WORD_CONFIG: Record<number, {
  type: 'simple' | 'solar_lunar' | 'theme' | 'revision';
  theme?: string;
}> = {
  1: { type: 'simple' },
  2: { type: 'solar_lunar' },
  3: { type: 'theme', theme: 'family' },
  4: { type: 'theme', theme: 'daily' },
  5: { type: 'theme', theme: 'places' },
  6: { type: 'theme', theme: 'describe' },
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

  if (config.type === 'theme') {
    // MCQ : Mot arabe → traduction française (pour chaque mot du thème)
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

    // MCQ : Traduction française → mot arabe (moitié des mots)
    for (const word of lessonWords.slice(0, Math.ceil(lessonWords.length / 2))) {
      exercises.push({
        id: `mcq-fr-to-ar-${word.id}`,
        type: 'mcq',
        instruction_fr: `Trouve le mot "${word.translation_fr}"`,
        prompt: { fr: word.translation_fr },
        options: generateTranslationOptions(word, allWords, 'fr_to_ar'),
        metadata: { word_id: word.id },
      });
    }

    // MCQ : Décodage (mot arabe → translittération)
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

    // Match : Associer 4 mots du thème à leurs traductions
    if (lessonWords.length >= 4) {
      exercises.push({
        id: `match-theme-${config.theme}`,
        type: 'match',
        instruction_fr: 'Associe les mots à leur traduction',
        prompt: { fr: '' },
        matchPairs: lessonWords.slice(0, 4).map(w => ({
          id: w.id,
          left: { ar: w.arabic_vocalized },
          right: { fr: w.translation_fr },
        })),
        metadata: {},
      });
    }

    // BONUS RACINE : Si 2+ mots de la leçon partagent une racine, ajouter un exercice "quelle racine ?"
    const rootGroups = new Map<string, Word[]>();
    for (const word of lessonWords) {
      if (word.root_id) {
        const group = rootGroups.get(word.root_id) || [];
        group.push(word);
        rootGroups.set(word.root_id, group);
      }
    }

    for (const [rootId, rootWords] of rootGroups) {
      if (rootWords.length >= 2) {
        const root = roots.find(r => r.id === rootId);
        if (root) {
          exercises.push({
            id: `mcq-root-bonus-${rootId}`,
            type: 'mcq',
            instruction_fr: 'Ces mots partagent une racine. Laquelle ?',
            prompt: {
              ar: rootWords.map(w => w.arabic_vocalized).join(' — '),
              fr: rootWords.map(w => w.translation_fr).join(', '),
            },
            options: shuffleArray([
              { id: rootId, text: { ar: root.consonants.join(' - '), fr: root.core_meaning_fr }, correct: true },
              ...roots
                .filter(r => r.id !== rootId)
                .slice(0, 2)
                .map(r => ({
                  id: r.id,
                  text: { ar: r.consonants.join(' - '), fr: r.core_meaning_fr },
                  correct: false,
                })),
            ]),
            metadata: { root_id: rootId },
          });
        }
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
