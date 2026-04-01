// src/components/srs/ConjugationCard.tsx
// Carte SRS pour une forme verbale conjuguée.
// Recto : forme arabe vocalisée + AudioButton
// Verso  : traduction + tense + personne

import { View, Text, TouchableOpacity } from 'react-native';
import ArabicText from '../arabic/ArabicText';
import { AudioButton } from '../AudioButton';
import { useTheme } from '../../contexts/ThemeContext';
import type { SRSCard } from '../../engines/srs';

interface ConjugationCardProps {
  card: SRSCard;
  itemData: { arabic: string; french: string; transliteration?: string };
  showBack: boolean;
  onReveal: () => void;
  onRate: (quality: 0 | 1 | 3 | 5) => void;
}

export function ConjugationCard({ card: _card, itemData, showBack, onReveal, onRate }: ConjugationCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.md,
      ...shadows.medium,
    }}>
      {/* Recto : forme arabe */}
      <View style={{
        backgroundColor: colors.background.group,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
        alignSelf: 'stretch',
      }}>
        <ArabicText size="xlarge" harakatsMode="always">{itemData.arabic}</ArabicText>
        <AudioButton fallbackText={itemData.arabic} fallbackLanguage="ar" size={24} />
      </View>

      {/* Verso : traduction + explication */}
      {showBack ? (
        <>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.h2,
            color: colors.text.primary,
            textAlign: 'center',
          }}>
            {itemData.french}
          </Text>
          {itemData.transliteration && (
            <Text style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.body,
              color: colors.text.secondary,
              textAlign: 'center',
            }}>
              {itemData.transliteration}
            </Text>
          )}
          {/* Boutons SM-2 */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
            <RateButton label="✗ Raté" quality={0} color={colors.status.error} onPress={onRate} />
            <RateButton label="~ Difficile" quality={1} color={colors.accent.gold} onPress={onRate} />
            <RateButton label="✓ Bien" quality={3} color={colors.brand.primary} onPress={onRate} />
            <RateButton label="⚡ Parfait" quality={5} color={colors.brand.dark} onPress={onRate} />
          </View>
        </>
      ) : (
        <TouchableOpacity
          onPress={onReveal}
          style={{
            backgroundColor: colors.brand.primary,
            borderRadius: borderRadius.pill,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.base,
          }}
        >
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.inverse }}>
            Voir la réponse
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function RateButton({ label, quality, color, onPress }: {
  label: string; quality: 0 | 1 | 3 | 5; color: string;
  onPress: (q: 0 | 1 | 3 | 5) => void;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => onPress(quality)}
      style={{
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.pill,
        borderWidth: 1.5,
        borderColor: color,
      }}
    >
      <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
