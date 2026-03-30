// src/components/exercises/FlashcardExercise.tsx

import { useState, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, Pressable } from 'react-native';
import type { ExerciseComponentProps } from '../../types/exercise';
import { useTheme } from '../../contexts/ThemeContext';
import ArabicText from '../arabic/ArabicText';

export function FlashcardExercise({ config, onComplete }: ExerciseComponentProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const [flipped, setFlipped] = useState(false);
  const startTime = useRef(Date.now());

  const flipAnim = useRef(new Animated.Value(0)).current;

  function handleFlip() {
    if (flipped) return;
    setFlipped(true);
    Animated.spring(flipAnim, {
      toValue: 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const isArabicPrompt = !!config.prompt.ar;
  const backText = config.flashcard_back?.fr ?? config.flashcard_back?.ar
    ?? (typeof config.correct_answer === 'string' ? config.correct_answer : config.correct_answer?.[0] ?? '');
  const backAr = config.flashcard_back?.ar;

  function handleResult(userAnswer: string, correct: boolean) {
    onComplete({
      exercise_id: config.id,
      correct,
      time_ms: Date.now() - startTime.current,
      attempts: 1,
      user_answer: userAnswer,
    });
  }

  const cardWidth = '85%';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.xl }}>

      {/* Hint */}
      {!flipped && (
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, fontStyle: 'italic' }}>
          Tap pour retourner
        </Text>
      )}

      {/* Carte */}
      <TouchableOpacity
        onPress={handleFlip}
        activeOpacity={0.85}
        style={{ width: cardWidth, aspectRatio: 1 / 1.4 }}
        disabled={flipped}
      >
        {/* Face avant */}
        <Animated.View style={{
          position: 'absolute', width: '100%', height: '100%',
          backfaceVisibility: 'hidden',
          transform: [{ rotateY: frontRotate }],
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.xl,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
          ...(shadows.medium as object),
        }}>
          {isArabicPrompt
            ? <ArabicText size="xlarge">{config.prompt.ar!}</ArabicText>
            : <Text style={{ fontFamily: typography.family.uiBold, fontSize: 28, color: colors.text.primary, textAlign: 'center' }}>
                {config.prompt.fr}
              </Text>
          }
        </Animated.View>

        {/* Face arrière */}
        <Animated.View style={{
          position: 'absolute', width: '100%', height: '100%',
          backfaceVisibility: 'hidden',
          transform: [{ rotateY: backRotate }],
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.xl,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
          gap: spacing.sm,
          ...(shadows.medium as object),
        }}>
          {backAr
            ? <ArabicText size="xlarge">{backAr}</ArabicText>
            : null}
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: 24, color: colors.text.primary, textAlign: 'center' }}>
            {backText}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Boutons d'auto-évaluation (visibles après flip) */}
      {flipped && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, width: cardWidth }}>
          <Pressable
            onPress={() => handleResult('missed', false)}
            style={({ pressed }) => ({
              flex: 1, height: 56, borderRadius: borderRadius.pill,
              backgroundColor: colors.status.errorLight,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.status.error }}>
              😕 Raté
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleResult('almost', true)}
            style={({ pressed }) => ({
              flex: 1, height: 56, borderRadius: borderRadius.pill,
              backgroundColor: `${colors.accent.gold}26`,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.accent.gold }}>
              🤔 Presque
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleResult('knew_it', true)}
            style={({ pressed }) => ({
              flex: 1, height: 56, borderRadius: borderRadius.pill,
              backgroundColor: colors.status.successLight,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.status.success }}>
              😊 Je l'avais
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
