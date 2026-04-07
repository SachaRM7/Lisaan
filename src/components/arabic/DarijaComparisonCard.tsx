// src/components/arabic/DarijaComparisonCard.tsx

import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import ArabicText from './ArabicText';
import { AudioButton } from '../AudioButton';
import { DialectBadge } from './DialectBadge';
import type { Word } from '../../hooks/useWords';
import type { WordVariant } from '../../types/index';

interface DarijaComparisonCardProps {
  word: Word;
  darija: WordVariant;
}

export function DarijaComparisonCard({ word, darija }: DarijaComparisonCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const cardStyle = {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.subtle,
    padding: spacing.base,
  };

  const colStyle = {
    flex: 1,
    alignItems: 'center' as const,
    gap: spacing.xs,
  };

  const arrowStyle = {
    fontFamily: typography.family.ui,
    fontSize: 20,
    color: colors.text.secondary,
    paddingHorizontal: spacing.sm,
    alignSelf: 'center' as const,
  };

  const labelStyle = {
    fontFamily: typography.family.ui,
    fontSize: typography.size.small,
    color: colors.text.secondary,
  };

  const transStyle = {
    fontFamily: typography.family.ui,
    fontSize: typography.size.small,
    color: colors.text.secondary,
  };

  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        {/* Colonne MSA */}
        <View style={colStyle}>
          <Text style={labelStyle}>MSA</Text>
          <ArabicText size="large" showTransliteration={false}>
            {word.arabic_vocalized}
          </ArabicText>
          <Text style={transStyle}>{word.transliteration}</Text>
          <Text style={transStyle}>{word.translation_fr}</Text>
          {word.audio_url ? (
            <AudioButton audioUrl={word.audio_url} fallbackText={word.arabic_vocalized} fallbackLanguage="ar" size={20} />
          ) : null}
        </View>

        {/* Flèche centrale */}
        <Text style={arrowStyle}>→</Text>

        {/* Colonne Darija */}
        <View style={colStyle}>
          <DialectBadge variant="darija" showFull />
          <ArabicText size="large" showTransliteration={false}>
            {darija.arabic_vocalized}
          </ArabicText>
          <Text style={transStyle}>{darija.transliteration}</Text>
          {darija.notes_fr ? (
            <Text style={{ ...transStyle, fontStyle: 'italic', textAlign: 'center' }}>
              {darija.notes_fr}
            </Text>
          ) : null}
          {darija.audio_url ? (
            <AudioButton audioUrl={darija.audio_url} fallbackText={darija.arabic_vocalized} fallbackLanguage="ar" size={20} />
          ) : null}
        </View>
      </View>
    </View>
  );
}
