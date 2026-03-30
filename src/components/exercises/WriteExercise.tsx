// src/components/exercises/WriteExercise.tsx

import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import type { ExerciseComponentProps } from '../../types/exercise';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { validateWrittenAnswer } from '../../engines/answer-validator';
import ArabicText from '../arabic/ArabicText';

type FeedbackState = 'none' | 'exact' | 'almost' | 'wrong';

export function WriteExercise({ config, onComplete }: ExerciseComponentProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const writeTolerance = useSettingsStore((s) => s.write_tolerance);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [feedbackText, setFeedbackText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const startTime = useRef(Date.now());

  const lang = config.write_answer_lang ?? 'fr';
  const correctAnswers = config.write_accepted_answers ?? (
    typeof config.correct_answer === 'string' ? [config.correct_answer]
      : config.correct_answer ?? []
  );

  const suppressFeedback = !!(config.metadata?.suppressFeedback);

  function handleValidate() {
    if (!input.trim()) return;

    const result = validateWrittenAnswer(input, correctAnswers, lang, writeTolerance);

    if (suppressFeedback) {
      onComplete({
        exercise_id: config.id,
        correct: result.isCorrect,
        time_ms: Date.now() - startTime.current,
        attempts: 1,
        user_answer: input,
      });
      return;
    }

    const state: FeedbackState = result.isExact ? 'exact' : result.isCorrect ? 'almost' : 'wrong';
    setFeedback(state);
    setFeedbackText(result.feedback);

    setTimeout(() => {
      onComplete({
        exercise_id: config.id,
        correct: result.isCorrect,
        time_ms: Date.now() - startTime.current,
        attempts: 1,
        user_answer: input,
      });
    }, 1500);
  }

  const feedbackBg = feedback === 'exact' ? colors.status.successLight
    : feedback === 'almost' ? `${colors.accent.gold}26`
    : feedback === 'wrong' ? colors.status.errorLight
    : 'transparent';

  const feedbackColor = feedback === 'exact' ? colors.status.success
    : feedback === 'almost' ? colors.accent.gold
    : colors.status.error;

  const buttonDisabled = !input.trim() || feedback !== 'none';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {config.instruction_fr ? (
          <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center' }}>
            {config.instruction_fr}
          </Text>
        ) : null}

        {/* Prompt */}
        <View style={{
          alignItems: 'center',
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.xl,
          paddingVertical: spacing.hero,
          paddingHorizontal: spacing.lg,
        }}>
          {config.prompt.ar ? (
            <ArabicText size="xlarge">{config.prompt.ar}</ArabicText>
          ) : null}
          {config.prompt.fr ? (
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary, textAlign: 'center' }}>
              {config.prompt.fr}
            </Text>
          ) : null}
        </View>

        {/* TextInput */}
        <TextInput
          value={input}
          onChangeText={setInput}
          style={{
            backgroundColor: colors.background.card,
            borderWidth: 2,
            borderColor: isFocused ? colors.brand.primary : colors.border.medium,
            borderRadius: borderRadius.md,
            height: 56,
            paddingHorizontal: spacing.base,
            fontFamily: lang === 'ar' ? typography.family.arabic : typography.family.ui,
            fontSize: lang === 'ar' ? 24 : 18,
            color: colors.text.primary,
            textAlign: lang === 'ar' ? 'right' : 'left',
          }}
          placeholder={lang === 'ar' ? 'اكتب إجابتك…' : 'Tape ta réponse…'}
          placeholderTextColor={colors.text.secondary}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={feedback === 'none'}
        />

        {/* Feedback */}
        {feedback !== 'none' ? (
          <View style={{ backgroundColor: feedbackBg, borderRadius: borderRadius.md, padding: spacing.base, alignItems: 'center' }}>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: feedbackColor, textAlign: 'center' }}>
              {feedbackText}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer Valider */}
      <View style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.base,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
        backgroundColor: colors.background.main,
      }}>
        <Pressable
          onPress={handleValidate}
          disabled={buttonDisabled}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: borderRadius.pill,
            backgroundColor: buttonDisabled
              ? colors.status.disabled
              : pressed ? colors.brand.dark : colors.brand.primary,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            ...(buttonDisabled ? {} : (shadows.prominent as object)),
          })}
        >
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.body,
            color: buttonDisabled ? colors.text.secondary : colors.text.inverse,
          }}>
            Valider
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
