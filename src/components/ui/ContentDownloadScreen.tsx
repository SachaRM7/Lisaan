// src/components/ui/ContentDownloadScreen.tsx

import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export function ContentDownloadScreen() {
  const { colors, typography, spacing } = useTheme();
  const arabicLH = Math.round(64 * 1.9);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.main, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
      <Text style={{ fontFamily: typography.family.arabicBold, fontSize: 64, lineHeight: arabicLH, color: colors.brand.primary, marginBottom: spacing.xl }}>
        لسان
      </Text>
      <ActivityIndicator size="large" color={colors.brand.primary} style={{ marginBottom: spacing.lg }} />
      <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.h2, color: colors.text.primary, marginBottom: spacing.xs, textAlign: 'center' }}>
        Préparation du contenu...
      </Text>
      <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center' }}>
        Première utilisation — nécessite une connexion
      </Text>
    </View>
  );
}
