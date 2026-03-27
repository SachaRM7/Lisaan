// src/components/NetworkErrorScreen.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui';

interface Props {
  onRetry: () => void;
}

export function NetworkErrorScreen({ onRetry }: Props) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.main, padding: spacing.xl }}>
      <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>📶</Text>
      <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm }}>
        Connexion requise
      </Text>
      <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing.xl }}>
        La première ouverture nécessite une connexion internet pour télécharger les leçons.
      </Text>
      <Button label="Réessayer" variant="primary" onPress={onRetry} style={{ width: '100%' }} />
    </View>
  );
}
