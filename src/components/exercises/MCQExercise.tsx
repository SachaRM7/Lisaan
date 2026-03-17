// src/components/exercises/MCQExercise.tsx
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { ExerciseComponentProps, ExerciseOption } from '../../types/exercise';
import ArabicText from '../arabic/ArabicText';
import { Colors, Spacing, Radius, FontSizes, Layout } from '../../constants/theme';

export function MCQExercise({ config, onComplete }: ExerciseComponentProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const startTime = useRef(Date.now());
  const attempts = useRef(1);

  const options = config.options ?? [];
  const correctOption = options.find((o) => o.correct);

  function handleSelect(option: ExerciseOption) {
    if (answered) return;

    setSelected(option.id);
    setAnswered(true);

    const isCorrect = option.correct;
    if (!isCorrect) attempts.current = 2;

    const delay = isCorrect ? 800 : 1200;
    setTimeout(() => {
      onComplete({
        exercise_id: config.id,
        correct: isCorrect,
        time_ms: Date.now() - startTime.current,
        attempts: attempts.current,
        user_answer: option.id,
      });
    }, delay);
  }

  function getOptionStyle(option: ExerciseOption) {
    if (!answered) return styles.option;
    if (option.correct) return [styles.option, styles.optionCorrect];
    if (option.id === selected && !option.correct) return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDimmed];
  }

  function getOptionTextStyle(option: ExerciseOption) {
    if (!answered) return styles.optionText;
    if (option.correct) return [styles.optionText, styles.optionTextCorrect];
    if (option.id === selected && !option.correct) return [styles.optionText, styles.optionTextWrong];
    return [styles.optionText, styles.optionTextDimmed];
  }

  const isCorrectAnswer = selected === correctOption?.id;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Instruction */}
      {config.instruction_fr ? (
        <Text style={styles.instruction}>{config.instruction_fr}</Text>
      ) : null}

      {/* Prompt */}
      <View style={styles.promptBox}>
        {config.prompt.ar ? (
          <ArabicText size="xlarge">{config.prompt.ar}</ArabicText>
        ) : null}
        {config.prompt.fr ? (
          <Text style={styles.promptFr}>{config.prompt.fr}</Text>
        ) : null}
      </View>

      {/* Options */}
      <View style={styles.options}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={getOptionStyle(option)}
            onPress={() => handleSelect(option)}
            disabled={answered}
            activeOpacity={0.75}
          >
            {option.text.ar ? (
              <ArabicText size="large">{option.text.ar}</ArabicText>
            ) : null}
            {option.text.fr ? (
              <Text style={getOptionTextStyle(option)}>{option.text.fr}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback */}
      {answered ? (
        <View style={[styles.feedback, isCorrectAnswer ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={[styles.feedbackText, isCorrectAnswer ? styles.feedbackTextCorrect : styles.feedbackTextWrong]}>
            {isCorrectAnswer
              ? '✓ Bravo !'
              : `✗ La bonne réponse était : ${correctOption?.text.fr ?? correctOption?.text.ar ?? ''}`}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing['2xl'],
    gap: Spacing['2xl'],
  },

  // Instruction
  instruction: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Prompt
  promptBox: {
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promptFr: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Options
  options: {
    gap: Spacing.md,
  },
  option: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  optionCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  optionWrong: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  optionDimmed: {
    opacity: 0.4,
  },
  optionText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionTextCorrect: {
    color: Colors.success,
  },
  optionTextWrong: {
    color: Colors.error,
  },
  optionTextDimmed: {
    color: Colors.textMuted,
  },

  // Feedback
  feedback: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  feedbackCorrect: {
    backgroundColor: Colors.successLight,
  },
  feedbackWrong: {
    backgroundColor: Colors.errorLight,
  },
  feedbackText: {
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  feedbackTextCorrect: {
    color: Colors.success,
  },
  feedbackTextWrong: {
    color: Colors.error,
  },
});
