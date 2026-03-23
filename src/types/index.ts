/**
 * Lisaan — Core Types
 * Mirrors the Supabase schema + additional client-side types.
 */

// ─── Enums ────────────────────────────────────────────────

export type VariantType = 'msa' | 'darija' | 'egyptian' | 'levantine' | 'khaliji' | 'quranic';

export type DiacriticCategory = 'vowel_short' | 'vowel_long' | 'tanwin' | 'other';

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'particle' | 'pronoun' | 'preposition' | 'conjunction';

export type GenderType = 'masculine' | 'feminine' | 'na';

export type ExerciseType =
  | 'mcq'
  | 'match'
  | 'fill_blank'
  | 'trace'
  | 'listen_select'
  | 'reorder'
  | 'translate'
  | 'dialogue';

export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export type SrsItemType = 'letter' | 'diacritic' | 'word' | 'sentence';

export type HarakatsMode = 'always' | 'adaptive' | 'never' | 'tap_reveal';

export type DisplayMode = 'always' | 'tap_reveal' | 'never';

export type ExerciseDirection = 'ar_to_fr' | 'fr_to_ar' | 'both';

export type AudioSpeed = 'slow' | 'normal' | 'native';

export type FontSizePref = 'small' | 'medium' | 'large' | 'xlarge';

// ─── Content Models ───────────────────────────────────────

export interface Letter {
  id: string;
  sort_order: number;
  name_ar: string;
  name_fr: string;
  transliteration: string;
  ipa: string;
  form_isolated: string;
  form_initial: string;
  form_medial: string;
  form_final: string;
  connects_left: boolean;
  connects_right: boolean;
  is_sun_letter: boolean;
  articulation_group: string;
  articulation_fr: string;
  pedagogy_notes: string | null;
  audio_url: string | null;
}

export interface Diacritic {
  id: string;
  sort_order: number;
  name_ar: string;
  name_fr: string;
  symbol: string;
  sound_effect: string;
  category: DiacriticCategory;
  position: string;
  audio_url: string | null;
}

export interface Root {
  id: string;
  consonants: string[];
  transliteration: string;
  core_meaning_fr: string;
  core_meaning_ar: string | null;
  frequency_rank: number | null;
}

export interface Word {
  id: string;
  root_id: string | null;
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  ipa: string | null;
  pattern: string | null;
  pos: PartOfSpeech;
  frequency_rank: number | null;
  audio_url: string | null;
  plural_id: string | null;
  gender: GenderType;
}

export interface WordVariant {
  id: string;
  word_id: string;
  variant: VariantType;
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  audio_url: string | null;
  notes_fr: string | null;
}

export interface Sentence {
  id: string;
  arabic: string;
  arabic_vocalized: string;
  translation_fr: string;
  transliteration: string;
  word_ids: string[];
  audio_url: string | null;
  context: string | null;
  variant: VariantType;
  difficulty: number;
}

export interface Module {
  id: string;
  title_fr: string;
  title_ar: string | null;
  description_fr: string | null;
  sort_order: number;
  variant: VariantType;
}

export interface Lesson {
  id: string;
  module_id: string;
  title_fr: string;
  title_ar: string | null;
  description_fr: string | null;
  sort_order: number;
  xp_reward: number;
  estimated_minutes: number;
  prerequisite_ids: string[];
}

// ─── Exercise Config ──────────────────────────────────────

export interface LocalizedText {
  ar?: string;
  fr?: string;
}

export interface ExerciseOption {
  id: string;
  text?: LocalizedText;
  image_url?: string;
  audio_url?: string;
  correct: boolean;
}

export interface ExerciseHint {
  text: LocalizedText;
  delay_ms: number;
}

export interface ExerciseDisplaySettings {
  show_harakats: boolean | 'adaptive';
  show_transliteration: boolean;
  show_translation: boolean;
  direction: ExerciseDirection;
}

export interface ExerciseConfig {
  id: string;
  type: ExerciseType;
  variant_id: VariantType;
  prompt: LocalizedText;
  options?: ExerciseOption[];
  correct_answer: string | string[];
  hints?: ExerciseHint[];
  audio_url?: string;
  display_settings: ExerciseDisplaySettings;
  /** Type-specific extra data */
  meta?: Record<string, unknown>;
}

export interface ExerciseResult {
  exercise_id: string;
  correct: boolean;
  time_ms: number;
  attempts: number;
  user_answer: string | string[];
}

export interface Exercise {
  id: string;
  lesson_id: string;
  type: ExerciseType;
  config: ExerciseConfig;
  sort_order: number;
  difficulty: number;
  tags: string[];
}

// ─── User Models ──────────────────────────────────────────

export interface OnboardingAnswers {
  motivations: string[];
  level: string;
  objective: string;
  dialect_contact: string;
  daily_time: string;
}

export interface User {
  id: string;
  display_name: string | null;
  onboarding_answers: OnboardingAnswers | null;
  recommended_variant: VariantType;
  active_variant: VariantType;
  streak_current: number;
  streak_longest: number;
  total_xp: number;
  daily_goal_minutes: number;
  last_activity_at: string | null;
}

export interface UserSettings {
  user_id: string;
  harakats_mode: HarakatsMode;
  transliteration_mode: DisplayMode;
  translation_mode: DisplayMode;
  exercise_direction: ExerciseDirection;
  audio_enabled: boolean;
  audio_autoplay: boolean;
  audio_speed: AudioSpeed;
  font_size: FontSizePref;
  haptic_feedback: boolean;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: LessonStatus;
  score: number;
  completed_at: string | null;
  attempts: number;
  time_spent_seconds: number;
  synced_at: string | null;
}

export interface SrsCard {
  id: string;
  user_id: string;
  item_type: SrsItemType;
  item_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_review_at: string | null;
  last_quality: number | null;
}

// ─── Onboarding ───────────────────────────────────────────

export interface VariantScore {
  variant: VariantType;
  label: string;
  score: number; // 0-100
}

export interface OnboardingRecommendation {
  scores: VariantScore[];
  recommended: VariantType;
  message: string;
}
