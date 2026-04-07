// src/components/today/TodayHeader.tsx
// Header + greeting de l'écran "Aujourd'hui"

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';

interface TodayHeaderProps {
  streak: number;
}

export function TodayHeader({ streak }: TodayHeaderProps) {
  const { colors, typography, spacing } = useTheme();
  const displayName = useAuthStore((s) => s.displayName);

  const greeting = displayName
    ? `Salam, ${displayName} 👋`
    : 'Salam 👋';

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    }}>
      <View>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.h1,
          color: colors.text.primary,
        }}>
          Lisaan
        </Text>
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.body,
          color: colors.text.secondary,
          marginTop: spacing.micro,
        }}>
          {greeting}
        </Text>
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.small,
          color: colors.text.secondary,
        }}>
          Prêt pour ta session ?
        </Text>
      </View>

      {/* Streak */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.background.card,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: spacing.sm,
      }}>
        <Text style={{ fontSize: 18 }}>🔥</Text>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.body,
          color: colors.accent.gold,
        }}>
          {streak}
        </Text>
      </View>
    </View>
  );
}
