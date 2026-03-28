// src/components/learn/HeroModuleCard.tsx
// Card full-width pour le module en cours (Bento layout — Mission 1)

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { CircleProgress } from '../ui/CircleProgress';
import type { Module } from '../../hooks/useModules';

interface HeroModuleCardProps {
  module: Module;
  number: number;
  completedCount: number;
  totalLessons: number;
  onPressCard: () => void;
  onPressContinue: () => void;
}

export function HeroModuleCard({
  module,
  number,
  completedCount,
  totalLessons,
  onPressCard,
  onPressContinue,
}: HeroModuleCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const arabicLineHeight = Math.round(typography.size.arabicHero * 1.9);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Reanimated.View style={animatedStyle}>
      <Pressable
        onPress={onPressCard}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        }}
        style={{
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.md,
          borderWidth: 2,
          borderColor: colors.brand.primary,
          minHeight: 220,
          padding: spacing.lg,
          ...shadows.medium,
        }}
      >
        {/* Badge EN COURS */}
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: colors.brand.light,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.micro,
            marginBottom: spacing.sm,
          }}
        >
          <Text
            style={{
              fontFamily: typography.family.uiMedium,
              fontSize: typography.size.small,
              color: colors.brand.dark,
            }}
          >
            EN COURS
          </Text>
        </View>

        {/* MODULE N + titre français */}
        <Text
          style={{
            fontFamily: typography.family.uiMedium,
            fontSize: typography.size.tiny,
            color: colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.caps,
            marginBottom: spacing.micro,
          }}
        >
          Module {number}
        </Text>
        <Text
          style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.body,
            color: colors.text.primary,
            marginBottom: spacing.sm,
          }}
        >
          {module.title_fr}
        </Text>

        {/* Titre arabe massif — centré, très aéré */}
        <Text
          style={{
            fontFamily: typography.family.arabic,
            fontSize: typography.size.arabicHero,
            lineHeight: arabicLineHeight,
            color: colors.text.heroArabic,
            textAlign: 'center',
            marginVertical: spacing.md,
          }}
        >
          {module.title_ar}
        </Text>

        {/* Bas : bouton Continuer + CircleProgress */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.xs,
          }}
        >
          <Pressable
            onPress={onPressContinue}
            style={({ pressed }) => ({
              height: 48,
              borderRadius: borderRadius.pill,
              backgroundColor: pressed ? colors.brand.dark : colors.brand.primary,
              paddingHorizontal: spacing.lg,
              alignItems: 'center' as const,
              justifyContent: 'center' as const,
              ...shadows.prominent,
            })}
          >
            <Text
              style={{
                fontFamily: typography.family.uiBold,
                fontSize: typography.size.body,
                color: colors.text.inverse,
              }}
            >
              Continuer
            </Text>
          </Pressable>

          <CircleProgress completed={completedCount} total={totalLessons} size={48} />
        </View>
      </Pressable>
    </Reanimated.View>
  );
}
