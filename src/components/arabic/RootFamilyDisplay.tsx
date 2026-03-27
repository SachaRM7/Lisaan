// src/components/arabic/RootFamilyDisplay.tsx

import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import ArabicText from './ArabicText';
import type { Root } from '../../hooks/useRoots';
import type { Word } from '../../hooks/useWords';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const arabicLineHeight = Math.round(48 * 1.9);

  return (
    <View style={{
      backgroundColor: colors.background.group,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...shadows.subtle,
    }}>
      {/* En-tête : consonnes de la racine */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg, gap: spacing.xs }}>
        <Text style={{
          fontFamily: typography.family.arabic,
          fontSize: typography.size.arabicHero,
          lineHeight: arabicLineHeight,
          color: colors.brand.primary,
          textAlign: 'center',
        }}>
          {root.consonants.join(' - ')}
        </Text>
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.body,
          color: colors.text.secondary,
          fontStyle: 'italic',
          textAlign: 'center',
        }}>
          {root.core_meaning_fr}
        </Text>
      </View>

      {/* Grille 2 colonnes des mots dérivés */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
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
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, delay: index * 100, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={[{ width: '47%' }, { opacity, transform: [{ translateY }] }]}>
      <Pressable
        style={[
          {
            backgroundColor: highlighted ? colors.accent.gold + '20' : colors.background.card,
            borderRadius: borderRadius.md,
            borderWidth: highlighted ? 2 : 1,
            borderColor: highlighted ? colors.accent.gold : colors.border.subtle,
            padding: spacing.sm,
            alignItems: 'center',
            gap: spacing.xs,
            ...shadows.subtle,
          },
        ]}
        onPress={() => onTap?.(word)}
      >
        <ArabicText size="medium" showTransliteration={false}>
          {word.arabic_vocalized}
        </ArabicText>
        {showTranslation && (
          <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.primary, textAlign: 'center' }} numberOfLines={1}>
            {word.translation_fr}
          </Text>
        )}
        {word.pattern && (
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, fontStyle: 'italic', textAlign: 'center' }}>
            {word.pattern}
          </Text>
        )}
        {showTransliteration && (
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center' }}>
            {word.transliteration}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
