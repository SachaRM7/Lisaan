// src/components/arabic/SyllableDisplay.tsx

import { View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import ArabicText from './ArabicText';
import type { Diacritic } from '../../hooks/useDiacritics';
import { useTheme } from '../../contexts/ThemeContext';

interface SyllableDisplayProps {
  mode: 'single_diacritic' | 'compare_diacritics';
  diacritics: Diacritic[];
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
  const { colors, typography, spacing } = useTheme();
  if (!diacritic) return null;

  const syllables = letterForms.length > 0 ? letterForms : diacritic.example_letters;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{
        fontFamily: typography.family.uiMedium,
        fontSize: typography.size.small,
        color: colors.brand.primary,
      }}>
        {diacritic.name_fr}
        {diacritic.transliteration ? ` (son "${diacritic.transliteration}")` : ''}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
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
  const { colors, typography, spacing, borderRadius } = useTheme();
  const letters = baseLetters.length > 0 ? baseLetters : ['ب', 'ت', 'س', 'ن'];

  return (
    <View style={{ gap: spacing.sm }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* En-tête : lettres de base */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 80 }} />
            {letters.map((letter, i) => (
              <View key={i} style={{ width: 72, alignItems: 'center', padding: spacing.xs }}>
                <ArabicText size="medium" showTransliteration={false}>
                  {letter}
                </ArabicText>
              </View>
            ))}
          </View>

          {/* Séparateur */}
          <View style={{ height: 1, backgroundColor: colors.border.medium, marginVertical: spacing.xs }} />

          {/* Lignes : diacritique × lettres */}
          {diacritics.map((diacritic) => (
            <View key={diacritic.id} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
              {/* Label diacritique */}
              <View style={{ width: 80, justifyContent: 'center', paddingRight: spacing.xs }}>
                <Text style={{
                  fontFamily: typography.family.uiMedium,
                  fontSize: typography.size.small,
                  color: colors.brand.primary,
                }}>
                  {diacritic.name_fr}
                </Text>
              </View>
              {/* Syllabes */}
              {letters.map((baseLetter, i) => {
                const syllable =
                  diacritic.example_letters.find((ex) => ex.startsWith(baseLetter)) ??
                  `${baseLetter}${diacritic.symbol}`;
                return (
                  <Pressable
                    key={i}
                    style={{
                      width: 72,
                      alignItems: 'center',
                      backgroundColor: colors.background.group,
                      borderRadius: borderRadius.sm,
                      padding: spacing.xs,
                      margin: 2,
                      gap: 2,
                    }}
                    onPress={onSyllableTap ? () => onSyllableTap(syllable, diacritic.id) : undefined}
                  >
                    <ArabicText size="large" showTransliteration={false}>
                      {syllable}
                    </ArabicText>
                    {showTransliteration && diacritic.transliteration ? (
                      <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny - 2, color: colors.text.secondary }}>
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
  const { colors, typography, spacing, borderRadius } = useTheme();
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
        style={{
          alignItems: 'center',
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.sm,
          padding: spacing.sm,
          minWidth: 64,
          gap: 4,
        }}
        onPress={onTap}
      >
        <ArabicText size="large" showTransliteration={false}>
          {syllable}
        </ArabicText>
        {showTransliteration !== false && transliteration ? (
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.small,
            color: colors.text.secondary,
            textAlign: 'center',
          }}>
            {transliteration}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

