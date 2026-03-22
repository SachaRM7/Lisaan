// src/engines/sentence-exercise-generator.ts

import type { ExerciseConfig, ExerciseOption } from '../types/exercise';
import type { Sentence } from '../hooks/useSentences';
import type { Dialogue, DialogueTurn } from '../hooks/useDialogues';
import type { Word } from '../hooks/useWords';

/**
 * Mapping leçon (sort_order dans Module 4) → type de contenu
 *
 * Leçon 1 : هذا/هذه (démonstratifs proches)
 * Leçon 2 : ذلك/تلك (démonstratifs éloignés + adjectifs)
 * Leçon 3 : Pronoms possessifs (-ي, -كَ, -هُ, -نَا)
 * Leçon 4 : Phrase nominale avec adjectif (البيت كبير)
 * Leçon 5 : Fill blank sur toutes les phrases apprises
 * Leçon 6 : Mini-dialogues
 */
export const LESSON_SENTENCE_CONFIG: Record<number, {
  type: 'demonstrative_close' | 'demonstrative_far' | 'possessive' | 'nominal' | 'fill_blank' | 'dialogue';
  sentenceIds?: string[];
  dialogueIds?: string[];
}> = {
  1: { type: 'demonstrative_close',
       sentenceIds: ['sent-hatha-kitab','sent-hathihi-madrasa','sent-hatha-qalam',
                     'sent-hathihi-maktaba','sent-ma-hatha','sent-ma-hathihi'] },
  2: { type: 'demonstrative_far',
       sentenceIds: ['sent-dhalika-bayt','sent-tilka-shams',
                     'sent-dhalika-bayt-kabir','sent-hatha-kitab-mufid'] },
  3: { type: 'possessive',
       sentenceIds: ['sent-kitabi','sent-kitabuka','sent-baytuna','sent-qalamuh'] },
  4: { type: 'nominal',
       sentenceIds: ['sent-al-bayt-kabir','sent-al-kitab-mufid',
                     'sent-al-madrasa-jamila','sent-al-walad-saghir'] },
  5: { type: 'fill_blank' },
  6: { type: 'dialogue', dialogueIds: ['dial-salam','dial-maa-hatha','dial-taqdim'] },
};

