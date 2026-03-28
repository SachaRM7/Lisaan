// src/components/exercises/FillBlankExercise.tsx

import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ExerciseComponentProps, ExerciseOption } from '../../types/exercise';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTheme } from '../../contexts/ThemeContext';

export function FillBlankExercise({ config, onComplete }: ExerciseComponentProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [madeError, setMadeError] = useState(false);
  const startTime = useRef(Date.now());
  const attempts = useRef(0);
  const hapticFeedback = useSettingsStore((s) => s.haptic_feedback);

  const fillAnim = useRef(new Animated.Value(0)).current;
  const flashAnims = useRef<Record<string, Animated.Value>>({});

  const options = config.options ?? [];
  const sentence = config.sentence;
  const blankWord = config.blank_word;

  const arabicLineHeight = Math.round(36 * 1.9);

  options.forEach(o => {
    if (!flashAnims.current[o.id]) {
      flashAnims.current[o.id] = new Animated.Value(0);
    }
  });

  function flashRed(optionId: string) {
    const anim = flashAnims.current[optionId];
    if (!anim) return;
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: false }),
      Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start();
  }

  function animateFill() {
    Animated.spring(fillAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 6,
    }).start();
  }

  function handleSelect(option: ExerciseOption) {
    if (solved) return;
    attempts.current += 1;
    setSelectedId(option.id);

    if (option.correct) {
      setSolved(true);
      animateFill();
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => {
        onComplete({
          exercise_id: config.id,
          correct: true,
          time_ms: Date.now() - startTime.current,
          attempts: attempts.current,
          user_answer: option.id,
        });
      }, 1000);
    } else {
      setMadeError(true);
      flashRed(option.id);
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setTimeout(() => setSelectedId(null), 500);
    }
  }

  function renderSentence() {
    if (!sentence || !blankWord) {
      return <Text style={{ fontFamily: typography.family.arabic, fontSize: typography.size.arabicTitle, lineHeight: arabicLineHeight, color: colors.text.heroArabic, textAlign: 'center' }}>
        {config.prompt.ar ?? ''}
      </Text>;
    }

    const words = sentence.ar.split(' ');
    const pos = blankWord.position;

    return (
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs } as any}>
        {words.map((word, i) => {
          if (i !== pos) {
            return (
              <Text key={i} style={{ fontFamily: typography.family.arabic, fontSize: typography.size.arabicTitle, lineHeight: arabicLineHeight, color: colors.text.heroArabic, textAlign: 'right' }}>
                {word}
              </Text>
            );
          }
          if (solved) {
            return (
              <Animated.Text
                key={i}
                style={{
                  fontFamily: typography.family.arabic,
                  fontSize: typography.size.arabicTitle,
                  lineHeight: arabicLineHeight,
                  color: colors.status.success,
                  textAlign: 'right',
                  opacity: fillAnim,
                  transform: [{ scale: fillAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                }}
              >
                {blankWord.ar}
              </Animated.Text>
            );
          }
          return (
            <Text key={i} style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.arabicTitle, lineHeight: arabicLineHeight, color: colors.brand.primary, textDecorationLine: 'underline', textDecorationStyle: 'dotted' }}>
              _____
            </Text>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg }} showsVerticalScrollIndicator={false}>
      {config.instruction_fr && (
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center' }}>
          {config.instruction_fr}
        </Text>
      )}

      {/* Phrase avec trou */}
      <View style={{
        backgroundColor: solved
          ? colors.status.successLight
          : (selectedId && !options.find(o => o.id === selectedId)?.correct)
            ? colors.status.errorLight
            : colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: solved
          ? colors.status.success
          : (selectedId && !options.find(o => o.id === selectedId)?.correct)
            ? colors.status.error
            : colors.border.subtle,
        ...shadows.subtle,
      }}>
        {renderSentence()}
        {sentence && (
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center' }}>
            {sentence.fr}
          </Text>
        )}
        {/* Bonne réponse révélée après une erreur */}
        {madeError && !solved && (
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.body,
            color: colors.status.success,
            textAlign: 'center',
            marginTop: spacing.xs,
          }}>
            ✓ {options.find(o => o.correct)?.text.ar ?? ''}
          </Text>
        )}
      </View>

      {/* Feedback correct */}
      {solved && (
        <View style={{ backgroundColor: colors.status.successLight, borderRadius: borderRadius.md, padding: spacing.base, alignItems: 'center' }}>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.status.success }}>
            ✓ Bravo !
          </Text>
        </View>
      )}

      {/* Options */}
      {!solved && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm }}>
          {options.map(option => {
            const flashAnim = flashAnims.current[option.id];
            const bgColor = flashAnim
              ? flashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.background.card, colors.status.errorLight],
                })
              : colors.background.card;

            return (
              <Animated.View key={option.id} style={{
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                minWidth: 100,
                backgroundColor: bgColor,
                ...shadows.subtle,
              }}>
                <TouchableOpacity
                  style={{ paddingVertical: spacing.base, paddingHorizontal: spacing.md, alignItems: 'center' }}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontFamily: typography.family.arabic, fontSize: typography.size.arabicBody, lineHeight: Math.round(typography.size.arabicBody * 1.9), color: colors.text.heroArabic, textAlign: 'center' }}>
                    {option.text.ar}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
