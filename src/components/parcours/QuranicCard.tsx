// src/components/parcours/QuranicCard.tsx
// Grande card coranique — fond sombre, texte or

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface QuranicCardProps {
  studiedCount: number;
  memorizedCount: number;
  onPress: () => void;
}

export function QuranicCard({ studiedCount, memorizedCount, onPress }: QuranicCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const arabicLineHeight = Math.round(typography.size.arabicHero * typography.lineHeight.arabic);

  return (
    <Pressable onPress={onPress}>
      <View style={{
        backgroundColor: '#0A3D30',
        borderRadius: borderRadius.md,
        padding: spacing.xl,
        alignItems: 'center',
        gap: spacing.md,
        ...shadows.prominent,
        shadowColor: '#0A3D30',
      }}>
        {/* Basmala en grand */}
        <Text style={{
          fontFamily: typography.family.arabicBold,
          fontSize: typography.size.arabicHero,
          lineHeight: arabicLineHeight,
          color: '#D4AF37',
          textAlign: 'center',
        }}>
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </Text>

        {/* Stats */}
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.small,
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
        }}>
          {studiedCount} sourates étudiées · {memorizedCount} mémorisées
        </Text>

        {/* Bouton */}
        <View style={{
          height: 44,
          borderRadius: borderRadius.pill,
          borderWidth: 1.5,
          borderColor: '#D4AF37',
          paddingHorizontal: spacing.xl,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.body,
            color: '#D4AF37',
          }}>
            Découvrir →
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
