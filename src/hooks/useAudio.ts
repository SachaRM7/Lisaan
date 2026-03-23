// src/hooks/useAudio.ts

import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useSettingsStore } from '../stores/useSettingsStore';
import { downloadAndCacheAudio } from '../services/audio-cache-service';

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
  const { audioUrl, fallbackText, fallbackLanguage = 'ar', autoPlay } = options;
  const soundRef = useRef<Audio.Sound | null>(null);
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
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (audioUrl) {
        const localPath = await downloadAndCacheAudio(audioUrl);
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: localPath },
          { shouldPlay: true, rate: rateForSpeed(speed), volume: 1.0 }
        );
        soundRef.current = sound;
        setAudioState('playing');
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) {
            setAudioState('idle');
          }
        });
      } else if (fallbackText) {
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
  }, [audioUrl, fallbackText, fallbackLanguage, speed]);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
    Speech.stop();
    setAudioState('idle');
  }, []);

  return { play, stop, audioState, shouldAutoPlay, isEnabled };
}
