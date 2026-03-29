// src/components/learn/CompletedModuleCard.tsx
// Card carrée pour module terminé — grille 2 par ligne (Bento layout — Mission 1)

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { Module } from '../../hooks/useModules';

interface CompletedModuleCardProps {
  module: Module;
  number: number;
  onPress: () => void;
}

export function CompletedModuleCard({ module, number: _number, onPress }: CompletedModuleCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const arabicLineHeight = Math.round(typography.size.arabicBody * 1.9);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Reanimated.View style={[animatedStyle, { flex: 1 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        }}
        style={{
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.md,
          aspectRatio: 1,
          padding: spacing.sm,
          overflow: 'hidden',
          ...shadows.subtle,
        }}
      >
        {/* Checkmark haut-droite */}
        <View style={{ alignItems: 'flex-end' }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.status.successLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="checkmark" size={14} color={colors.status.success} />
          </View>
        </View>

        {/* Centre : calligraphie arabe */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text
            style={{
              fontFamily: typography.family.arabic,
              fontSize: typography.size.arabicBody,
              lineHeight: arabicLineHeight,
              color: colors.text.heroArabic,
              textAlign: 'center',
            }}
          >
            {module.title_ar}
          </Text>
        </View>

        {/* Bas-Gauche : titre français */}
        <Text
          numberOfLines={2}
          style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.small,
            color: colors.text.secondary,
          }}
        >
          {module.title_fr}
        </Text>
      </Pressable>
    </Reanimated.View>
  );
}
