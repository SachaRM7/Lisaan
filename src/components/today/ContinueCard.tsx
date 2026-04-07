// src/components/today/ContinueCard.tsx
// Carte "Continuer" — dernier module en cours, badge variante coloré

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { variantThemes } from '../../constants/theme';
import { getVariantFromModuleId } from '../../utils/variant';
import { CircleProgress } from '../ui/CircleProgress';
import type { Module } from '../../hooks/useModules';
import type { Lesson } from '../../hooks/useLessons';

interface ContinueCardProps {
  module: Module;
  completedCount: number;
  totalLessons: number;
  nextLesson: Lesson | null;
}

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);

export function ContinueCard({
  module,
  completedCount,
  totalLessons,
  nextLesson,
}: ContinueCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();
  const variant = getVariantFromModuleId(module.id);
  const vt = variantThemes[variant];
  const arabicLineHeight = Math.round(typography.size.arabicTitle * typography.lineHeight.arabic);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handleContinue() {
    if (nextLesson) {
      router.push(`/lesson/${nextLesson.id}` as any);
    } else {
      router.push(`/module/${module.id}` as any);
    }
  }

  return (
    <AnimatedPressable
      onPress={() => router.push(`/module/${module.id}` as any)}
      onPressIn={() => { scale.value = withSpring(0.98, { damping: 20, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20, stiffness: 300 }); }}
      style={animatedStyle}
    >
      <View style={{
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: vt.accent,
        minHeight: 200,
        padding: spacing.lg,
        ...shadows.medium,
      }}>
        {/* Badge variante coloré */}
        <View style={{
          alignSelf: 'flex-start',
          backgroundColor: vt.accent,
          borderRadius: borderRadius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.micro,
          marginBottom: spacing.sm,
        }}>
          <Text style={{
            fontFamily: typography.family.uiMedium,
            fontSize: typography.size.small,
            color: '#FFFFFF',
          }}>
            {vt.label}
          </Text>
        </View>

        {/* MODULE N + titre français */}
        <Text style={{
          fontFamily: typography.family.uiMedium,
          fontSize: typography.size.tiny,
          color: colors.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: typography.letterSpacing.caps,
          marginBottom: spacing.micro,
        }}>
          Module {module.sort_order}
        </Text>
        <Text style={{
          fontFamily: typography.family.uiMedium,
          fontSize: typography.size.body,
          color: colors.text.primary,
          marginBottom: spacing.xs,
        }}>
          {module.title_fr}
        </Text>

        {/* Titre arabe */}
        <Text style={{
          fontFamily: typography.family.arabicBold,
          fontSize: typography.size.arabicTitle,
          lineHeight: arabicLineHeight,
          color: colors.text.heroArabic,
          textAlign: 'center',
          marginVertical: spacing.sm,
        }}>
          {module.title_ar}
        </Text>

        {/* Barre de progression */}
        <View style={{
          height: 4,
          backgroundColor: colors.background.group,
          borderRadius: 2,
          marginBottom: spacing.sm,
          overflow: 'hidden',
        }}>
          <View style={{
            height: '100%',
            width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%`,
            backgroundColor: vt.accent,
            borderRadius: 2,
          }} />
        </View>

        {/* Bas : bouton Reprendre + Leçon X/Y */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => ({
              height: 44,
              borderRadius: borderRadius.pill,
              backgroundColor: pressed ? vt.accent : colors.brand.primary,
              paddingHorizontal: spacing.lg,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.prominent,
            })}
          >
            <Text style={{
              fontFamily: typography.family.uiBold,
              fontSize: typography.size.body,
              color: colors.text.inverse,
            }}>
              Reprendre
            </Text>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <CircleProgress completed={completedCount} total={totalLessons} size={40} />
            <Text style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.small,
              color: colors.text.secondary,
            }}>
              Leçon {Math.min(completedCount + 1, totalLessons)}/{totalLessons}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}
