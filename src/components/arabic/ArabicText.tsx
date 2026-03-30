// src/components/arabic/ArabicText.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
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
   * Force l'affichage statique : harakats toujours visibles, aucun tap interactif.
   * Utile pour les exercices enseignant les harakats eux-mêmes.
   */
  forceStaticDisplay?: boolean;
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
  forceStaticDisplay,
}: ArabicTextProps) {
  const globalSettings = useSettingsStore();
  const { colors, typography } = useTheme();

  // ─── Mode effectif ────────────────────────────────────────────
  // forceStaticDisplay bypasse tous les réglages utilisateur : harakats always, pas d'interactivité
  const effectiveHarakatsMode = forceStaticDisplay ? 'always' : (harakatsMode ?? globalSettings.harakats_mode);
  const effectiveSize = (size ?? globalSettings.font_size) as keyof typeof SIZES;

  const translitMode = showTransliteration !== undefined
    ? (showTransliteration ? 'always' : 'never')
    : globalSettings.transliteration_mode;

  const translationMode = showTranslation !== undefined
    ? (showTranslation ? 'always' : 'never')
    : globalSettings.translation_mode;

  const s = SIZES[effectiveSize] ?? SIZES.medium;
  const bareText = withoutHarakats ?? stripHarakats(children);

  // ─── Shared values pour les fades ────────────────────────────
  const harakatsOpacity = useSharedValue(
    effectiveHarakatsMode === 'always' || effectiveHarakatsMode === 'adaptive' ? 1 : 0
  );
  const translitOpacity = useSharedValue(translitMode === 'always' ? 1 : 0);
  const translationOpacity = useSharedValue(translationMode === 'always' ? 1 : 0);

  const harakatsOverlayStyle = useAnimatedStyle(() => ({ opacity: harakatsOpacity.value }));
  const translitTextStyle    = useAnimatedStyle(() => ({ opacity: translitOpacity.value }));
  // Hint visible at 30% when hidden, fades to 0 when text is revealed
  const translitHintStyle    = useAnimatedStyle(() => ({ opacity: (1 - translitOpacity.value) * 0.3 }));
  const translationTextStyle = useAnimatedStyle(() => ({ opacity: translationOpacity.value }));
  const translationHintStyle = useAnimatedStyle(() => ({ opacity: (1 - translationOpacity.value) * 0.3 }));

  // ─── Handlers tap ────────────────────────────────────────────
  function handleHarakatsTap() {
    if (forceStaticDisplay || effectiveHarakatsMode !== 'tap_reveal') return;
    const isRevealed = harakatsOpacity.value > 0.5;
    harakatsOpacity.value = withTiming(isRevealed ? 0 : 1, { duration: 200 });
  }

  function handleTranslitTap() {
    if (translitMode !== 'tap_reveal') return;
    const isRevealed = translitOpacity.value > 0.5;
    translitOpacity.value = withTiming(isRevealed ? 0 : 1, { duration: 200 });
  }

  function handleTranslationTap() {
    if (translationMode !== 'tap_reveal') return;
    const isRevealed = translationOpacity.value > 0.5;
    translationOpacity.value = withTiming(isRevealed ? 0 : 1, { duration: 200 });
  }

  // ─── Style arabe partagé ──────────────────────────────────────
  const arabicStyle = {
    fontFamily: typography.family.arabic,
    fontSize: s.arabic,
    lineHeight: s.lineHeight,
    color: colors.text.heroArabic,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  };

  // ─── Rendu texte arabe ────────────────────────────────────────
  let arabicElement: React.ReactNode;

  if (effectiveHarakatsMode === 'tap_reveal') {
    // Technique overlay : bareText établit la hauteur, harakats en fade par-dessus
    // → lineHeight JAMAIS modifié → zéro saut de layout
    arabicElement = (
      <Pressable onPress={handleHarakatsTap} accessibilityRole="button" accessibilityLabel="Révéler les harakats">
        <View>
          {/* Couche de base — toujours visible, établit la hauteur */}
          <Text
            style={arabicStyle}
            accessibilityLabel={transliteration ?? bareText}
            accessibilityLanguage="ar"
          >
            {bareText}
          </Text>
          {/* Overlay harakats — fade in/out au tap */}
          <Reanimated.View style={[StyleSheet.absoluteFillObject, harakatsOverlayStyle]}>
            <Text style={arabicStyle}>{children}</Text>
          </Reanimated.View>
        </View>
      </Pressable>
    );
  } else {
    // Affichage direct — pas d'overlay
    const displayText = effectiveHarakatsMode === 'never' ? bareText : children;
    arabicElement = (
      <Text
        style={arabicStyle}
        accessibilityLabel={transliteration ?? stripHarakats(children)}
        accessibilityLanguage="ar"
        accessible={true}
      >
        {displayText}
      </Text>
    );
  }

  // ─── Rendu translittération ───────────────────────────────────
  let translitElement: React.ReactNode = null;
  if (transliteration && translitMode !== 'never') {
    const subStyle = {
      fontFamily: typography.family.ui,
      fontSize: s.sub,
      color: colors.text.secondary,
      textAlign: 'center' as const,
    };
    if (translitMode === 'tap_reveal') {
      translitElement = (
        <Pressable
          onPress={handleTranslitTap}
          style={styles.revealable}
          accessibilityRole="button"
          accessibilityLabel="Révéler la translittération"
        >
          <View style={styles.revealContainer}>
            {/* Indicateur hint — visible quand masqué */}
            <Reanimated.Text style={[subStyle, translitHintStyle]}>
              ···
            </Reanimated.Text>
            {/* Texte réel — fade in au tap */}
            <Reanimated.View style={[StyleSheet.absoluteFillObject, translitTextStyle]}>
              <Text style={subStyle}>{transliteration}</Text>
            </Reanimated.View>
          </View>
        </Pressable>
      );
    } else {
      translitElement = (
        <Text style={[subStyle, styles.transliteration]}>{transliteration}</Text>
      );
    }
  }

  // ─── Rendu traduction ─────────────────────────────────────────
  let translationElement: React.ReactNode = null;
  if (translation && translationMode !== 'never') {
    const subStyle = {
      fontFamily: typography.family.ui,
      fontSize: s.sub,
      color: colors.text.secondary,
      textAlign: 'center' as const,
    };
    if (translationMode === 'tap_reveal') {
      translationElement = (
        <Pressable
          onPress={handleTranslationTap}
          style={styles.revealable}
          accessibilityRole="button"
          accessibilityLabel="Révéler la traduction"
        >
          <View style={styles.revealContainer}>
            {/* Indicateur hint */}
            <Reanimated.Text style={[subStyle, translationHintStyle]}>
              ···
            </Reanimated.Text>
            {/* Texte réel */}
            <Reanimated.View style={[StyleSheet.absoluteFillObject, translationTextStyle]}>
              <Text style={subStyle}>{translation}</Text>
            </Reanimated.View>
          </View>
        </Pressable>
      );
    } else {
      translationElement = (
        <Text style={[subStyle, styles.translation]}>{translation}</Text>
      );
    }
  }

  return (
    <View style={[styles.container, style]}>
      {arabicElement}
      {translitElement}
      {translationElement}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  transliteration: {
    marginTop: 4,
  },
  translation: {
    marginTop: 2,
  },
  revealable: {
    alignItems: 'center',
    marginTop: 4,
  },
  revealContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
});
