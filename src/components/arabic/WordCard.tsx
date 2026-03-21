// src/components/arabic/WordCard.tsx

import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows, FontSizes } from '../../constants/theme';
import ArabicText from './ArabicText';
import type { Word } from '../../hooks/useWords';
import type { Root } from '../../hooks/useRoots';

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

  // ── Mode COMPACT ────────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <View style={[styles.card, styles.cardCompact]}>
        <ArabicText size="large" showTransliteration={false}>
          {word.arabic_vocalized}
        </ArabicText>
        {showTransliteration && (
          <Text style={styles.transliteration}>{word.transliteration}</Text>
        )}
        {showTranslation && (
          <Text style={styles.translation}>{word.translation_fr}</Text>
        )}
      </View>
    );
  }

  // ── Mode FULL ───────────────────────────────────────────────
  return (
    <View style={styles.card}>
      {/* Hero : mot vocalisé */}
      <View style={styles.heroContainer}>
        <ArabicText
          size={fontSize}
          transliteration={showTransliteration ? word.transliteration : undefined}
          showTransliteration={showTransliteration}
        >
          {word.arabic_vocalized}
        </ArabicText>
        {showTranslation && (
          <Text style={styles.translationHero}>{word.translation_fr}</Text>
        )}
      </View>

      {/* Section racine (uniquement si la racine est fournie) */}
      {root && (
        <View style={styles.rootBox}>
          <View style={styles.rootRow}>
            <Text style={styles.rootLabel}>Racine :</Text>
            <Text style={styles.rootConsonants}>
              {root.consonants.join('-')}
            </Text>
            <Text style={styles.rootMeaning}>({root.core_meaning_fr})</Text>
          </View>
          {word.pattern && (
            <View style={styles.rootRow}>
              <Text style={styles.rootLabel}>Pattern :</Text>
              <Text style={styles.rootPattern}>{word.pattern}</Text>
            </View>
          )}
          {word.gender && GENDER_LABEL[word.gender] && (
            <View style={styles.rootRow}>
              <Text style={styles.rootLabel}>Genre :</Text>
              <Text style={styles.rootValue}>{GENDER_LABEL[word.gender]}</Text>
            </View>
          )}
        </View>
      )}

      {/* Notes pédagogiques */}
      {word.pedagogy_notes && (
        <Text style={styles.pedagogyNotes}>{word.pedagogy_notes}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E8E2D9',
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.card,
  },
  cardCompact: {
    padding: Spacing.lg,
    minWidth: 110,
    gap: Spacing.xs,
  },

  heroContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  transliteration: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  translation: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  translationHero: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  rootBox: {
    alignSelf: 'stretch',
    backgroundColor: '#F5F3EE',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  rootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  rootLabel: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  rootConsonants: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
    color: '#2A9D8F',
    fontFamily: 'Inter',
  },
  rootMeaning: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  rootPattern: {
    fontSize: FontSizes.caption,
    color: Colors.textPrimary,
    fontStyle: 'italic',
  },
  rootValue: {
    fontSize: FontSizes.caption,
    color: Colors.textPrimary,
  },

  pedagogyNotes: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    alignSelf: 'stretch',
  },
});
