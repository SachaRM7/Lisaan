// src/engines/grammar-exercise-generator.ts

import type { GrammarRule } from '../types/grammar';
import type { ExerciseConfig, ReorderWord } from '../types/exercise';
import { track } from '../analytics/posthog';

/**
 * Génère un tableau d'exercices pour une leçon de grammaire.
 * Chaque règle produit 2 exercices : compréhension (MCQ) + construction (reorder).
 */
export function generateGrammarExercises(
  rules: GrammarRule[],
  showTransliteration = true,
  showTranslation = true,
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];

  for (const rule of rules) {
    exercises.push(generateGrammarMCQ(rule, rules, showTranslation));
    exercises.push(generateGrammarReorder(rule, showTransliteration, showTranslation));
  }

  track('grammar_exercises_generated', {
    module_id: rules[0]?.module_id,
    rules_count: rules.length,
    exercises_count: exercises.length,
  });

  return exercises;
}

function generateGrammarMCQ(
  rule: GrammarRule,
  allRules: GrammarRule[],
  showTranslation: boolean,
): ExerciseConfig {
  const distractors = allRules
    .filter(r => r.id !== rule.id)
    .slice(0, 2)
    .map(r => ({
      id: r.id,
      text: { fr: r.example_translation_fr },
      correct: false,
    }));

  const options = shuffleArray([
    { id: rule.id, text: { fr: rule.example_translation_fr }, correct: true },
    ...distractors,
  ]);

  return {
    id: `grammar-mcq-${rule.id}`,
    type: 'mcq',
    instruction_fr: 'Que signifie cette phrase ?',
    prompt: { ar: rule.example_ar_vocalized },
    options,
    show_transliteration: showTranslation,
    metadata: { grammar_rule_id: rule.id },
  };
}

function generateGrammarReorder(
  rule: GrammarRule,
  showTransliteration: boolean,
  showTranslation: boolean,
): ExerciseConfig {
  // Filtrer les tokens non-arabes (ponctuation isolée comme "/" ou "؟")
  const words = rule.example_ar_vocalized.trim().split(/\s+/)
    .filter(w => /[\u0600-\u06FF]/.test(w));
  const wordObjects: ReorderWord[] = words.map((w, i) => ({
    id: `${rule.id}-word-${i}`,
    arabic: w.replace(/[\u064B-\u065F\u0670\u060C\u061B\u061F؟،]/g, ''),
    arabic_vocalized: w,
  }));

  const shuffled = shuffleArray([...wordObjects]);

  return {
    id: `grammar-reorder-${rule.id}`,
    type: 'reorder',
    instruction_fr: 'Remets les mots dans le bon ordre pour former une phrase.',
    prompt: { fr: rule.example_translation_fr },
    sentence_id: rule.id,
    words_shuffled: shuffled,
    correct_order: wordObjects.map(w => w.id),
    show_transliteration: showTransliteration,
    show_translation: showTranslation,
    hint_fr: rule.concept_fr,
    metadata: { grammar_rule_id: rule.id },
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
