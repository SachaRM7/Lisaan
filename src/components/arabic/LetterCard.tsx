import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import type { Letter } from '../../types';

/**
 * LetterCard — Displays an Arabic letter with its properties.
 *
 * Used in:
 * - Lesson screens (hero display)
 * - MCQ exercise (option cards)
 * - Review cards
 */

interface LetterCardProps {
  letter: Letter;
  /** Which form to display as the main letter */
  displayForm?: 'isolated' | 'initial' | 'medial' | 'final';
  /** Show all 4 positional forms below */
  showAllForms?: boolean;
  /** Show transliteration */
  showTransliteration?: boolean;
  /** Show audio play button */
  showAudio?: boolean;
  /** Card is selected */
  isSelected?: boolean;
  /** Card shows correct answer */
  isCorrect?: boolean;
  /** Compact mode for grid display */
  compact?: boolean;
  onPress?: () => void;
  onPlayAudio?: () => void;
}

const FORM_LABELS = {
  isolated: 'Isolée',
  initial: 'Initiale',
  medial: 'Médiane',
  final: 'Finale',
} as const;

export default function LetterCard({
  letter,
  displayForm = 'isolated',
  showAllForms = false,
  showTransliteration = true,
  showAudio = false,
  isSelected = false,
  isCorrect,
  compact = false,
  onPress,
  onPlayAudio,
}: LetterCardProps) {
  const mainForm = getForm(letter, displayForm);

  return (
    <Pressable
      style={[
        styles.card,
        compact && styles.cardCompact,
        isSelected && styles.cardSelected,
        isCorrect === true && styles.cardCorrect,
        isCorrect === false && styles.cardIncorrect,
      ]}
      onPress={onPress}
    >
      {/* Main letter display */}
      <Text style={[styles.letterMain, compact && styles.letterMainCompact]}>
        {mainForm}
      </Text>

      {/* Transliteration + audio */}
      {showTransliteration && (
        <View style={styles.transRow}>
          <Text style={styles.transliteration}>{letter.transliteration}</Text>
          {showAudio && (
            <Pressable onPress={onPlayAudio} style={styles.audioButton}>
              <Ionicons name="volume-medium-outline" size={18} color={Colors.primary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Positional form label (when in compact/option mode) */}
      {compact && (
        <Text style={styles.formLabel}>{FORM_LABELS[displayForm]}</Text>
      )}

      {/* All 4 forms grid */}
      {showAllForms && (
        <View style={styles.formsGrid}>
          {(['initial', 'medial', 'final', 'isolated'] as const).map((form) => (
            <View key={form} style={styles.formItem}>
              <Text style={styles.formLetter}>{getForm(letter, form)}</Text>
              <Text style={styles.formItemLabel}>{FORM_LABELS[form]}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

function getForm(letter: Letter, form: 'isolated' | 'initial' | 'medial' | 'final'): string {
  switch (form) {
    case 'isolated': return letter.form_isolated;
    case 'initial': return letter.form_initial;
    case 'medial': return letter.form_medial;
    case 'final': return letter.form_final;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.card,
  },
  cardCompact: {
    padding: Spacing.lg,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  cardCorrect: {
    borderWidth: 2,
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  cardIncorrect: {
    borderWidth: 2,
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  letterMain: {
    fontSize: FontSizes.arabicXL,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: FontSizes.arabicXL * 1.4,
  },
  letterMainCompact: {
    fontSize: FontSizes.arabicMD,
    lineHeight: FontSizes.arabicMD * 1.4,
  },
  transRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  transliteration: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  audioButton: {
    padding: Spacing.xs,
  },
  formLabel: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  formsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing['2xl'],
    justifyContent: 'center',
  },
  formItem: {
    alignItems: 'center',
    width: 70,
  },
  formLetter: {
    fontSize: FontSizes.arabicSM,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  formItemLabel: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
