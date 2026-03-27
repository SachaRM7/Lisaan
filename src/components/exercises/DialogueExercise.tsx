// src/components/exercises/DialogueExercise.tsx

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { ExerciseComponentProps, DialogueExerciseConfig, DialogueChoice } from '../../types/exercise';
import ArabicText from '../arabic/ArabicText';
import { Colors, Spacing, Radius, FontSizes } from '../../constants/theme';

export function DialogueExercise({ config: rawConfig, onComplete }: ExerciseComponentProps) {
  const config = rawConfig as DialogueExerciseConfig;

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const startTime = useState(() => Date.now())[0];

  const handleSelect = useCallback((choiceId: string) => {
    if (isValidated) return;
    setSelectedChoice(choiceId);
  }, [isValidated]);

  const handleValidate = useCallback(() => {
    if (!selectedChoice) return;
    const choice = config.choices.find(c => c.id === selectedChoice)!;
    setIsValidated(true);
    setTimeout(() => {
      onComplete({
        exercise_id: `dialogue-${selectedChoice}`,
        correct: choice.is_correct,
        time_ms: Date.now() - startTime,
        attempts: 1,
        user_answer: selectedChoice,
      });
    }, 1500);
  }, [selectedChoice, config.choices, onComplete, startTime]);

  const selectedChoiceObj = selectedChoice
    ? config.choices.find(c => c.id === selectedChoice)
    : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Contexte */}
      {config.context_fr && (
        <View style={styles.contextBanner}>
          <Text style={styles.contextText}>📍 {config.context_fr}</Text>
        </View>
      )}

      {/* Bulles de dialogue */}
      <View style={styles.dialogueContainer}>
        {config.turns.map(turn => (
          <View
            key={turn.id}
            style={[styles.bubble, turn.speaker === 'a' ? styles.bubbleA : styles.bubbleB]}
          >
            {turn.speaker_name && (
              <Text style={styles.speakerName}>{turn.speaker_name}</Text>
            )}
            <ArabicText size="small">{turn.arabic_vocalized}</ArabicText>
            {config.show_transliteration && turn.transliteration && (
              <Text style={styles.bubbleTranslit}>{turn.transliteration}</Text>
            )}
            {config.show_translation && turn.translation_fr && (
              <Text style={styles.bubbleTranslation}>{turn.translation_fr}</Text>
            )}
          </View>
        ))}

        {/* Bulle placeholder réponse utilisateur */}
        <View style={[styles.bubble, styles.bubbleB, styles.bubblePlaceholder]}>
          {selectedChoiceObj ? (
            <ArabicText size="small">{selectedChoiceObj.arabic_vocalized}</ArabicText>
          ) : (
            <Text style={styles.placeholderText}>Choisis ta réponse ↓</Text>
          )}
        </View>
      </View>

      {/* Choix */}
      <View style={styles.choicesContainer}>
        {config.choices.map(choice => {
          const isSelected = selectedChoice === choice.id;
          const showResult = isValidated && isSelected;

          return (
            <TouchableOpacity
              key={choice.id}
              style={[
                styles.choiceChip,
                isSelected && styles.choiceChipSelected,
                showResult && choice.is_correct && styles.choiceChipCorrect,
                showResult && !choice.is_correct && styles.choiceChipWrong,
              ]}
              onPress={() => handleSelect(choice.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={choice.transliteration ?? choice.arabic_vocalized}
            >
              <ArabicText size="small">{choice.arabic_vocalized}</ArabicText>
              {config.show_transliteration && choice.transliteration && (
                <Text style={styles.choiceTranslit}>{choice.transliteration}</Text>
              )}
              {showResult && choice.feedback_fr && (
                <Text style={styles.feedbackInline}>{choice.feedback_fr}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bouton Valider */}
      {selectedChoice && !isValidated && (
        <TouchableOpacity style={styles.validateButton} onPress={handleValidate}>
          <Text style={styles.validateText}>Répondre →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  contextBanner: {
    backgroundColor: '#F5F0E8',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  contextText: { fontSize: FontSizes.small, color: Colors.textMuted, fontStyle: 'italic' },
  dialogueContainer: { marginBottom: Spacing.xl, gap: Spacing.md },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleA: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 4 },
  bubbleB: { alignSelf: 'flex-end', backgroundColor: '#EEF6F1', borderBottomRightRadius: 4 },
  bubblePlaceholder: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.bg,
  },
  speakerName: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubbleTranslit: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  bubbleTranslation: { fontSize: FontSizes.small, color: Colors.textMuted, marginTop: 4 },
  placeholderText: { color: Colors.textMuted, fontSize: FontSizes.body, textAlign: 'center' },
  choicesContainer: { gap: Spacing.sm, marginBottom: Spacing.xl },
  choiceChip: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  choiceChipSelected: { borderColor: Colors.primary, backgroundColor: '#EEF6F1' },
  choiceChipCorrect: { borderColor: '#27AE60', backgroundColor: '#F0FBF4' },
  choiceChipWrong: { borderColor: '#E74C3C', backgroundColor: '#FFF5F5' },
  choiceTranslit: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  feedbackInline: { fontSize: FontSizes.small, color: Colors.textMuted, marginTop: Spacing.sm, fontStyle: 'italic' },
  validateButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  validateText: { color: '#FFF', fontWeight: '700', fontSize: FontSizes.body },
});
