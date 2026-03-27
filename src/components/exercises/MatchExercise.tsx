// src/components/exercises/MatchExercise.tsx

import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Radius, FontSizes } from '../../constants/theme';
import type { ExerciseComponentProps, MatchPair } from '../../types/exercise';

interface MatchState {
  selectedLeft: string | null;
  selectedRight: string | null;
  matchedPairs: Set<string>;   // ids des paires correctement associées
  incorrectPair: [string, string] | null;  // [leftId, rightId]
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
  const pairs: MatchPair[] = config.matchPairs ?? [];
  const startTime = useRef(Date.now());

  // Colonne droite mélangée (une seule fois à la création)
  const [shuffledRight] = useState(() => shuffleArray(pairs));

  const [state, setState] = useState<MatchState>({
    selectedLeft: null,
    selectedRight: null,
    matchedPairs: new Set(),
    incorrectPair: null,
    totalAttempts: 0,
    wrongAttempts: 0,
  });

  // Animations de shake pour les erreurs
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

    // Si rien à gauche : sélectionner à droite d'abord
    if (!selectedLeft) {
      setState(prev => ({ ...prev, selectedRight: pairId }));
      return;
    }

    // Tester la correspondance
    const isCorrect = selectedLeft === pairId;
    const newAttempts = state.totalAttempts + 1;

    if (isCorrect) {
      const newMatched = new Set(state.matchedPairs);
      newMatched.add(pairId);

      if (newMatched.size === pairs.length) {
        // Toutes les paires trouvées
        setState(prev => ({
          ...prev,
          matchedPairs: newMatched,
          selectedLeft: null,
          selectedRight: null,
          totalAttempts: newAttempts,
        }));
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
        setState(prev => ({
          ...prev,
          matchedPairs: newMatched,
          selectedLeft: null,
          selectedRight: null,
          totalAttempts: newAttempts,
        }));
      }
    } else {
      // Mauvaise association : flash rouge + shake
      triggerShake();
      setState(prev => ({
        ...prev,
        incorrectPair: [selectedLeft, pairId],
        totalAttempts: newAttempts,
        wrongAttempts: prev.wrongAttempts + 1,
      }));
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          incorrectPair: null,
          selectedLeft: null,
          selectedRight: null,
        }));
      }, 600);
    }
  }

  // Si on a sélectionné à droite en premier, gérer la sélection gauche ensuite
  function handleLeftTapWithRightFirst(pairId: string) {
    if (state.matchedPairs.has(pairId)) return;
    if (state.incorrectPair) return;

    if (state.selectedRight !== null) {
      // On a déjà quelque chose à droite, tester la correspondance
      const rightId = state.selectedRight;
      const isCorrect = pairId === rightId;
      const newAttempts = state.totalAttempts + 1;

      if (isCorrect) {
        const newMatched = new Set(state.matchedPairs);
        newMatched.add(pairId);

        if (newMatched.size === pairs.length) {
          setState(prev => ({
            ...prev,
            matchedPairs: newMatched,
            selectedLeft: null,
            selectedRight: null,
            totalAttempts: newAttempts,
          }));
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
          setState(prev => ({
            ...prev,
            matchedPairs: newMatched,
            selectedLeft: null,
            selectedRight: null,
            totalAttempts: newAttempts,
          }));
        }
      } else {
        triggerShake();
        setState(prev => ({
          ...prev,
          incorrectPair: [pairId, rightId],
          totalAttempts: newAttempts,
          wrongAttempts: prev.wrongAttempts + 1,
        }));
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            incorrectPair: null,
            selectedLeft: null,
            selectedRight: null,
          }));
        }, 600);
      }
    } else {
      setState(prev => ({ ...prev, selectedLeft: pairId, selectedRight: null }));
    }
  }

  const matchedCount = state.matchedPairs.size;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Instruction */}
      {config.instruction_fr ? (
        <Text style={styles.instruction}>{config.instruction_fr}</Text>
      ) : null}

      {/* Compteur */}
      <Text style={styles.counter}>
        {matchedCount}/{pairs.length} paires trouvées
      </Text>

      {/* Deux colonnes */}
      <Animated.View
        style={[styles.columnsRow, { transform: [{ translateX: shakeAnim }] }]}
      >
        {/* Colonne gauche : syllabes arabes */}
        <View style={styles.column}>
          {pairs.map((pair) => {
            const isMatched = state.matchedPairs.has(pair.id);
            const isSelected = state.selectedLeft === pair.id;
            const isIncorrect = state.incorrectPair?.[0] === pair.id;
            return (
              <Pressable
                key={`left-${pair.id}`}
                style={[
                  styles.itemLeft,
                  isMatched && styles.itemMatched,
                  isSelected && styles.itemSelected,
                  isIncorrect && styles.itemIncorrect,
                ]}
                onPress={() =>
                  state.selectedRight
                    ? handleLeftTapWithRightFirst(pair.id)
                    : handleLeftTap(pair.id)
                }
                disabled={isMatched}
              >
                <Text style={[styles.itemTextAr, isMatched && styles.itemTextMatched]}>
                  {pair.left.ar ?? pair.left.fr ?? ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Séparateur */}
        <View style={styles.columnSeparator} />

        {/* Colonne droite : noms français (mélangés) */}
        <View style={styles.column}>
          {shuffledRight.map((pair) => {
            const isMatched = state.matchedPairs.has(pair.id);
            const isSelected = state.selectedRight === pair.id;
            const isIncorrect = state.incorrectPair?.[1] === pair.id;
            return (
              <Pressable
                key={`right-${pair.id}`}
                style={[
                  styles.itemRight,
                  isMatched && styles.itemMatched,
                  isSelected && styles.itemSelected,
                  isIncorrect && styles.itemIncorrect,
                ]}
                onPress={() => handleRightTap(pair.id)}
                disabled={isMatched}
              >
                <Text style={[styles.itemTextFr, isMatched && styles.itemTextMatched]}>
                  {pair.right.fr ?? pair.right.ar ?? ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing['2xl'],
    gap: Spacing.xl,
    flexGrow: 1,
  },
  instruction: {
    fontSize: FontSizes.heading,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  counter: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },

  columnsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    gap: Spacing.md,
  },
  columnSeparator: {
    width: 1,
    backgroundColor: Colors.border,
    alignSelf: 'stretch',
    marginVertical: Spacing.sm,
  },

  // Éléments gauche (arabes)
  itemLeft: {
    backgroundColor: '#FFF8F0',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 72,
    justifyContent: 'center',
  },
  itemTextAr: {
    fontFamily: 'Amiri',
    fontSize: 36,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Éléments droite (français)
  itemRight: {
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 72,
    justifyContent: 'center',
  },
  itemTextFr: {
    fontFamily: 'Inter',
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // États
  itemSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  itemMatched: {
    backgroundColor: '#D1FAE5',
    borderColor: '#2A9D8F',
  },
  itemTextMatched: {
    color: '#065F46',
  },
  itemIncorrect: {
    backgroundColor: '#FEE2E2',
    borderColor: '#E76F51',
  },
});
