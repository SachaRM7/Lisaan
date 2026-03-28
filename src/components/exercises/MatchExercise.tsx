// src/components/exercises/MatchExercise.tsx

import { useState, useRef, useCallback } from 'react';
import {
  View, Text, Pressable, Animated, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ExerciseComponentProps, MatchPair } from '../../types/exercise';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface MatchState {
  selectedLeft: string | null;
  selectedRight: string | null;
  matchedPairs: Set<string>;
  incorrectPair: [string, string] | null;
  totalAttempts: number;
  wrongAttempts: number;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function MatchExercise({ config, onComplete }: ExerciseComponentProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const hapticFeedback = useSettingsStore((s) => s.haptic_feedback);
  const pairs: MatchPair[] = config.matchPairs ?? [];
  const startTime = useRef(Date.now());
  const arabicLineHeight = Math.round(36 * 1.9);

  const [shuffledRight] = useState(() => shuffleArray(pairs));
  const [grayedPairs, setGrayedPairs] = useState<Set<string>>(new Set());

  const [state, setState] = useState<MatchState>({
    selectedLeft: null,
    selectedRight: null,
    matchedPairs: new Set(),
    incorrectPair: null,
    totalAttempts: 0,
    wrongAttempts: 0,
  });

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: false }),
    ]).start();
  }, [shakeAnim]);

  function handleLeftTap(pairId: string) {
    if (state.matchedPairs.has(pairId)) return;
    if (state.incorrectPair) return;
    setState(prev => ({ ...prev, selectedLeft: pairId, selectedRight: null }));
  }

  function handleRightTap(pairId: string) {
    if (state.matchedPairs.has(pairId)) return;
    if (state.incorrectPair) return;

    const { selectedLeft } = state;

    if (!selectedLeft) {
      setState(prev => ({ ...prev, selectedRight: pairId }));
      return;
    }

    const isCorrect = selectedLeft === pairId;
    const newAttempts = state.totalAttempts + 1;

    if (isCorrect) {
      if (hapticFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newMatched = new Set(state.matchedPairs);
      newMatched.add(pairId);
      // Griser les deux cartes après 600ms
      setTimeout(() => {
        setGrayedPairs(prev => { const s = new Set(prev); s.add(pairId); return s; });
      }, 600);

      if (newMatched.size === pairs.length) {
        setState(prev => ({ ...prev, matchedPairs: newMatched, selectedLeft: null, selectedRight: null, totalAttempts: newAttempts }));
        setTimeout(() => {
          onComplete({
            exercise_id: config.id,
            correct: state.wrongAttempts === 0,
            time_ms: Date.now() - startTime.current,
            attempts: newAttempts,
            user_answer: Array.from(newMatched),
          });
        }, 800);
      } else {
        setState(prev => ({ ...prev, matchedPairs: newMatched, selectedLeft: null, selectedRight: null, totalAttempts: newAttempts }));
      }
    } else {
      if (hapticFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerShake();
      setState(prev => ({ ...prev, incorrectPair: [selectedLeft, pairId], totalAttempts: newAttempts, wrongAttempts: prev.wrongAttempts + 1 }));
      setTimeout(() => {
        setState(prev => ({ ...prev, incorrectPair: null, selectedLeft: null, selectedRight: null }));
      }, 600);
    }
  }

  function handleLeftTapWithRightFirst(pairId: string) {
    if (state.matchedPairs.has(pairId)) return;
    if (state.incorrectPair) return;

    if (state.selectedRight !== null) {
      const rightId = state.selectedRight;
      const isCorrect = pairId === rightId;
      const newAttempts = state.totalAttempts + 1;

      if (isCorrect) {
        if (hapticFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newMatched = new Set(state.matchedPairs);
        newMatched.add(pairId);
        setTimeout(() => {
          setGrayedPairs(prev => { const s = new Set(prev); s.add(pairId); return s; });
        }, 600);

        if (newMatched.size === pairs.length) {
          setState(prev => ({ ...prev, matchedPairs: newMatched, selectedLeft: null, selectedRight: null, totalAttempts: newAttempts }));
          setTimeout(() => {
            onComplete({
              exercise_id: config.id,
              correct: state.wrongAttempts === 0,
              time_ms: Date.now() - startTime.current,
              attempts: newAttempts,
              user_answer: Array.from(newMatched),
            });
          }, 800);
        } else {
          setState(prev => ({ ...prev, matchedPairs: newMatched, selectedLeft: null, selectedRight: null, totalAttempts: newAttempts }));
        }
      } else {
        if (hapticFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        triggerShake();
        setState(prev => ({ ...prev, incorrectPair: [pairId, rightId], totalAttempts: newAttempts, wrongAttempts: prev.wrongAttempts + 1 }));
        setTimeout(() => {
          setState(prev => ({ ...prev, incorrectPair: null, selectedLeft: null, selectedRight: null }));
        }, 600);
      }
    } else {
      setState(prev => ({ ...prev, selectedLeft: pairId, selectedRight: null }));
    }
  }

  const matchedCount = state.matchedPairs.size;

  // Styles dynamiques pour un item
  function getItemStyle(side: 'left' | 'right', pairId: string) {
    const isMatched = state.matchedPairs.has(pairId);
    const isGrayed = grayedPairs.has(pairId);
    const isSelected = side === 'left' ? state.selectedLeft === pairId : state.selectedRight === pairId;
    const isIncorrect = side === 'left' ? state.incorrectPair?.[0] === pairId : state.incorrectPair?.[1] === pairId;

    const base = {
      borderRadius: borderRadius.md,
      padding: spacing.base,
      alignItems: 'center' as const,
      borderWidth: 2,
      minHeight: 72,
      justifyContent: 'center' as const,
    };

    if (isGrayed) return { ...base, backgroundColor: colors.background.group, borderColor: 'transparent', opacity: 0.5 };
    if (isMatched) return { ...base, backgroundColor: colors.status.successLight, borderColor: colors.status.success };
    if (isIncorrect) return { ...base, backgroundColor: colors.status.errorLight, borderColor: colors.status.error };
    if (isSelected) return { ...base, backgroundColor: colors.brand.light, borderColor: colors.brand.primary, ...shadows.medium };

    const bg = side === 'left' ? colors.background.group : colors.background.card;
    return { ...base, backgroundColor: bg, borderColor: 'transparent', ...shadows.subtle };
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}>
      {config.instruction_fr ? (
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.h2, color: colors.text.primary, textAlign: 'center' }}>
          {config.instruction_fr}
        </Text>
      ) : null}

      <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center' }}>
        {matchedCount}/{pairs.length} paires trouvées
      </Text>

      <Animated.View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', transform: [{ translateX: shakeAnim }] }}>
        {/* Colonne gauche : arabes */}
        <View style={{ flex: 1, gap: spacing.sm }}>
          {pairs.map((pair) => (
            <Pressable
              key={`left-${pair.id}`}
              style={getItemStyle('left', pair.id)}
              onPress={() =>
                state.selectedRight
                  ? handleLeftTapWithRightFirst(pair.id)
                  : handleLeftTap(pair.id)
              }
              disabled={state.matchedPairs.has(pair.id)}
            >
              <Text style={{
                fontFamily: typography.family.arabic,
                fontSize: typography.size.arabicTitle,
                lineHeight: arabicLineHeight,
                color: state.matchedPairs.has(pair.id) ? colors.status.success : colors.text.heroArabic,
                textAlign: 'center',
              }}>
                {pair.left.ar ?? pair.left.fr ?? ''}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Séparateur */}
        <View style={{ width: 1, backgroundColor: colors.border.medium, alignSelf: 'stretch', marginVertical: spacing.xs }} />

        {/* Colonne droite : français */}
        <View style={{ flex: 1, gap: spacing.sm }}>
          {shuffledRight.map((pair) => (
            <Pressable
              key={`right-${pair.id}`}
              style={getItemStyle('right', pair.id)}
              onPress={() => handleRightTap(pair.id)}
              disabled={state.matchedPairs.has(pair.id)}
            >
              <Text style={{
                fontFamily: typography.family.uiBold,
                fontSize: typography.size.body,
                color: state.matchedPairs.has(pair.id) ? colors.status.success : colors.text.primary,
                textAlign: 'center',
              }}>
                {pair.right.fr ?? pair.right.ar ?? ''}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}
