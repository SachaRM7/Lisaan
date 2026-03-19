// src/components/arabic/SyllableDisplay.tsx

import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors, Spacing, Radius, FontSizes } from '../../constants/theme';
import ArabicText from './ArabicText';
import type { Diacritic } from '../../hooks/useDiacritics';

interface SyllableDisplayProps {
  mode: 'single_diacritic' | 'compare_diacritics';
  diacritics: Diacritic[];
  /** Syllabes à afficher (mode single) ou lettres de base (mode compare) */
  letterForms: string[];
  transliterations?: string[];
  showTransliteration?: boolean;
  onSyllableTap?: (syllable: string, diacriticId: string) => void;
}

export default function SyllableDisplay({
  mode,
  diacritics,
  letterForms,
  transliterations,
  showTransliteration,
  onSyllableTap,
}: SyllableDisplayProps) {
  if (mode === 'single_diacritic') {
    return (
      <SingleDiacriticView
        diacritic={diacritics[0]}
        letterForms={letterForms}
        transliterations={transliterations}
        showTransliteration={showTransliteration}
        onSyllableTap={onSyllableTap}
      />
    );
  }

  return (
    <CompareDiacriticsView
      diacritics={diacritics}
      baseLetters={letterForms}
      showTransliteration={showTransliteration}
      onSyllableTap={onSyllableTap}
    />
  );
}

// ── Mode single_diacritic ───────────────────────────────────

function SingleDiacriticView({
  diacritic,
  letterForms,
  transliterations,
  showTransliteration,
  onSyllableTap,
}: {
  diacritic: Diacritic | undefined;
  letterForms: string[];
  transliterations?: string[];
  showTransliteration?: boolean;
  onSyllableTap?: (syllable: string, diacriticId: string) => void;
}) {
  if (!diacritic) return null;

  const syllables = letterForms.length > 0 ? letterForms : diacritic.example_letters;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {diacritic.name_fr}
        {diacritic.transliteration ? ` (son "${diacritic.transliteration}")` : ''}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.syllablesRow}
      >
        {syllables.map((syllable, index) => (
          <AnimatedSyllable
            key={`${diacritic.id}-${index}`}
            index={index}
            syllable={syllable}
            transliteration={transliterations?.[index]}
            showTransliteration={showTransliteration}
            onTap={onSyllableTap ? () => onSyllableTap(syllable, diacritic.id) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ── Mode compare_diacritics ─────────────────────────────────

function CompareDiacriticsView({
  diacritics,
  baseLetters,
  showTransliteration,
  onSyllableTap,
}: {
  diacritics: Diacritic[];
  baseLetters: string[];
  showTransliteration?: boolean;
  onSyllableTap?: (syllable: string, diacriticId: string) => void;
}) {
  const letters = baseLetters.length > 0 ? baseLetters : ['ب', 'ت', 'س', 'ن'];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* En-tête : lettres de base */}
          <View style={styles.compareHeader}>
            <View style={styles.compareLabel} />
            {letters.map((letter, i) => (
              <View key={i} style={styles.compareHeaderCell}>
                <ArabicText size="medium" showTransliteration={false}>
                  {letter}
                </ArabicText>
              </View>
            ))}
          </View>

          {/* Séparateur */}
          <View style={styles.compareDivider} />

          {/* Lignes : diacritique × lettres */}
          {diacritics.map((diacritic) => (
            <View key={diacritic.id} style={styles.compareRow}>
              {/* Label diacritique */}
              <View style={styles.compareLabel}>
                <Text style={styles.compareLabelText}>{diacritic.name_fr}</Text>
              </View>
              {/* Syllabes */}
              {letters.map((baseLetter, i) => {
                const syllable =
                  diacritic.example_letters.find((ex) => ex.startsWith(baseLetter)) ??
                  `${baseLetter}${diacritic.symbol}`;
                return (
                  <Pressable
                    key={i}
                    style={styles.compareCell}
                    onPress={onSyllableTap ? () => onSyllableTap(syllable, diacritic.id) : undefined}
                  >
                    <ArabicText size="large" showTransliteration={false}>
                      {syllable}
                    </ArabicText>
                    {showTransliteration && diacritic.transliteration ? (
                      <Text style={styles.compareTranslit}>
                        {baseLetter[0]?.toLowerCase()}{diacritic.transliteration}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Syllabe animée ──────────────────────────────────────────

function AnimatedSyllable({
  index,
  syllable,
  transliteration,
  showTransliteration,
  onTap,
}: {
  index: number;
  syllable: string;
  transliteration?: string;
  showTransliteration?: boolean;
  onTap?: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        style={styles.syllableCell}
        onPress={onTap}
      >
        <ArabicText size="large" showTransliteration={false}>
          {syllable}
        </ArabicText>
        {showTransliteration !== false && transliteration ? (
          <Text style={styles.syllableTranslit}>{transliteration}</Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: '#2A9D8F',
    fontFamily: 'Inter',
  },
  syllablesRow: {
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  syllableCell: {
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    minWidth: 64,
    gap: 4,
  },
  syllableTranslit: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontFamily: 'Inter',
    textAlign: 'center',
  },

  // Compare mode
  compareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compareHeaderCell: {
    width: 72,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  compareDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  compareLabel: {
    width: 80,
    justifyContent: 'center',
    paddingRight: Spacing.sm,
  },
  compareLabelText: {
    fontSize: FontSizes.small,
    color: '#2A9D8F',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  compareCell: {
    width: 72,
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    margin: 2,
    gap: 2,
  },
  compareTranslit: {
    fontSize: FontSizes.small - 2,
    color: Colors.textMuted,
    fontFamily: 'Inter',
  },
});
