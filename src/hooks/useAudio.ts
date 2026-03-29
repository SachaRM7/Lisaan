// src/hooks/useAudio.ts
// Note: expo-av retiré (incompatible Expo Go SDK 50+) — audio via expo-speech uniquement

import { useCallback, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { useSettingsStore } from '../stores/useSettingsStore';

export type AudioState = 'idle' | 'loading' | 'playing' | 'error';

export interface UseAudioOptions {
  audioUrl?: string | null;
  fallbackText?: string;
  fallbackLanguage?: string;
  autoPlay?: boolean;
}

const rateForSpeed = (speed: string) =>
  speed === 'slow' ? 0.65 : speed === 'native' ? 1.25 : 1.0;

// Supprime les harakats (voyelles courtes, tanwin, shadda…) pour un TTS propre
const stripHarakats = (text: string) =>
  text.replace(/[\u064B-\u065F\u0670]/g, '');

export function useAudio(options: UseAudioOptions) {
  const { audioUrl: _audioUrl, fallbackText, fallbackLanguage = 'ar', autoPlay } = options;
  const soundRef = useRef<any>(null);
  const [audioState, setAudioState] = useState<AudioState>('idle');

  const isEnabled = useSettingsStore(s => s.audio_enabled);
  const speed = useSettingsStore(s => s.audio_speed);
  const globalAutoPlay = useSettingsStore(s => s.audio_autoplay);

  const shouldAutoPlay = autoPlay ?? globalAutoPlay;

  const play = useCallback(async () => {
    if (!isEnabled) return;
    setAudioState('loading');

    try {
      if (soundRef.current) {
        soundRef.current = null;
      }

      if (fallbackText) {
        setAudioState('playing');
        Speech.speak(stripHarakats(fallbackText), {
          language: fallbackLanguage,
          rate: rateForSpeed(speed) * 0.8,
          onDone: () => setAudioState('idle'),
          onError: () => setAudioState('error'),
        });
      } else {
        setAudioState('idle');
      }
    } catch (e) {
      console.warn('[useAudio] play error:', e);
      setAudioState('error');
    }
  }, [fallbackText, fallbackLanguage, speed]);

  const stop = useCallback(async () => {
    Speech.stop();
    setAudioState('idle');
  }, []);

  return { play, stop, audioState, shouldAutoPlay, isEnabled };
}
