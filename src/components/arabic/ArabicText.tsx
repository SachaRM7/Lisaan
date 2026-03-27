// src/components/arabic/ArabicText.tsx
import { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTheme } from '../../contexts/ThemeContext';

// Tailles arabes selon l'échelle du Design System (lineHeight ratio 1.9 minimum)
const SIZES = {
  small:  { arabic: 22, sub: 12, lineHeight: Math.round(22 * 1.9) },  // arabicSmall
  medium: { arabic: 28, sub: 14, lineHeight: Math.round(28 * 1.9) },  // arabicBody
  large:  { arabic: 36, sub: 16, lineHeight: Math.round(36 * 1.9) },  // arabicTitle
  xlarge: { arabic: 48, sub: 18, lineHeight: Math.round(48 * 1.9) },  // arabicHero
} as const;

interface ArabicTextProps {
  /** Texte arabe avec harakats (ex: كِتَاب) */
  children: string;
  /** Texte sans harakats — si fourni, utilisé quand harakats masqués */
  withoutHarakats?: string;
  /** Translittération latine (ex: kitāb) */
  transliteration?: string;
  /** Traduction française */
  translation?: string;
  /**
   * Mode d'affichage des harakats.
   * Si non passé → lu depuis useSettingsStore.harakats_mode
   */
  harakatsMode?: 'always' | 'adaptive' | 'never' | 'tap_reveal';
  /**
   * Afficher la translittération.
   * Si non passé → déterminé par useSettingsStore.transliteration_mode
   */
  showTransliteration?: boolean;
  /**
   * Afficher la traduction.
   * Si non passé → déterminé par useSettingsStore.translation_mode
   */
  showTranslation?: boolean;
  /**
   * Taille du texte arabe.
   * Si non passé → lu depuis useSettingsStore.font_size
   */
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  /** Style additionnel */
  style?: StyleProp<ViewStyle>;
}

// Strip harakats (diacritics) from Arabic text
const HARAKAT_REGEX = /[\u064B-\u065F\u0670]/g;
function stripHarakats(text: string): string {
  return text.replace(HARAKAT_REGEX, '');
}

export default function ArabicText({
  children,
  withoutHarakats,
  transliteration,
  translation,
  harakatsMode,
  showTransliteration,
  showTranslation,
  size,
  style,
}: ArabicTextProps) {
  const globalSettings = useSettingsStore();
  const { colors, typography } = useTheme();

  // ─── Priorité : prop explicite > réglage global ───────────
  const effectiveHarakatsMode = harakatsMode ?? globalSettings.harakats_mode;
  const effectiveSize = size ?? globalSettings.font_size;

  const translitMode = showTransliteration !== undefined
    ? (showTransliteration ? 'always' : 'never')
    : globalSettings.transliteration_mode;

  const translationMode = showTranslation !== undefined
    ? (showTranslation ? 'always' : 'never')
    : globalSettings.translation_mode;

  // ─── État tap_reveal ──────────────────────────────────────
  const [harakatsRevealed, setHarakatsRevealed] = useState(false);
  const [translitRevealed, setTranslitRevealed] = useState(false);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const harakatsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const s = SIZES[effectiveSize];

  // ─── Texte arabe (avec/sans harakats) ─────────────────────
  const bareText = withoutHarakats ?? stripHarakats(children);

  let displayText: string;
  switch (effectiveHarakatsMode) {
    case 'always':
    case 'adaptive':
      displayText = children;
      break;
    case 'never':
      displayText = bareText;
      break;
    case 'tap_reveal':
      displayText = harakatsRevealed ? children : bareText;
      break;
    default:
      displayText = children;
  }

  function handleHarakatsTap() {
    if (effectiveHarakatsMode !== 'tap_reveal') return;
    if (harakatsTimer.current) clearTimeout(harakatsTimer.current);
    setHarakatsRevealed(true);
    harakatsTimer.current = setTimeout(() => setHarakatsRevealed(false), 2000);
  }

  function handleTranslitTap() {
    if (translitMode !== 'tap_reveal') return;
    if (translitTimer.current) clearTimeout(translitTimer.current);
    setTranslitRevealed(true);
    translitTimer.current = setTimeout(() => setTranslitRevealed(false), 2000);
  }

  function handleTranslationTap() {
    if (translationMode !== 'tap_reveal') return;
    if (translationTimer.current) clearTimeout(translationTimer.current);
    setTranslationRevealed(true);
    translationTimer.current = setTimeout(() => setTranslationRevealed(false), 2000);
  }

  // ─── Rendu texte arabe ─────────────────────────────────────
  const arabicText = (
    <Text
      style={[
        styles.arabic,
        {
          fontFamily: typography.family.arabic,
          fontSize: s.arabic,
          lineHeight: s.lineHeight,
          color: colors.text.heroArabic,
        },
      ]}
      accessibilityLabel={transliteration ?? stripHarakats(children)}
      accessibilityLanguage="ar"
      accessible={true}
    >
      {displayText}
    </Text>
  );

  // ─── Rendu translittération ────────────────────────────────
  let translitElement: React.ReactNode = null;
  if (transliteration && translitMode !== 'never') {
    const translitStyle = {
      fontFamily: typography.family.ui,
      fontSize: s.sub,
      color: colors.text.secondary,
    };
    if (translitMode === 'tap_reveal') {
      translitElement = (
        <Pressable onPress={handleTranslitTap}>
          <Text style={[styles.transliteration, translitStyle]}>
            {translitRevealed ? transliteration : '• • • •'}
          </Text>
        </Pressable>
      );
    } else {
      translitElement = (
        <Text style={[styles.transliteration, translitStyle]}>
          {transliteration}
        </Text>
      );
    }
  }

  // ─── Rendu traduction ──────────────────────────────────────
  let translationElement: React.ReactNode = null;
  if (translation && translationMode !== 'never') {
    const translationStyle = {
      fontFamily: typography.family.ui,
      fontSize: s.sub,
      color: colors.text.secondary,
    };
    if (translationMode === 'tap_reveal') {
      translationElement = (
        <Pressable onPress={handleTranslationTap}>
          <Text style={[styles.translation, translationStyle]}>
            {translationRevealed ? translation : '• • •'}
          </Text>
        </Pressable>
      );
    } else {
      translationElement = (
        <Text style={[styles.translation, translationStyle]}>
          {translation}
        </Text>
      );
    }
  }

  return (
    <View style={[styles.container, style]}>
      {effectiveHarakatsMode === 'tap_reveal' ? (
        <Pressable onPress={handleHarakatsTap} style={styles.pressable}>
          {arabicText}
          {!harakatsRevealed && (
            <Text style={[styles.tapHint, { fontSize: s.sub - 2, color: colors.text.secondary }]}>
              tap pour les harakats
            </Text>
          )}
        </Pressable>
      ) : (
        arabicText
      )}

      {translitElement}
      {translationElement}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pressable: {
    alignItems: 'center',
  },
  arabic: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  transliteration: {
    marginTop: 4,
    textAlign: 'center',
  },
  translation: {
    marginTop: 2,
    textAlign: 'center',
  },
  tapHint: {
    marginTop: 4,
  },
});
