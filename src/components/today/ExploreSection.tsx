// src/components/today/ExploreSection.tsx
// Section "Explorer les univers" — 3 cards : MSA, Dialectes, Coranique

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { variantThemes } from '../../constants/theme';

interface ExploreSectionProps {
  msaProgress: { completed: number; total: number };
  dialectCount: number;
  quranProgress: { studied: number; memorized: number };
}

interface UniverseCardProps {
  label: string;
  labelAr: string;
  accent: string;
  accentLight: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  centered?: boolean;
}

function UniverseCard({
  label,
  labelAr,
  accent,
  accentLight,
  subtitle,
  icon,
  onPress,
  centered,
}: UniverseCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const arabicLineHeight = Math.round(typography.size.arabicBody * typography.lineHeight.arabic);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: centered ? undefined : 1,
        backgroundColor: colors.background.group,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderTopWidth: 4,
        borderTopColor: accent,
        ...shadows.subtle,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: centered ? 'center' : 'flex-start',
        gap: spacing.xs,
        marginBottom: spacing.xs,
      }}>
        <Ionicons name={icon as any} size={16} color={accent} />
        <Text style={{
          fontFamily: typography.family.uiMedium,
          fontSize: typography.size.small,
          color: accent,
        }}>
          {label}
        </Text>
      </View>

      <Text style={{
        fontFamily: typography.family.arabic,
        fontSize: typography.size.arabicBody,
        lineHeight: arabicLineHeight,
        color: colors.text.heroArabic,
        textAlign: centered ? 'center' : 'left',
      }}>
        {labelAr}
      </Text>

      <Text style={{
        fontFamily: typography.family.ui,
        fontSize: typography.size.tiny,
        color: colors.text.secondary,
        marginTop: spacing.xs,
      }}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export function ExploreSection({
  msaProgress,
  dialectCount,
  quranProgress,
}: ExploreSectionProps) {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  const msaPct = msaProgress.total > 0
    ? Math.round((msaProgress.completed / msaProgress.total) * 100)
    : 0;

  return (
    <View>
      <Text style={{
        fontFamily: typography.family.uiMedium,
        fontSize: typography.size.tiny,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: typography.letterSpacing.caps,
        marginBottom: spacing.sm,
      }}>
        Explorer
      </Text>

      <View style={{ gap: spacing.sm }}>
        {/* Ligne 1 : MSA + Dialectes */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <UniverseCard
            label="Arabe Standard"
            labelAr="العربية الفصحى"
            accent={variantThemes.msa.accent}
            accentLight={variantThemes.msa.accentLight}
            subtitle={`${msaProgress.total} modules · ${msaPct}% complété`}
            icon="book"
            onPress={() => router.push('/(tabs)/parcours')}
          />
          <UniverseCard
            label="Dialectes"
            labelAr="اللهجات"
            accent={variantThemes.darija.accent}
            accentLight={variantThemes.darija.accentLight}
            subtitle={`${dialectCount} dialectes · Darija, Égyptien...`}
            icon="message-circle"
            onPress={() => router.push('/(tabs)/parcours')}
          />
        </View>

        {/* Ligne 2 : Coranique (full-width) */}
        <UniverseCard
          label="Arabe Coranique"
          labelAr="القرآن الكريم"
          accent={variantThemes.quranic.accent}
          accentLight={variantThemes.quranic.accentLight}
          subtitle={`${quranProgress.studied} sourates · ${quranProgress.memorized} mémorisées`}
          icon="book"
          centered
          onPress={() => router.push('/(tabs)/parcours')}
        />
      </View>
    </View>
  );
}
