// src/components/learn/LockedModuleCard.tsx
// Card carrée pour module verrouillé — calligraphie fantôme, sans cadenas (Bento layout — Mission 1)

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import type { Module } from '../../hooks/useModules';

interface LockedModuleCardProps {
  module: Module;
  number: number;
}

export function LockedModuleCard({ module, number }: LockedModuleCardProps) {
  const { colors, typography, borderRadius } = useTheme();
  const arabicLineHeight = Math.round(typography.size.arabicBody * 1.9);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background.group,
        borderRadius: borderRadius.md,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 0,
      }}
    >
      {/* Calligraphie fantôme — aucun cadenas */}
      <Text
        style={{
          fontFamily: typography.family.arabic,
          fontSize: typography.size.arabicBody,
          lineHeight: arabicLineHeight,
          color: colors.text.primary,
          opacity: 0.08,
          textAlign: 'center',
        }}
      >
        {module.title_ar}
      </Text>
    </View>
  );
}
