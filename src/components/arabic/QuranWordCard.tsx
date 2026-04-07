// src/components/arabic/QuranWordCard.tsx

import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import ArabicText from './ArabicText';
import { AudioButton } from '../AudioButton';
import type { QuranEntry } from '../../hooks/useQuranEntries';

interface QuranWordCardProps {
  entry: QuranEntry;
  showTajwidNotes?: boolean;
}

export function QuranWordCard({ entry, showTajwidNotes = true }: QuranWordCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const cardStyle = {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.subtle,
    padding: spacing.lg,
    alignItems: 'center' as const,
    gap: spacing.sm,
  };

  const metaStyle = {
    fontFamily: typography.family.ui,
    fontSize: typography.size.small,
    color: colors.text.secondary,
  };

  const transStyle = {
    fontFamily: typography.family.ui,
    fontSize: typography.size.body,
    color: colors.text.secondary,
    textAlign: 'center' as const,
  };

  const translationStyle = {
    fontFamily: typography.family.uiMedium,
    fontSize: typography.size.body,
    color: colors.text.primary,
    textAlign: 'center' as const,
  };

  return (
    <View style={cardStyle}>
      {/* Métadonnées sourate/verset */}
      <Text style={metaStyle}>
        📖 {entry.surah_name_fr} · V.{entry.ayah_number} · Mot {entry.word_position}
      </Text>

      {/* Mot arabe */}
      <ArabicText size="xlarge" showTransliteration={false}>
        {entry.arabic_vocalized}
      </ArabicText>

      {/* Bouton audio — utilise TTS lent via fallback */}
      <AudioButton
        audioUrl={null}
        fallbackText={entry.arabic_vocalized}
        fallbackLanguage="ar"
        size={22}
        color={colors.brand.primary}
      />

      {/* Translittération */}
      <Text style={transStyle}>{entry.transliteration}</Text>

      {/* Traduction */}
      <Text style={translationStyle}>"{entry.translation_fr}"</Text>

      {/* Note tajwid */}
      {showTajwidNotes && entry.tajwid_notes ? (
        <View style={{
          backgroundColor: '#FFF8E7',
          borderRadius: borderRadius.sm,
          borderLeftWidth: 3,
          borderLeftColor: '#D4AF37',
          padding: spacing.sm,
          width: '100%',
          gap: spacing.xs,
        }}>
          <Text style={{
            fontFamily: typography.family.uiMedium,
            fontSize: typography.size.small,
            color: '#B8860B',
          }}>
            📝 Tajwid
          </Text>
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.small,
            color: colors.text.secondary,
          }}>
            {entry.tajwid_notes}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
