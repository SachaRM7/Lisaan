// src/components/arabic/RootFamilyDisplay.tsx

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Colors, Spacing, Radius, Shadows, FontSizes } from '../../constants/theme';
import ArabicText from './ArabicText';
import type { Root } from '../../hooks/useRoots';
import type { Word } from '../../hooks/useWords';

interface RootFamilyDisplayProps {
  root: Root;
  words: Word[];
  showTransliteration?: boolean;
  showTranslation?: boolean;
  highlightWordId?: string;
  onWordTap?: (word: Word) => void;
}

export default function RootFamilyDisplay({
  root,
  words,
  showTransliteration = true,
  showTranslation = true,
  highlightWordId,
  onWordTap,
}: RootFamilyDisplayProps) {
  return (
    <View style={styles.container}>
      {/* En-tête : consonnes de la racine */}
      <View style={styles.header}>
        <Text style={styles.consonants}>
          {root.consonants.join(' - ')}
        </Text>
        <Text style={styles.meaning}>{root.core_meaning_fr}</Text>
      </View>

      {/* Grille 2 colonnes des mots dérivés */}
      <View style={styles.grid}>
        {words.map((word, index) => (
          <WordCell
            key={word.id}
            word={word}
            index={index}
            highlighted={word.id === highlightWordId}
            showTransliteration={showTransliteration}
            showTranslation={showTranslation}
            onTap={onWordTap}
          />
        ))}
      </View>
    </View>
  );
}

// ── Cellule de mot animée ────────────────────────────────────

function WordCell({
  word,
  index,
  highlighted,
  showTransliteration,
  showTranslation,
  onTap,
}: {
  word: Word;
  index: number;
  highlighted: boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
  onTap?: (word: Word) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={[styles.cellWrapper, { opacity, transform: [{ translateY }] }]}>
      <Pressable
        style={[styles.cell, highlighted && styles.cellHighlighted]}
        onPress={() => onTap?.(word)}
      >
        <ArabicText size="medium" showTransliteration={false}>
          {word.arabic_vocalized}
        </ArabicText>
        {showTranslation && (
          <Text style={styles.cellTranslation} numberOfLines={1}>
            {word.translation_fr}
          </Text>
        )}
        {word.pattern && (
          <Text style={styles.cellPattern}>{word.pattern}</Text>
        )}
        {showTransliteration && (
          <Text style={styles.cellTranslit}>{word.transliteration}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAF5',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E8E2D9',
    padding: Spacing['2xl'],
    ...Shadows.card,
  },

  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  consonants: {
    fontSize: FontSizes.arabicLG,
    fontFamily: 'Amiri',
    color: '#2A9D8F',
    textAlign: 'center',
    lineHeight: FontSizes.arabicLG * 1.4,
  },
  meaning: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    fontFamily: 'Inter',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  cellWrapper: {
    width: '47%',
  },
  cell: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E8E2D9',
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.card,
  },
  cellHighlighted: {
    borderColor: '#D4A843',
    backgroundColor: '#FFF8E1',
  },
  cellTranslation: {
    fontSize: FontSizes.small,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  cellPattern: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  cellTranslit: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});
