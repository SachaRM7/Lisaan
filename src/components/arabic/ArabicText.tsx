import { useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import type { TextStyle } from 'react-native';
import { Colors, FontSizes } from '../../constants/theme';
import { useSettingsStore } from '../../stores';
import type { HarakatsMode } from '../../types';

/**
 * ArabicText — Core component for rendering Arabic text with adaptive harakats.
 *
 * Handles:
 * - Harakats display (always / adaptive / tap_reveal / never)
 * - RTL text direction
 * - Proper font sizing with diacritics space
 * - Tap-to-reveal interaction
 *
 * Usage:
 *   <ArabicText vocalized="كِتَاب" bare="كتاب" />
 *   <ArabicText vocalized="كِتَاب" bare="كتاب" harakatsOverride="tap_reveal" />
 */

interface ArabicTextProps {
  /** Arabic text WITH harakats (diacritics) */
  vocalized: string;
  /** Arabic text WITHOUT harakats */
  bare: string;
  /** Override the global harakats setting for this instance */
  harakatsOverride?: HarakatsMode;
  /** Whether this word is "mastered" by the user (for adaptive mode) */
  isMastered?: boolean;
  /** Font size — defaults to arabicMD */
  size?: number;
  /** Additional text style */
  style?: TextStyle;
  /** Callback when tapped */
  onPress?: () => void;
}

// Unicode ranges for Arabic diacritics (harakats)
const HARAKAT_REGEX = /[\u064B-\u065F\u0670]/g;

/**
 * Strip all diacritics from Arabic text.
 */
function stripHarakats(text: string): string {
  return text.replace(HARAKAT_REGEX, '');
}

export default function ArabicText({
  vocalized,
  bare,
  harakatsOverride,
  isMastered = false,
  size = FontSizes.arabicMD,
  style,
  onPress,
}: ArabicTextProps) {
  const globalMode = useSettingsStore((s) => s.settings.harakats_mode);
  const mode = harakatsOverride ?? globalMode;
  const [revealed, setRevealed] = useState(false);

  // Determine which text to display
  let displayText: string;

  switch (mode) {
    case 'always':
      displayText = vocalized;
      break;
    case 'never':
      displayText = bare || stripHarakats(vocalized);
      break;
    case 'adaptive':
      // Show harakats only if the word is NOT mastered
      displayText = isMastered ? (bare || stripHarakats(vocalized)) : vocalized;
      break;
    case 'tap_reveal':
      displayText = revealed ? vocalized : (bare || stripHarakats(vocalized));
      break;
    default:
      displayText = vocalized;
  }

  const handlePress = () => {
    if (mode === 'tap_reveal') {
      setRevealed(!revealed);
    }
    onPress?.();
  };

  const textStyle: TextStyle = {
    fontSize: size,
    lineHeight: size * 1.6, // Extra line height for diacritics
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
    ...style,
  };

  if (mode === 'tap_reveal' || onPress) {
    return (
      <Pressable onPress={handlePress} style={styles.pressable}>
        <Text style={textStyle}>{displayText}</Text>
        {mode === 'tap_reveal' && !revealed && (
          <Text style={styles.tapHint}>tap pour les harakats</Text>
        )}
      </Pressable>
    );
  }

  return <Text style={textStyle}>{displayText}</Text>;
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
