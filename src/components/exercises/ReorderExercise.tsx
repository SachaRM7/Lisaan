// src/components/exercises/ReorderExercise.tsx

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ExerciseComponentProps, ReorderExerciseConfig, ReorderWord } from '../../types/exercise';
import ArabicText from '../arabic/ArabicText';
import { Colors, Spacing, Radius, FontSizes } from '../../constants/theme';

export function ReorderExercise({ config: rawConfig, onComplete }: ExerciseComponentProps) {
  const config = rawConfig as ReorderExerciseConfig;

  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<ReorderWord[]>(config.words_shuffled);
  const [isValidated, setIsValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const startTime = useState(() => Date.now())[0];

  const handleWordTap = useCallback((wordId: string, fromSlot: 'available' | 'selected') => {
    if (isValidated) return;
    if (fromSlot === 'available') {
      setSelectedOrder(prev => [...prev, wordId]);
      setAvailableWords(prev => prev.filter(w => w.id !== wordId));
    } else {
      setSelectedOrder(prev => prev.filter(id => id !== wordId));
      const word = config.words_shuffled.find(w => w.id === wordId)!;
      setAvailableWords(prev => [...prev, word]);
    }
  }, [isValidated, config.words_shuffled]);

  const handleValidate = useCallback(() => {
    const correct = JSON.stringify(selectedOrder) === JSON.stringify(config.correct_order);
    setIsCorrect(correct);
    setIsValidated(true);
    setTimeout(() => {
      onComplete({
        exercise_id: config.sentence_id,
        correct,
        time_ms: Date.now() - startTime,
        attempts: 1,
        user_answer: selectedOrder,
      });
    }, 1200);
  }, [selectedOrder, config.correct_order, config.sentence_id, onComplete, startTime]);

  const selectedWords = selectedOrder.map(id => config.words_shuffled.find(w => w.id === id)!);

  return (
    <View style={styles.container}>
      {/* Instruction de tâche */}
      {(rawConfig as any).instruction_fr && (
        <Text style={styles.instruction}>{(rawConfig as any).instruction_fr}</Text>
      )}

      {/* Traduction = objectif à atteindre */}
      {(rawConfig as any).prompt?.fr && (
        <View style={styles.goalBox}>
          <Text style={styles.goalLabel}>À traduire</Text>
          <Text style={styles.goalText}>« {(rawConfig as any).prompt.fr} »</Text>
        </View>
      )}

      {/* Zone de réponse */}
      <View style={styles.answerZone}>
        <Text style={styles.zoneLabel}>Ta réponse</Text>
        <View style={styles.wordRow}>
          {selectedWords.map(word => (
            <TouchableOpacity
              key={word.id}
              style={[styles.wordChip, styles.wordChipSelected]}
              onPress={() => handleWordTap(word.id, 'selected')}
              accessibilityRole="button"
              accessibilityLabel={word.transliteration ?? word.arabic_vocalized}
              accessibilityHint="Appuyer pour retirer ce mot"
            >
              <ArabicText size="small">{word.arabic_vocalized}</ArabicText>
              {config.show_transliteration && word.transliteration && (
                <Text style={styles.wordTranslit}>{word.transliteration}</Text>
              )}
            </TouchableOpacity>
          ))}
          {selectedWords.length === 0 && (
            <Text style={styles.placeholder}>Appuie sur les mots ci-dessous</Text>
          )}
        </View>
      </View>

      {/* Mots disponibles */}
      <View style={styles.availableZone}>
        <View style={styles.wordRow}>
          {availableWords.map(word => (
            <TouchableOpacity
              key={word.id}
              style={styles.wordChip}
              onPress={() => handleWordTap(word.id, 'available')}
              accessibilityRole="button"
              accessibilityLabel={word.transliteration ?? word.arabic_vocalized}
            >
              <ArabicText size="small">{word.arabic_vocalized}</ArabicText>
              {config.show_transliteration && word.transliteration && (
                <Text style={styles.wordTranslit}>{word.transliteration}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bouton Valider */}
      {selectedOrder.length === config.correct_order.length && !isValidated && (
        <TouchableOpacity style={styles.validateButton} onPress={handleValidate}>
          <Text style={styles.validateText}>Valider →</Text>
        </TouchableOpacity>
      )}

      {/* Feedback */}
      {isValidated && (
        <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackText}>
            {isCorrect ? '✓ Excellent !' : '✗ Pas tout à fait…'}
          </Text>
          {!isCorrect && (
            <Text style={styles.feedbackHint}>
              Bonne réponse :{' '}
              {config.correct_order
                .map(id => config.words_shuffled.find(w => w.id === id)?.arabic_vocalized ?? '')
                .join(' ')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  instruction: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  goalBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  goalLabel: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  goalText: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  hint: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  answerZone: {
    minHeight: 80,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.bg,
  },
  zoneLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  availableZone: { marginBottom: Spacing.xl },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  wordChip: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  wordChipSelected: { backgroundColor: '#EEF6F1', borderColor: Colors.primary },
  wordTranslit: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  placeholder: { color: Colors.textMuted, fontSize: FontSizes.body, alignSelf: 'center', paddingVertical: Spacing.md },
  validateButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  validateText: { color: '#FFF', fontWeight: '700', fontSize: FontSizes.body },
  feedback: { borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md, alignItems: 'center' },
  feedbackCorrect: { backgroundColor: '#EEF6F1' },
  feedbackWrong: { backgroundColor: '#FFF4F4' },
  feedbackText: { fontSize: FontSizes.body, fontWeight: '700' },
  feedbackHint: { fontSize: FontSizes.small, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
});