export function generateSentenceExercises(
  lessonSortOrder: number,
  lessonSentences: Sentence[],
  allSentences: Sentence[],
  allWords: Word[],
  dialogues?: (Dialogue & { turns: DialogueTurn[] })[],
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];
  const config = LESSON_SENTENCE_CONFIG[lessonSortOrder];
  if (!config) return [];

  // === Leçons 1-4 : MCQ traduction ===
  if (['demonstrative_close', 'demonstrative_far', 'possessive', 'nominal'].includes(config.type)) {
    for (const sentence of lessonSentences) {
      // MCQ : Phrase arabe → traduction française
      exercises.push({
        id: `mcq-sent-ar-fr-${sentence.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie cette phrase ?',
        prompt: { ar: sentence.arabic_vocalized },
        options: generateSentenceTranslationOptions(sentence, allSentences),
        metadata: { sentence_id: sentence.id },
      });

      // MCQ : Traduction française → phrase arabe
      exercises.push({
        id: `mcq-sent-fr-ar-${sentence.id}`,
        type: 'mcq',
        instruction_fr: 'Comment dit-on en arabe ?',
        prompt: { fr: sentence.translation_fr },
        options: generateSentenceArabicOptions(sentence, allSentences),
        metadata: { sentence_id: sentence.id },
      });
    }

    if (config.type === 'demonstrative_close') {
      exercises.push(generateDemonstrativeGenderMCQ());
    }
    if (config.type === 'possessive') {
      exercises.push(...generatePossessiveMCQs());
    }
  }

  // === Leçon 5 : Fill blank ===
  if (config.type === 'fill_blank') {
    const targetSentences = allSentences.filter(s => s.difficulty <= 2);
    for (const sentence of targetSentences) {
      const words = sentence.arabic_vocalized.split(' ');
      if (words.length >= 2) {
        const blankIndex = Math.floor(words.length / 2);
        const correctWord = words[blankIndex];
        const distractors = findDistractors(correctWord, allWords, 2);

        exercises.push({
          id: `fill-${sentence.id}`,
          type: 'fill_blank',
          instruction_fr: 'Complète la phrase.',
          prompt: { ar: sentence.arabic_vocalized, fr: sentence.translation_fr },
          sentence: {
            ar: sentence.arabic_vocalized,
            fr: sentence.translation_fr,
            transliteration: sentence.transliteration,
          },
          blank_word: {
            ar: correctWord,
            position: blankIndex,
          },
          options: shuffleArray([
            { id: `opt-correct-${sentence.id}`, text: { ar: correctWord }, correct: true },
            ...distractors.map((d, i) => ({
              id: `opt-wrong-${sentence.id}-${i}`,
              text: { ar: d },
              correct: false,
            })),
          ]),
          metadata: { sentence_id: sentence.id },
        });
      }
    }
  }

  // === Leçon 6 : Dialogues ===
  if (config.type === 'dialogue' && dialogues) {
    // Toutes les répliques (tours pairs = réponses) de tous les dialogues → distracteurs globaux
    const allReplies: DialogueTurn[] = dialogues.flatMap(d =>
      (d.turns ?? []).filter((_, j) => j % 2 === 1)
    );

    for (const d of dialogues) {
      const turns: DialogueTurn[] = d.turns ?? [];
      if (turns.length < 2) continue;

      for (let i = 0; i < turns.length - 1; i += 2) {
        const prompt = turns[i];
        const correctReply = turns[i + 1];
        const wrongReplies = allReplies.filter(r => r.id !== correctReply.id);

        exercises.push({
          id: `mcq-dialogue-${d.id}-${i}`,
          type: 'mcq',
          instruction_fr: 'Quelle est la bonne réponse ?',
          prompt: { ar: prompt.arabic_vocalized, fr: prompt.translation_fr },
          options: shuffleArray([
            { id: correctReply.id, text: { ar: correctReply.arabic_vocalized, fr: correctReply.translation_fr }, correct: true },
            ...wrongReplies.slice(0, 2).map(w => ({
              id: w.id,
              text: { ar: w.arabic_vocalized, fr: w.translation_fr },
              correct: false,
            })),
          ]),
          metadata: { dialogue_id: d.id },
        });
      }
    }
  }

  return shuffleArray(exercises);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSentenceTranslationOptions(
  correct: Sentence,
  allSentences: Sentence[],
): ExerciseOption[] {
  const distractors = allSentences
    .filter(s => s.id !== correct.id && s.difficulty <= correct.difficulty + 1)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  return shuffleArray([
    { id: correct.id, text: { fr: correct.translation_fr }, correct: true },
    ...distractors.map(d => ({ id: d.id, text: { fr: d.translation_fr }, correct: false })),
  ]);
}

function generateSentenceArabicOptions(
  correct: Sentence,
  allSentences: Sentence[],
): ExerciseOption[] {
  const distractors = allSentences
    .filter(s => s.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  return shuffleArray([
    { id: correct.id, text: { ar: correct.arabic_vocalized }, correct: true },
    ...distractors.map(d => ({ id: d.id, text: { ar: d.arabic_vocalized }, correct: false })),
  ]);
}

function generateDemonstrativeGenderMCQ(): ExerciseConfig {
  return {
    id: 'mcq-demonstrative-gender',
    type: 'mcq',
    instruction_fr: 'Quel démonstratif utilise-t-on pour un nom féminin ?',
    prompt: { fr: 'مدرسة (école) est féminin. Comment dit-on "ceci est une école" ?' },
    options: shuffleArray([
      { id: 'hathihi-opt', text: { ar: 'هَذِهِ مَدْرَسَةٌ' }, correct: true },
      { id: 'hatha-opt',   text: { ar: 'هَذَا مَدْرَسَةٌ' },  correct: false },
      { id: 'dhalika-opt', text: { ar: 'ذَلِكَ مَدْرَسَةٌ' }, correct: false },
    ]),
    metadata: {},
  };
}

function generatePossessiveMCQs(): ExerciseConfig[] {
  return [
    {
      id: 'mcq-poss-1st',
      type: 'mcq',
      instruction_fr: 'Comment dit-on "mon livre" ?',
      prompt: { fr: '"Mon livre"' },
      options: shuffleArray([
        { id: 'kitabi',   text: { ar: 'كِتَابِي' },  correct: true },
        { id: 'kitabuka', text: { ar: 'كِتَابُكَ' }, correct: false },
        { id: 'kitabuh',  text: { ar: 'كِتَابُهُ' }, correct: false },
      ]),
      metadata: {},
    },
    {
      id: 'mcq-poss-2nd',
      type: 'mcq',
      instruction_fr: 'Comment dit-on "notre maison" ?',
      prompt: { fr: '"Notre maison"' },
      options: shuffleArray([
        { id: 'baytuna', text: { ar: 'بَيْتُنَا' }, correct: true },
        { id: 'bayti',   text: { ar: 'بَيْتِي' },   correct: false },
        { id: 'baytuka', text: { ar: 'بَيْتُكَ' },  correct: false },
      ]),
      metadata: {},
    },
  ];
}

function findDistractors(targetWord: string, allWords: Word[], count: number): string[] {
  return allWords
    .filter(w => w.arabic_vocalized !== targetWord && w.arabic_vocalized.length > 1)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(w => w.arabic_vocalized);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
