// src/components/srs/QuranSRSCard.tsx
// Carte SRS pour un mot coranique.
// Recto : mot arabe vocalisé + audio lent
// Verso  : traduction + contexte sourate + note tajwid si disponible

import { View, Text, TouchableOpacity } from 'react-native';
import ArabicText from '../arabic/ArabicText';
import { AudioButton } from '../AudioButton';
import { useTheme } from '../../contexts/ThemeContext';
import type { SRSCard } from '../../engines/srs';

interface RateButtonProps {
  label: string;
  quality: 0 | 1 | 3 | 5;
  color: string;
  onPress: (q: 0 | 1 | 3 | 5) => void;
}

function RateButton({ label, quality, color, onPress }: RateButtonProps) {
  const { typography, spacing, borderRadius } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => onPress(quality)}
      style={{
        backgroundColor: color + '22',
        borderWidth: 1.5,
        borderColor: color,
        borderRadius: borderRadius.pill,
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
      }}
    >
      <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface QuranSRSCardProps {
  card: SRSCard;
  itemData: {
    arabic: string;
    translation: string;
    surahContext: string;
    tajwidNotes?: string | null;
  };
  showBack: boolean;
  onReveal: () => void;
  onRate: (quality: 0 | 1 | 3 | 5) => void;
}

export function QuranSRSCard({ card: _card, itemData, showBack, onReveal, onRate }: QuranSRSCardProps) {
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
      {/* Badge coranique */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        backgroundColor: '#FFF8E7',
        borderRadius: borderRadius.pill,
      }}>
        <Text style={{ fontSize: 14 }}>📖</Text>
        <Text style={{
          fontFamily: typography.family.uiMedium,
          fontSize: typography.size.small,
          color: '#B8860B',
        }}>
          {itemData.surahContext}
        </Text>
      </View>

      {/* Recto : mot arabe */}
      <View style={{
        backgroundColor: colors.background.group,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        gap: spacing.sm,
        alignSelf: 'stretch',
      }}>
        <ArabicText size="xlarge" harakatsMode="always">{itemData.arabic}</ArabicText>
        <AudioButton
          audioUrl={null}
          fallbackText={itemData.arabic}
          fallbackLanguage="ar"
          size={26}
          color={colors.brand.primary}
        />
      </View>

      {/* Verso */}
      {showBack ? (
        <>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.h2,
            color: colors.text.primary,
            textAlign: 'center',
          }}>
            {itemData.translation}
          </Text>

          {/* Note tajwid si disponible */}
          {itemData.tajwidNotes ? (
            <View style={{
              backgroundColor: '#FFF8E7',
              borderRadius: borderRadius.sm,
              borderLeftWidth: 3,
              borderLeftColor: '#D4AF37',
              padding: spacing.sm,
              alignSelf: 'stretch',
            }}>
              <Text style={{
                fontFamily: typography.family.ui,
                fontSize: typography.size.small,
                color: '#8B6914',
              }}>
                📝 {itemData.tajwidNotes}
              </Text>
            </View>
          ) : null}

          {/* Boutons SM-2 */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
            <RateButton label="✗ Raté"     quality={0} color={colors.status.error}    onPress={onRate} />
            <RateButton label="~ Difficile" quality={1} color={colors.accent.gold}     onPress={onRate} />
            <RateButton label="✓ Bien"      quality={3} color={colors.brand.primary}   onPress={onRate} />
            <RateButton label="⚡ Parfait"  quality={5} color={colors.brand.dark}      onPress={onRate} />
          </View>
        </>
      ) : (
        <TouchableOpacity
          onPress={onReveal}
          style={{
            backgroundColor: '#D4AF37',
            borderRadius: borderRadius.pill,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.base,
          }}
        >
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: '#FFFFFF' }}>
            Voir la traduction
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
