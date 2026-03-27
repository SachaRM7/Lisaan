// src/components/exercises/ReorderExercise.tsx

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ExerciseComponentProps, ReorderExerciseConfig, ReorderWord } from '../../types/exercise';
import ArabicText from '../arabic/ArabicText';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui';

export function ReorderExercise({ config: rawConfig, onComplete }: ExerciseComponentProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
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
    <View style={{ flex: 1, padding: spacing.lg, gap: spacing.sm }}>
      {(rawConfig as any).instruction_fr && (
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center' }}>
          {(rawConfig as any).instruction_fr}
        </Text>
      )}

      {(rawConfig as any).prompt?.fr && (
        <View style={{
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.base,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border.subtle,
          gap: 2,
          ...shadows.subtle,
        }}>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.tiny, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            À traduire
          </Text>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.primary, textAlign: 'center' }}>
            « {(rawConfig as any).prompt.fr} »
          </Text>
        </View>
      )}

      {/* Zone de réponse */}
      <View style={{
        minHeight: 80,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: colors.border.medium,
        borderStyle: 'dashed',
        padding: spacing.sm,
        marginBottom: spacing.lg,
        backgroundColor: colors.background.main,
      }}>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Ta réponse
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' }}>
          {selectedWords.map(word => (
            <TouchableOpacity
              key={word.id}
              style={{
                backgroundColor: colors.brand.light,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderWidth: 1.5,
                borderColor: colors.brand.primary,
                alignItems: 'center',
                ...shadows.subtle,
              }}
              onPress={() => handleWordTap(word.id, 'selected')}
              accessibilityRole="button"
              accessibilityLabel={word.transliteration ?? word.arabic_vocalized}
              accessibilityHint="Appuyer pour retirer ce mot"
            >
              <ArabicText size="small">{word.arabic_vocalized}</ArabicText>
              {config.show_transliteration && word.transliteration && (
                <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary, marginTop: 2 }}>
                  {word.transliteration}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          {selectedWords.length === 0 && (
            <Text style={{ fontFamily: typography.family.ui, color: colors.text.secondary, fontSize: typography.size.body, alignSelf: 'center', paddingVertical: spacing.sm }}>
              Appuie sur les mots ci-dessous
            </Text>
          )}
        </View>
      </View>

      {/* Mots disponibles */}
      <View style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' }}>
          {availableWords.map(word => (
            <TouchableOpacity
              key={word.id}
              style={{
                backgroundColor: colors.background.card,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderWidth: 1.5,
                borderColor: colors.border.medium,
                alignItems: 'center',
                ...shadows.subtle,
              }}
              onPress={() => handleWordTap(word.id, 'available')}
              accessibilityRole="button"
              accessibilityLabel={word.transliteration ?? word.arabic_vocalized}
            >
              <ArabicText size="small">{word.arabic_vocalized}</ArabicText>
              {config.show_transliteration && word.transliteration && (
                <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary, marginTop: 2 }}>
                  {word.transliteration}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedOrder.length === config.correct_order.length && !isValidated && (
        <Button label="Valider →" variant="primary" onPress={handleValidate} />
      )}

      {isValidated && (
        <View style={{
          borderRadius: borderRadius.md,
          padding: spacing.sm,
          marginTop: spacing.sm,
          alignItems: 'center',
          backgroundColor: isCorrect ? colors.status.successLight : colors.status.errorLight,
        }}>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: isCorrect ? colors.status.success : colors.status.error }}>
            {isCorrect ? '✓ Excellent !' : '✗ Pas tout à fait…'}
          </Text>
          {!isCorrect && (
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, marginTop: spacing.xs, textAlign: 'center' }}>
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
