// src/components/arabic/WordCard.tsx

import { View, Text } from 'react-native';
import ArabicText from './ArabicText';
import { AudioButton } from '../AudioButton';
import type { Word } from '../../hooks/useWords';
import type { Root } from '../../hooks/useRoots';
import { useTheme } from '../../contexts/ThemeContext';

interface WordCardProps {
  word: Word;
  root?: Root | null;
  mode: 'compact' | 'full';
  showTransliteration?: boolean;
  showTranslation?: boolean;
  fontSize?: 'medium' | 'large' | 'xlarge';
}

const GENDER_LABEL: Record<string, string> = {
  masculine: 'masculin',
  feminine: 'féminin',
};

export default function WordCard({
  word,
  root,
  mode,
  showTransliteration = true,
  showTranslation = true,
  fontSize = 'xlarge',
}: WordCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const cardBase = {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.subtle,
    alignItems: 'center' as const,
  };

  // ── Mode COMPACT ────────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <View style={[cardBase, { padding: spacing.base, minWidth: 110, gap: spacing.xs }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.micro }}>
          <ArabicText size="large" showTransliteration={false}>
            {word.arabic_vocalized}
          </ArabicText>
          <AudioButton audioUrl={word.audio_url} fallbackText={word.arabic} size={20} />
        </View>
        {showTransliteration && (
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center' }}>
            {word.transliteration}
          </Text>
        )}
        {showTranslation && (
          <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.primary, textAlign: 'center' }}>
            {word.translation_fr}
          </Text>
        )}
      </View>
    );
  }

  // ── Mode FULL ───────────────────────────────────────────────
  return (
    <View style={[cardBase, { padding: spacing.lg }]}>
      {/* Hero : mot vocalisé — dans un carré adouci */}
      <View style={{
        backgroundColor: colors.background.group,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        alignItems: 'center',
        gap: spacing.xs,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.micro }}>
          <ArabicText
            size={fontSize}
            transliteration={showTransliteration ? word.transliteration : undefined}
            showTransliteration={showTransliteration}
          >
            {word.arabic_vocalized}
          </ArabicText>
          <AudioButton audioUrl={word.audio_url} fallbackText={word.arabic} size={24} />
        </View>
        {showTranslation && (
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.primary, textAlign: 'center', marginTop: spacing.xs }}>
            {word.translation_fr}
          </Text>
        )}
      </View>

      {/* Section racine */}
      {root && (
        <View style={{
          alignSelf: 'stretch',
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.md,
          padding: spacing.base,
          marginBottom: spacing.base,
          gap: spacing.xs,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs }}>
            <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.secondary }}>Racine :</Text>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.small, color: colors.brand.primary }}>
              {root.consonants.join('-')}
            </Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, fontStyle: 'italic' }}>
              ({root.core_meaning_fr})
            </Text>
          </View>
          {word.pattern && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.secondary }}>Pattern :</Text>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.primary, fontStyle: 'italic' }}>
                {word.pattern}
              </Text>
            </View>
          )}
          {word.gender && GENDER_LABEL[word.gender] && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.secondary }}>Genre :</Text>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.primary }}>
                {GENDER_LABEL[word.gender]}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Notes pédagogiques */}
      {word.pedagogy_notes && (
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.small,
          color: colors.text.secondary,
          textAlign: 'center',
          lineHeight: typography.size.small * typography.lineHeight.ui,
          alignSelf: 'stretch',
        }}>
          {word.pedagogy_notes}
        </Text>
      )}
    </View>
  );
}
