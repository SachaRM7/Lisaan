// src/components/arabic/SyllableDisplay.tsx

import { View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
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

// ── Mode compare_diacritics — Matrice phonétique compacte ───

function CompareDiacriticsView({
  diacritics,
  baseLetters,
  onSyllableTap,
}: {
  diacritics: Diacritic[];
  baseLetters: string[];
  showTransliteration?: boolean;
  onSyllableTap?: (syllable: string, diacriticId: string) => void;
}) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const letters = (baseLetters.length > 0 ? baseLetters : ['ب', 'ت', 'س', 'ن']).slice(0, 4);
  const [flashedCell, setFlashedCell] = useState<string | null>(null);

  function handleCellPress(syllable: string, diacriticId: string, cellKey: string) {
    setFlashedCell(cellKey);
    setTimeout(() => setFlashedCell(null), 400);
    onSyllableTap?.(syllable, diacriticId);
  }

  const arabicLH28 = Math.round(28 * 1.9);
  const HEADER_W = 60;
  const SEP = 1;

  return (
    <View style={{
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.background.group,
      overflow: 'hidden',
      ...shadows.subtle,
    }}>
      {/* En-tête : lettres de base (colonnes) */}
      <View style={{ flexDirection: 'row', borderBottomWidth: SEP, borderBottomColor: colors.background.group }}>
        {/* Coin vide en haut à gauche */}
        <View style={{ width: HEADER_W, borderRightWidth: SEP, borderRightColor: colors.background.group }} />
        {letters.map((letter, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: spacing.xs,
              borderRightWidth: i < letters.length - 1 ? SEP : 0,
              borderRightColor: colors.background.group,
            }}
          >
            <Text style={{
              fontFamily: typography.family.arabic,
              fontSize: 28,
              lineHeight: arabicLH28,
              color: colors.text.heroArabic,
              textAlign: 'center',
            }}>
              {letter}
            </Text>
          </View>
        ))}
      </View>

      {/* Lignes : diacritique × lettres */}
      {diacritics.map((diacritic, rowIdx) => (
        <View
          key={diacritic.id}
          style={{
            flexDirection: 'row',
            borderTopWidth: rowIdx === 0 ? 0 : SEP,
            borderTopColor: colors.background.group,
          }}
        >
          {/* En-tête de ligne : nom du diacritique */}
          <View style={{
            width: HEADER_W,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.xs,
            backgroundColor: colors.brand.light + '4D', // 30% opacity
            borderRightWidth: SEP,
            borderRightColor: colors.background.group,
          }}>
            <Text style={{
              fontFamily: typography.family.uiMedium,
              fontSize: typography.size.tiny,
              color: colors.text.secondary,
              textAlign: 'center',
            }}>
              {diacritic.name_fr}
            </Text>
          </View>

          {/* Cellules */}
          {letters.map((baseLetter, colIdx) => {
            const syllable =
              diacritic.example_letters.find((ex) => ex.startsWith(baseLetter)) ??
              `${baseLetter}${diacritic.symbol}`;
            const translit = `${baseLetter[0]?.toLowerCase() ?? ''}${diacritic.transliteration ?? ''}`;
            const cellKey = `${diacritic.id}-${colIdx}`;
            const isFlashed = flashedCell === cellKey;

            return (
              <Pressable
                key={colIdx}
                onPress={() => handleCellPress(syllable, diacritic.id, cellKey)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.sm,
                  gap: 2,
                  backgroundColor: isFlashed ? colors.brand.light : 'transparent',
                  borderLeftWidth: colIdx === 0 ? 0 : SEP,
                  borderLeftColor: colors.background.group,
                }}
              >
                <Text style={{
                  fontFamily: typography.family.arabic,
                  fontSize: 28,
                  lineHeight: arabicLH28,
                  color: colors.text.heroArabic,
                  textAlign: 'center',
                }}>
                  {syllable}
                </Text>
                <Text style={{
                  fontFamily: typography.family.ui,
                  fontSize: typography.size.tiny,
                  color: colors.text.secondary,
                  textAlign: 'center',
                }}>
                  {translit}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
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

