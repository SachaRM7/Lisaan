// src/components/arabic/SentenceCard.tsx

import { Pressable, Text, View } from 'react-native';
import ArabicText from './ArabicText';
import { AudioButton } from '../AudioButton';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { Sentence } from '../../hooks/useSentences';
import { useTheme } from '../../contexts/ThemeContext';

interface SentenceCardProps {
  sentence: Sentence;
  mode: 'compact' | 'full';
  showTransliteration?: boolean;
  showTranslation?: boolean;
  highlightWordIds?: string[];
  onTap?: () => void;
}

const BLANK_PLACEHOLDER = '_____';

export default function SentenceCard({
  sentence,
  mode,
  showTransliteration,
  showTranslation,
  highlightWordIds,
  onTap,
}: SentenceCardProps) {
  const settings = useSettingsStore();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const shouldShowTranslit = showTransliteration !== undefined
    ? showTransliteration
    : settings.transliteration_mode !== 'never';

  const shouldShowTranslation = showTranslation !== undefined
    ? showTranslation
    : settings.translation_mode !== 'never';

  const arabicDisplay = buildArabicDisplay(
    sentence.arabic_vocalized,
    sentence.word_ids,
    highlightWordIds ?? [],
    mode === 'compact',
  );

  const cardBase = {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    ...shadows.subtle,
    alignItems: 'center' as const,
    gap: spacing.xs,
  };

  const card = (
    <View style={[cardBase, { padding: mode === 'compact' ? spacing.base : spacing.lg }]}>
      {/* Texte arabe + bouton audio */}
      {mode === 'full' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <AudioButton
            audioUrl={sentence.audio_url}
            fallbackText={sentence.arabic}
            size={22}
            style={{ marginRight: spacing.xs }}
          />
          <ArabicText size="large" showTransliteration={false} showTranslation={false}>
            {sentence.arabic_vocalized}
          </ArabicText>
        </View>
      ) : (
        <CompactArabicRow parts={arabicDisplay} />
      )}

      {/* Translittération (mode full) */}
      {mode === 'full' && shouldShowTranslit && (
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center' }}>
          {sentence.transliteration}
        </Text>
      )}

      {/* Traduction */}
      {shouldShowTranslation && (
        <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.primary, textAlign: 'center' }}>
          {sentence.translation_fr}
        </Text>
      )}

      {/* Contexte (mode full) */}
      {mode === 'full' && sentence.context && (
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center', fontStyle: 'italic', marginTop: spacing.xs }}>
          {sentence.context}
        </Text>
      )}
    </View>
  );

  if (onTap) {
    return (
      <Pressable onPress={onTap} style={{ alignSelf: 'stretch' }}>
        {card}
      </Pressable>
    );
  }
  return card;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type ArabicPart = { text: string; isBlank: boolean };

function buildArabicDisplay(
  arabicVocalized: string,
  wordIds: string[],
  highlightWordIds: string[],
  compact: boolean,
): ArabicPart[] {
  if (!compact || highlightWordIds.length === 0) {
    return [{ text: arabicVocalized, isBlank: false }];
  }
  const words = arabicVocalized.split(' ');
  return words.map((word, i) => {
    const wordId = wordIds[i];
    const isBlank = wordId ? highlightWordIds.includes(wordId) : false;
    return { text: isBlank ? BLANK_PLACEHOLDER : word, isBlank };
  });
}

function CompactArabicRow({ parts }: { parts: ArabicPart[] }) {
  const { colors, typography } = useTheme();
  const arabicLineHeight = Math.round(32 * 1.9);
  return (
    <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 4 } as any}>
      {parts.map((part, i) => (
        <Text
          key={i}
          style={[
            {
              fontFamily: typography.family.arabic,
              fontSize: 32,
              lineHeight: arabicLineHeight,
              color: colors.text.heroArabic,
              textAlign: 'right',
            },
            part.isBlank && {
              fontFamily: typography.family.uiBold,
              fontSize: 24,
              lineHeight: 24 * 1.5,
              color: colors.accent.gold,
            },
          ]}
        >
          {part.text}
        </Text>
      ))}
    </View>
  );
}
