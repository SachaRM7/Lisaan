// src/components/arabic/SentenceCard.tsx

import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows, FontSizes } from '../../constants/theme';
import ArabicText from './ArabicText';
import { AudioButton } from '../AudioButton';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { Sentence } from '../../hooks/useSentences';

interface SentenceCardProps {
  sentence: Sentence;
  mode: 'compact' | 'full';
  showTransliteration?: boolean;
  showTranslation?: boolean;
  highlightWordIds?: string[];
  onTap?: () => void;
}

const BLANK_PLACEHOLDER = '_____';
const BLANK_COLOR = '#F4A261';

export default function SentenceCard({
  sentence,
  mode,
  showTransliteration,
  showTranslation,
  highlightWordIds,
  onTap,
}: SentenceCardProps) {
  const settings = useSettingsStore();

  const shouldShowTranslit = showTransliteration !== undefined
    ? showTransliteration
    : settings.transliteration_mode !== 'never';

  const shouldShowTranslation = showTranslation !== undefined
    ? showTranslation
    : settings.translation_mode !== 'never';

  // En mode compact avec highlightWordIds, on remplace les mots ciblés par _____
  const arabicDisplay = buildArabicDisplay(
    sentence.arabic_vocalized,
    sentence.word_ids,
    highlightWordIds ?? [],
    mode === 'compact',
  );

  const card = (
    <View style={[styles.card, mode === 'compact' && styles.cardCompact]}>
      {/* Texte arabe + bouton audio */}
      {mode === 'full' ? (
        <View style={styles.sentenceRow}>
          <AudioButton
            audioUrl={sentence.audio_url}
            fallbackText={sentence.arabic}
            size={22}
            style={styles.audioBtn}
          />
          <ArabicText
            size="large"
            showTransliteration={false}
            showTranslation={false}
          >
            {sentence.arabic_vocalized}
          </ArabicText>
        </View>
      ) : (
        <CompactArabicRow parts={arabicDisplay} />
      )}

      {/* Translittération (mode full uniquement) */}
      {mode === 'full' && shouldShowTranslit && (
        <Text style={styles.transliteration}>{sentence.transliteration}</Text>
      )}

      {/* Traduction */}
      {shouldShowTranslation && (
        <Text style={styles.translation}>{sentence.translation_fr}</Text>
      )}

      {/* Contexte (mode full uniquement) */}
      {mode === 'full' && sentence.context && (
        <Text style={styles.context}>{sentence.context}</Text>
      )}
    </View>
  );

  if (onTap) {
    return (
      <Pressable onPress={onTap} style={styles.pressable}>
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

  // On découpe la phrase en mots et on remplace les mots ciblés
  const words = arabicVocalized.split(' ');
  return words.map((word, i) => {
    const wordId = wordIds[i];
    const isBlank = wordId ? highlightWordIds.includes(wordId) : false;
    return { text: isBlank ? BLANK_PLACEHOLDER : word, isBlank };
  });
}

function CompactArabicRow({ parts }: { parts: ArabicPart[] }) {
  return (
    <View style={styles.arabicRow}>
      {parts.map((part, i) => (
        <Text
          key={i}
          style={[
            styles.arabicWord,
            part.isBlank && styles.arabicBlank,
          ]}
        >
          {part.text}
        </Text>
      ))}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  cardCompact: {
    padding: Spacing.lg,
  },

  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  audioBtn: {
    marginRight: Spacing.xs,
  },
  arabicRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
    writingDirection: 'rtl',
  } as any,
  arabicWord: {
    fontFamily: 'Amiri',
    fontSize: 32,
    lineHeight: 64,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  arabicBlank: {
    color: BLANK_COLOR,
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
  },

  transliteration: {
    fontFamily: 'Inter',
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  translation: {
    fontFamily: 'Inter',
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  context: {
    fontFamily: 'Inter',
    fontSize: FontSizes.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
});
