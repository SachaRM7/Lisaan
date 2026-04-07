// src/components/parcours/MsaModuleItem.tsx
// Un item de module MSA avec cercle numéro + indicateur de statut

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { Module } from '../../hooks/useModules';

type ModuleStatus = 'completed' | 'in_progress' | 'locked';

interface MsaModuleItemProps {
  module: Module;
  number: number;
  status: ModuleStatus;
  onPress: () => void;
  accentColor?: string;
}

export function MsaModuleItem({
  module,
  number,
  status,
  onPress,
  accentColor = '#0F624C',
}: MsaModuleItemProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';

  const arabicLineHeight = Math.round(typography.size.arabicSmall * typography.lineHeight.arabic);

  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        opacity: isLocked ? 0.45 : 1,
      }}
    >
      {/* Cercle numéro */}
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isCompleted ? colors.status.success : isLocked ? colors.status.disabled : accentColor,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isCompleted ? (
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        ) : isLocked ? (
          <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
        ) : (
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.body,
            color: '#FFFFFF',
          }}>
            {number}
          </Text>
        )}
      </View>

      {/* Textes */}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: typography.family.uiMedium,
          fontSize: typography.size.body,
          color: colors.text.primary,
        }}>
          {module.title_fr}
        </Text>
        <Text style={{
          fontFamily: typography.family.arabic,
          fontSize: typography.size.arabicSmall,
          lineHeight: arabicLineHeight,
          color: colors.text.heroArabic,
        }}>
          {module.title_ar}
        </Text>
      </View>

      {/* Indicateur à droite */}
      {isCompleted && (
        <View style={{
          backgroundColor: colors.status.successLight,
          borderRadius: borderRadius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.micro,
        }}>
          <Text style={{
            fontFamily: typography.family.uiMedium,
            fontSize: typography.size.tiny,
            color: colors.status.success,
          }}>
            ✓
          </Text>
        </View>
      )}
      {status === 'in_progress' && (
        <Ionicons name="chevron-forward" size={18} color={accentColor} />
      )}
    </Pressable>
  );
}
