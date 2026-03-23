// src/types/exercise.ts

/** Types d'exercices supportés */
export type ExerciseType =
  | 'mcq'
  | 'match'
  | 'fill_blank'
  | 'trace'
  | 'listen_select';

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
