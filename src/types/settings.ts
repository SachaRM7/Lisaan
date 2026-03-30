// src/types/settings.ts

export type HarakatsMode = 'always' | 'adaptive' | 'never' | 'tap_reveal';
export type TransliterationMode = 'always' | 'tap_reveal' | 'never';
export type TranslationMode = 'always' | 'tap_reveal' | 'never';
export type ExerciseDirection = 'ar_to_fr' | 'fr_to_ar' | 'both';
export type AudioSpeed = 'slow' | 'normal' | 'native';
export type FontSizePreference = 'small' | 'medium' | 'large' | 'xlarge';
export type WriteTolerance = 'strict' | 'normal' | 'indulgent';

export interface UserSettings {
  harakats_mode: HarakatsMode;
  transliteration_mode: TransliterationMode;
  translation_mode: TranslationMode;
  exercise_direction: ExerciseDirection;
  audio_enabled: boolean;
  audio_autoplay: boolean;
  audio_speed: AudioSpeed;
  font_size: FontSizePreference;
  haptic_feedback: boolean;
  analytics_enabled: boolean;
  write_tolerance: WriteTolerance;
}

export const DEFAULT_SETTINGS: UserSettings = {
  harakats_mode: 'always',
  transliteration_mode: 'always',
  translation_mode: 'always',
  exercise_direction: 'both',
  audio_enabled: true,
  audio_autoplay: true,
  audio_speed: 'slow',
  font_size: 'large',
  haptic_feedback: true,
  analytics_enabled: true,
  write_tolerance: 'normal',
};
