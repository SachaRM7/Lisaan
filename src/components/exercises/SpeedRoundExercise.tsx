// src/components/exercises/SpeedRoundExercise.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import ArabicText from '../arabic/ArabicText';
import { AudioButton } from '../AudioButton';
import type { ExerciseComponentProps, SpeedRoundResult, SpeedRoundQuestion } from '../../types/exercise';

interface Props extends ExerciseComponentProps {
  questions?: SpeedRoundQuestion[];
  durationSeconds?: number;
}

export function SpeedRoundExercise({
  questions = [],
  durationSeconds = 30,
  onComplete,
}: Props) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const startTime = useRef(Date.now());
  const timerAnim = useRef(new Animated.Value(1)).current;

  // Démarre l'animation de la barre de temps
  useEffect(() => {
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: durationSeconds * 1000,
      useNativeDriver: false,
    }).start();
  }, [durationSeconds, timerAnim]);

  // Décompte
  useEffect(() => {
    if (isFinished) return;
    if (timeLeft <= 0) {
      handleFinish(correctCount, answeredCount);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished, correctCount, answeredCount]);

  const handleFinish = useCallback((correct: number, answered: number) => {
    if (isFinished) return;
    setIsFinished(true);
    const timeUsed = (Date.now() - startTime.current) / 1000;
    const speedMultiplier = Math.max(1.0, 2.0 - timeUsed / durationSeconds);

    const result: SpeedRoundResult = {
      exercise_id: 'speed_round',
      correct: correct >= Math.ceil(questions.length * 0.6),
      time_ms: Math.round(timeUsed * 1000),
      attempts: answered,
      user_answer: correct.toString(),
      type: 'speed_round',
      questions_answered: answered,
      questions_correct: correct,
      time_used_seconds: Math.round(timeUsed),
      speed_multiplier: parseFloat(speedMultiplier.toFixed(2)),
      final_score: Math.round(correct * speedMultiplier * 10),
    };

    onComplete(result);
  }, [isFinished, questions.length, durationSeconds, onComplete, correctCount, answeredCount]);

  const handleAnswer = useCallback((index: number) => {
    if (selectedIndex !== null || isFinished) return;

    const isCorrect = index === questions[currentIndex].correct_index;

    if (isCorrect) {
      setCorrectCount(c => c + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setSelectedIndex(index);
    setAnsweredCount(a => a + 1);

    // Avancer après 400ms
    setTimeout(() => {
      setSelectedIndex(null);
      if (currentIndex + 1 >= questions.length) {
        handleFinish(isCorrect ? correctCount + 1 : correctCount, answeredCount + 1);
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 400);
  }, [selectedIndex, isFinished, currentIndex, questions, correctCount, answeredCount, handleFinish]);

  const q = questions[currentIndex];
  if (!q) return null;

  const timerColor = timerAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [colors.status.error, '#D97706', colors.status.success],
  });
  const timerWidth = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { padding: spacing.md }]}>
      {/* Timer bar */}
      <View style={[styles.timerTrack, { backgroundColor: colors.border.medium, borderRadius: borderRadius.sm }]}>
        <Animated.View style={[styles.timerBar, { width: timerWidth, backgroundColor: timerColor, borderRadius: borderRadius.sm }]} />
      </View>

      {/* Score live */}
      <View style={styles.scoreRow}>
        <Text style={{ fontSize: typography.size.h2, fontFamily: typography.family.ui, color: colors.text.primary }}>
          {correctCount}/{questions.length}
        </Text>
        <Text style={{ fontSize: typography.size.h2, fontFamily: typography.family.uiBold, color: colors.brand.primary }}>
          {timeLeft}s
        </Text>
      </View>

      {/* Question */}
      <View style={[styles.questionCard, { backgroundColor: colors.background.card, borderRadius: borderRadius.xl, padding: spacing.lg }]}>
        {q.prompt_ar && (
          <>
            <ArabicText size="xlarge" harakatsMode="always" style={[styles.questionAr, { marginBottom: spacing.xs }]}>
              {q.prompt_ar}
            </ArabicText>
            <AudioButton
              fallbackText={q.prompt_ar}
              fallbackLanguage="ar"
              size={18}
              style={{ alignSelf: 'center', marginBottom: spacing.xs }}
            />
          </>
        )}
        {q.prompt_fr && (
          <Text style={{ fontSize: typography.size.body, fontFamily: typography.family.ui, color: colors.text.secondary }}>
            {q.prompt_fr}
          </Text>
        )}
      </View>

      {/* Options */}
      <View style={[styles.optionsGrid, { gap: spacing.sm }]}>
        {q.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === q.correct_index;
          let bgColor = colors.background.card;

          if (isSelected) {
            bgColor = isCorrect ? '#10B981' : '#EF4444';
          }

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionBtn,
                {
                  backgroundColor: bgColor,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: isSelected ? 'transparent' : colors.border.medium,
                  padding: spacing.md,
                },
              ]}
              onPress={() => handleAnswer(idx)}
              activeOpacity={0.7}
              disabled={selectedIndex !== null}
            >
              <ArabicText
                size="large"
                harakatsMode="always"
                style={{ color: isSelected ? colors.text.inverse : colors.text.heroArabic, textAlign: 'center' }}
              >
                {option}
              </ArabicText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress dots */}
      <View style={[styles.dotsRow, { gap: 6, marginTop: spacing.md }]}>
        {questions.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: colors.border.medium },
              i < currentIndex && { backgroundColor: colors.status.success },
              i === currentIndex && { backgroundColor: colors.brand.primary, width: 16 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timerTrack: {
    height: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  timerBar: {
    height: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  questionCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  questionAr: {
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  optionBtn: {
    width: '47%',
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});