// src/components/arabic/ArabicText.tsx
import { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../../constants/theme';

const SIZES = {
  small:  { arabic: 20, sub: 12, lineHeight: 40 },
  medium: { arabic: 28, sub: 14, lineHeight: 56 },
  large:  { arabic: 40, sub: 16, lineHeight: 80 },
  xlarge: { arabic: 56, sub: 18, lineHeight: 112 },
} as const;

interface ArabicTextProps {
  /** Texte arabe avec harakats (ex: كِتَاب) */
  children: string;
  /** Texte sans harakats — si fourni, utilisé quand harakats masqués (ex: كتاب) */
  withoutHarakats?: string;
  /** Translittération latine (ex: kitāb) — affichée en dessous si activée */
  transliteration?: string;
  /** Traduction française — affichée en dessous si activée */
  translation?: string;
  /** Mode d'affichage des harakats */
  harakatsMode?: 'always' | 'never' | 'tap_reveal';
  /** Afficher la translittération */
  showTransliteration?: boolean;
  /** Afficher la traduction */
  showTranslation?: boolean;
  /** Taille du texte arabe (défaut: 'large') */
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
  harakatsMode = 'always',
  showTransliteration = false,
  showTranslation = false,
  size = 'large',
  style,
}: ArabicTextProps) {
  const [revealed, setRevealed] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const s = SIZES[size];

  // Texte sans harakats : utiliser withoutHarakats si fourni, sinon stripper
  const bareText = withoutHarakats ?? stripHarakats(children);

  let displayText: string;
  switch (harakatsMode) {
    case 'always':
      displayText = children;
      break;
    case 'never':
      displayText = bareText;
      break;
    case 'tap_reveal':
      displayText = revealed ? children : bareText;
      break;
    default:
      displayText = children;
  }

  function handleTap() {
    if (harakatsMode !== 'tap_reveal') return;
    if (revealTimer.current) clearTimeout(revealTimer.current);
    setRevealed(true);
    revealTimer.current = setTimeout(() => setRevealed(false), 2000);
  }

  const arabicText = (
    <Text
      style={[
        styles.arabic,
        { fontSize: s.arabic, lineHeight: s.lineHeight },
      ]}
    >
      {displayText}
    </Text>
  );

  return (
    <View style={[styles.container, style]}>
      {harakatsMode === 'tap_reveal' ? (
        <Pressable onPress={handleTap} style={styles.pressable}>
          {arabicText}
          {!revealed && (
            <Text style={[styles.tapHint, { fontSize: s.sub - 2 }]}>
              tap pour les harakats
            </Text>
          )}
        </Pressable>
      ) : (
        arabicText
      )}

      {showTransliteration && transliteration ? (
        <Text style={[styles.transliteration, { fontSize: s.sub }]}>
          {transliteration}
        </Text>
      ) : null}

      {showTranslation && translation ? (
        <Text style={[styles.translation, { fontSize: s.sub }]}>
          {translation}
        </Text>
      ) : null}
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
    fontFamily: 'Amiri',
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  transliteration: {
    fontFamily: 'Inter',
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  translation: {
    fontFamily: 'Inter',
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  tapHint: {
    color: Colors.textMuted,
    marginTop: 4,
  },
});
