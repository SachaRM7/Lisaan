// src/stores/useSettingsStore.ts

import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { getSettings, upsertSettings } from '../db/local-queries';
import { runSync } from '../engines/sync-manager';
import type { UserSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

interface SettingsState extends UserSettings {
  isLoaded: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const userId = useAuthStore.getState().userId;
      if (!userId) {
        set({ isLoaded: true });
        return;
      }

      const data = await getSettings(userId);

      if (data) {
        set({
          harakats_mode: data.harakats_mode ?? DEFAULT_SETTINGS.harakats_mode,
          transliteration_mode: data.transliteration_mode ?? DEFAULT_SETTINGS.transliteration_mode,
          translation_mode: data.translation_mode ?? DEFAULT_SETTINGS.translation_mode,
          exercise_direction: data.exercise_direction ?? DEFAULT_SETTINGS.exercise_direction,
          audio_autoplay: !!data.audio_autoplay,
          audio_speed: data.audio_speed ?? DEFAULT_SETTINGS.audio_speed,
          font_size: data.font_size ?? DEFAULT_SETTINGS.font_size,
          haptic_feedback: !!data.haptic_feedback,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (err) {
      console.error('[settings] Load error:', err);
      set({ isLoaded: true });
    }
  },

  updateSetting: (key, value) => {
    // Mise à jour locale immédiate
    set({ [key]: value } as Partial<SettingsState>);

    // Écriture SQLite + sync vers Cloud en arrière-plan
    (async () => {
      try {
        const userId = useAuthStore.getState().userId;
        if (!userId) return;

        const allSettings = get();
        await upsertSettings(userId, allSettings);
        runSync().catch(console.warn);
      } catch (err) {
        console.error('[settings] Sync error:', err);
      }
    })();
  },

  resetToDefaults: () => {
    set({ ...DEFAULT_SETTINGS });

    (async () => {
      try {
        const userId = useAuthStore.getState().userId;
        if (!userId) return;

        await upsertSettings(userId, DEFAULT_SETTINGS);
        runSync().catch(console.warn);
      } catch (err) {
        console.error('[settings] Reset sync error:', err);
      }
    })();
  },
}));
