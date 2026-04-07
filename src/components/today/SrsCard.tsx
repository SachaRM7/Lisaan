// src/components/today/SrsCard.tsx
// Carte "Révision du jour" — nombre de cartes SRS dues

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { SRSCard } from '../../engines/srs';

interface SrsCardProps {
  dueCards: SRSCard[];
}

export function SrsCard({ dueCards }: SrsCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();

  const total = dueCards.length;

  // Répartition par type
  const byType: Record<string, number> = {};
  for (const card of dueCards) {
    byType[card.item_type] = (byType[card.item_type] ?? 0) + 1;
  }

  const subtitle = Object.entries(byType)
    .map(([type, count]) => {
      const labels: Record<string, string> = {
        letter: 'Lettres',
        diacritic: 'Harakats',
        word: 'Mots',
        sentence: 'Phrases',
        conjugation: 'Conjugaisons',
        grammar_rule: 'Grammaire',
        quran_word: 'Coran',
      };
      return `${labels[type] ?? type}: ${count}`;
    })
    .join(' · ');

  if (total === 0) {
    return (
      <View style={{
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.medium,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.base,
        ...shadows.subtle,
      }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.status.successLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name="checkmark" size={24} color={colors.status.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.body,
            color: colors.text.primary,
          }}>
            Aucune carte à réviser 🎉
          </Text>
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.small,
            color: colors.text.secondary,
            marginTop: spacing.micro,
          }}>
            Tu es à jour dans tes révisions
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => router.push('/review-session')}
      style={({ pressed }) => ({
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        borderColor: pressed ? colors.brand.dark : colors.brand.primary,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.base,
        ...shadows.subtle,
      })}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.brand.light,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Ionicons name="refresh" size={22} color={colors.brand.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.body,
          color: colors.text.primary,
        }}>
          {total} cartes à réviser
        </Text>
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.small,
          color: colors.text.secondary,
          marginTop: spacing.micro,
        }}>
          {subtitle}
        </Text>
      </View>

      <View style={{
        height: 36,
        borderRadius: borderRadius.pill,
        borderWidth: 1.5,
        borderColor: colors.brand.primary,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.small,
          color: colors.brand.primary,
        }}>
          Réviser
        </Text>
      </View>
    </Pressable>
  );
}
