// src/components/parcours/DialecteCard.tsx
// Card dialecte individuelle — accent coloré en haut, progression

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { variantThemes } from '../../constants/theme';
import type { VariantKey } from '../../constants/theme';

interface DialecteCardProps {
  variant: VariantKey;
  progress?: { completed: number; total: number };
  onPress: () => void;
}

export function DialecteCard({ variant, progress, onPress }: DialecteCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const vt = variantThemes[variant];
  const arabicLineHeight = Math.round(typography.size.arabicBody * typography.lineHeight.arabic);

  const pct = progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;
  const isNew = !progress || progress.total === 0;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.background.group,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        ...shadows.subtle,
      }}
    >
      {/* Bande accent en haut */}
      <View style={{
        height: 4,
        backgroundColor: vt.accent,
      }} />

      <View style={{ padding: spacing.md }}>
        {/* Titre FR + Tag Nouveau */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.body,
            color: colors.text.primary,
          }}>
            {vt.label}
          </Text>
          {isNew && (
            <View style={{
              backgroundColor: vt.accentLight,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.xs,
              paddingVertical: 2,
            }}>
              <Text style={{
                fontFamily: typography.family.uiMedium,
                fontSize: typography.size.tiny,
                color: vt.accent,
              }}>
                Nouveau
              </Text>
            </View>
          )}
        </View>

        {/* Titre arabe */}
        <Text style={{
          fontFamily: typography.family.arabic,
          fontSize: typography.size.arabicBody,
          lineHeight: arabicLineHeight,
          color: colors.text.heroArabic,
          marginBottom: spacing.xs,
        }}>
          {vt.labelAr}
        </Text>

        {/* Barre de progression */}
        {progress && progress.total > 0 && (
          <>
            <View style={{
              height: 3,
              backgroundColor: colors.border.medium,
              borderRadius: 1.5,
              marginTop: spacing.xs,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${pct}%`,
                backgroundColor: vt.accent,
                borderRadius: 1.5,
              }} />
            </View>
            <Text style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.tiny,
              color: colors.text.secondary,
              marginTop: spacing.micro,
            }}>
              {pct}% · {progress.completed}/{progress.total} leçons
            </Text>
          </>
        )}

        {isNew && (
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.tiny,
            color: colors.text.secondary,
            marginTop: spacing.micro,
          }}>
            {vt.label} · à découvrir
          </Text>
        )}
      </View>
    </Pressable>
  );
}
