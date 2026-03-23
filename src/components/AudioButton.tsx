// src/components/AudioButton.tsx

import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudio, type UseAudioOptions } from '../hooks/useAudio';
import { Colors } from '../constants/theme';

interface AudioButtonProps extends UseAudioOptions {
  size?: number;
  color?: string;
  style?: object;
}

export function AudioButton({ size = 24, color, style, ...audioOptions }: AudioButtonProps) {
  const { play, audioState, isEnabled } = useAudio(audioOptions);

  if (!isEnabled) return null;

  const iconColor = color ?? Colors.primary;

  return (
    <TouchableOpacity
      onPress={play}
      style={[styles.button, style]}
      accessibilityLabel="Écouter la prononciation"
      disabled={audioState === 'loading' || audioState === 'playing'}
    >
      {audioState === 'loading' ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : audioState === 'playing' ? (
        <Ionicons name="volume-high" size={size} color={iconColor} />
      ) : (
        <Ionicons name="volume-medium-outline" size={size} color={iconColor} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
