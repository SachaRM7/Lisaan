// src/stores/useSettingsStore.ts

import { create } from 'zustand';
import { supabase } from '../db/remote';
import type { UserSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

interface SettingsState extends UserSettings {
  isLoaded: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoaded: true });
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows — normal au premier lancement
        console.error('[settings] Load error:', error.message);
      }

      if (data) {
        set({
          harakats_mode: data.harakats_mode ?? DEFAULT_SETTINGS.harakats_mode,
          transliteration_mode: data.transliteration_mode ?? DEFAULT_SETTINGS.transliteration_mode,
          translation_mode: data.translation_mode ?? DEFAULT_SETTINGS.translation_mode,
          exercise_direction: data.exercise_direction ?? DEFAULT_SETTINGS.exercise_direction,
          audio_autoplay: data.audio_autoplay ?? DEFAULT_SETTINGS.audio_autoplay,
          audio_speed: data.audio_speed ?? DEFAULT_SETTINGS.audio_speed,
          font_size: data.font_size ?? DEFAULT_SETTINGS.font_size,
          haptic_feedback: data.haptic_feedback ?? DEFAULT_SETTINGS.haptic_feedback,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (err) {
      console.error('[settings] Network error:', err);
      set({ isLoaded: true });
    }
  },

  updateSetting: (key, value) => {
    // Mise à jour locale immédiate
    set({ [key]: value } as Partial<SettingsState>);

    // Sync vers Supabase en arrière-plan
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('user_settings')
          .upsert(
            { user_id: user.id, [key]: value },
            { onConflict: 'user_id' },
          );
      } catch (err) {
        console.error('[settings] Sync error:', err);
      }
    })();
  },

  resetToDefaults: () => {
    set({ ...DEFAULT_SETTINGS });

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('user_settings')
          .upsert(
            { user_id: user.id, ...DEFAULT_SETTINGS },
            { onConflict: 'user_id' },
          );
      } catch (err) {
        console.error('[settings] Reset sync error:', err);
      }
    })();
  },
}));
