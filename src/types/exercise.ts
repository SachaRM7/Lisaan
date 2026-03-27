// src/types/exercise.ts

/** Types d'exercices supportés */
export type ExerciseType =
  | 'mcq'
  | 'match'
  | 'fill_blank'
  | 'trace'
  | 'listen_select'
  | 'reorder'
  | 'dialogue';

/** Texte localisé (arabe + français) */
export interface LocalizedText {
  ar?: string;
  fr?: string;
}

/** Option dans un QCM ou une association */
export interface ExerciseOption {
  id: string;
  text: LocalizedText;
  text_vocalized?: string;
  correct: boolean;
}

/** Paire pour l'exercice Match (association) */
export interface MatchPair {
  id: string;
  left: LocalizedText;
  right: LocalizedText;
  left_vocalized?: string;
}

/** Configuration d'un exercice */
export interface ExerciseConfig {
  id: string;
  type: ExerciseType;
  prompt: LocalizedText;
  instruction_fr?: string;
  options?: ExerciseOption[];
  matchPairs?: MatchPair[];
  correct_answer?: string | string[];
  audio_url?: string;
  audio_fallback_text?: string;  // Texte arabe pour TTS si audio_url absent
  metadata?: Record<string, unknown>;
  display_settings?: {
    show_harakats?: boolean;
    show_transliteration?: boolean;
  };
  // fill_blank specific
  sentence?: {
    ar: string;
    fr: string;
    transliteration: string;
  };
  blank_word?: {
    ar: string;
    position: number;
  };
  // reorder specific
  sentence_id?: string;
  words_shuffled?: ReorderWord[];
  correct_order?: string[];
  show_transliteration?: boolean;
  show_translation?: boolean;
  hint_fr?: string;
  // dialogue specific
  context_fr?: string;
  turns?: DialogueTurn[];
  choices?: DialogueChoice[];
}

// ── Reorder ──────────────────────────────────────────────────

export interface ReorderWord {
  id: string;
  arabic: string;
  arabic_vocalized: string;
  transliteration?: string;
}

export interface ReorderExerciseConfig {
  type: 'reorder';
  sentence_id: string;
  words_shuffled: ReorderWord[];
  correct_order: string[];
  show_transliteration: boolean;
  show_translation: boolean;
  hint_fr?: string;
}

// ── Dialogue ─────────────────────────────────────────────────

export interface DialogueTurn {
  id: string;
  speaker: 'a' | 'b';
  speaker_name?: string;
  arabic: string;
  arabic_vocalized: string;
  transliteration?: string;
  translation_fr?: string;
  audio_url?: string;
}

export interface DialogueChoice {
  id: string;
  arabic: string;
  arabic_vocalized: string;
  transliteration?: string;
  is_correct: boolean;
  feedback_fr?: string;
}

export interface DialogueExerciseConfig {
  type: 'dialogue';
  context_fr?: string;
  turns: DialogueTurn[];
  choices: DialogueChoice[];
  show_transliteration: boolean;
  show_translation: boolean;
}

/** Résultat d'un exercice complété */
export interface ExerciseResult {
  exercise_id: string;
  correct: boolean;
  time_ms: number;
  attempts: number;
  user_answer: string | string[];
}

/** Props communes à tous les composants d'exercice */
export interface ExerciseComponentProps {
  config: ExerciseConfig;
  onComplete: (result: ExerciseResult) => void;
}
