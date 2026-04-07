// src/components/parcours/SectionHeader.tsx
// Header de section réutilisable : barre couleur + titre + sous-titre

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SectionHeaderProps {
  accentColor: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ accentColor, title, subtitle }: SectionHeaderProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md }}>
      {/* Barre verticale colorée */}
      <View style={{
        width: 4,
        height: 40,
        backgroundColor: accentColor,
        borderRadius: 2,
        marginTop: 2,
      }} />

      <View>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.h2,
          color: colors.text.primary,
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.small,
            color: colors.text.secondary,
            marginTop: spacing.micro,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
