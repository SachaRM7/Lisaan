// src/components/exercises/FillBlankExercise.tsx

import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ExerciseComponentProps, ExerciseOption } from '../../types/exercise';
import { Colors, Spacing, Radius, FontSizes, Layout } from '../../constants/theme';
import { useSettingsStore } from '../../stores/useSettingsStore';

export function FillBlankExercise({ config, onComplete }: ExerciseComponentProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const startTime = useRef(Date.now());
  const attempts = useRef(0);
  const hapticFeedback = useSettingsStore((s) => s.haptic_feedback);

  // Animation de remplissage (scale + opacity)
  const fillAnim = useRef(new Animated.Value(0)).current;
  // Animation flash rouge par option
  const flashAnims = useRef<Record<string, Animated.Value>>({});

  const options = config.options ?? [];
  const sentence = config.sentence;
  const blankWord = config.blank_word;

  // Initialiser les anims de flash pour chaque option
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      flashRed(option.id);
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // Mauvaise réponse → on ne termine pas, l'utilisateur peut réessayer
      setTimeout(() => setSelectedId(null), 500);
    }
  }

  // Construit la phrase avec le trou ou le mot rempli
  function renderSentence() {
    if (!sentence || !blankWord) {
      return <Text style={styles.sentenceText}>{config.prompt.ar ?? ''}</Text>;
    }

    const words = sentence.ar.split(' ');
    const pos = blankWord.position;

    return (
      <View style={styles.sentenceRow}>
        {words.map((word, i) => {
          if (i !== pos) {
            return (
              <Text key={i} style={styles.sentenceWord}>{word}</Text>
            );
          }
          if (solved) {
            return (
              <Animated.Text
                key={i}
                style={[
                  styles.sentenceWord,
                  styles.filledWord,
                  {
                    opacity: fillAnim,
                    transform: [{ scale: fillAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }) }],
                  },
                ]}
              >
                {blankWord.ar}
              </Animated.Text>
            );
          }
          return (
            <Text key={i} style={[styles.sentenceWord, styles.blankSlot]}>_____</Text>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Instruction */}
      {config.instruction_fr && (
        <Text style={styles.instruction}>{config.instruction_fr}</Text>
      )}

      {/* Phrase avec trou */}
      <View style={styles.sentenceBox}>
        {renderSentence()}
        {sentence && (
          <Text style={styles.translation}>{sentence.fr}</Text>
        )}
      </View>

      {/* Feedback correct */}
      {solved && (
        <View style={styles.feedbackCorrect}>
          <Text style={styles.feedbackText}>✓ Bravo !</Text>
        </View>
      )}

      {/* Options */}
      {!solved && (
        <View style={styles.options}>
          {options.map(option => {
            const flashAnim = flashAnims.current[option.id];
            const bgColor = flashAnim
              ? flashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [Colors.bgCard, Colors.errorLight],
                })
              : Colors.bgCard;

            return (
              <Animated.View key={option.id} style={[styles.option, { backgroundColor: bgColor }]}>
                <TouchableOpacity
                  style={styles.optionInner}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.optionText}>{option.text.ar}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing['2xl'],
    gap: Spacing['2xl'],
  },

  instruction: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  sentenceBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#E8E2D9',
  },
  sentenceRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
  } as any,
  sentenceWord: {
    fontFamily: 'Amiri',
    fontSize: 36,
    lineHeight: 70,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  blankSlot: {
    color: '#F4A261',
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
  },
  filledWord: {
    color: Colors.success,
  },
  translation: {
    fontFamily: 'Inter',
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  option: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E8E2D9',
    minWidth: 100,
  },
  optionInner: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  optionText: {
    fontFamily: 'Amiri',
    fontSize: 28,
    lineHeight: 52,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  feedbackCorrect: {
    backgroundColor: Colors.successLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  feedbackText: {
    fontFamily: 'Inter',
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.success,
  },
});
