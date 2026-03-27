// src/components/exercises/DialogueExercise.tsx

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { ExerciseComponentProps, DialogueExerciseConfig, DialogueChoice } from '../../types/exercise';
import ArabicText from '../arabic/ArabicText';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui';

export function DialogueExercise({ config: rawConfig, onComplete }: ExerciseComponentProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
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
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
      {config.context_fr && (
        <View style={{
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.md,
          padding: spacing.sm,
          marginBottom: spacing.lg,
        }}>
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, fontStyle: 'italic' }}>
            📍 {config.context_fr}
          </Text>
        </View>
      )}

      {/* Dialogue bubbles */}
      <View style={{ marginBottom: spacing.lg, gap: spacing.sm }}>
        {config.turns.map(turn => (
          <View
            key={turn.id}
            style={{
              maxWidth: '78%',
              borderRadius: borderRadius.lg,
              padding: spacing.sm,
              alignSelf: turn.speaker === 'a' ? 'flex-start' : 'flex-end',
              backgroundColor: turn.speaker === 'a' ? colors.background.card : colors.brand.light,
              borderBottomLeftRadius: turn.speaker === 'a' ? 4 : borderRadius.lg,
              borderBottomRightRadius: turn.speaker === 'b' ? 4 : borderRadius.lg,
              ...shadows.subtle,
            }}
          >
            {turn.speaker_name && (
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.tiny, color: colors.text.secondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {turn.speaker_name}
              </Text>
            )}
            <ArabicText size="small">{turn.arabic_vocalized}</ArabicText>
            {config.show_transliteration && turn.transliteration && (
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary, marginTop: 2 }}>
                {turn.transliteration}
              </Text>
            )}
            {config.show_translation && turn.translation_fr && (
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, marginTop: 4 }}>
                {turn.translation_fr}
              </Text>
            )}
          </View>
        ))}

        {/* Bubble placeholder */}
        <View style={{
          maxWidth: '78%',
          borderRadius: borderRadius.lg,
          borderBottomRightRadius: 4,
          padding: spacing.sm,
          borderWidth: 1.5,
          borderColor: colors.border.medium,
          borderStyle: 'dashed',
          backgroundColor: colors.background.main,
          alignSelf: 'flex-end',
        }}>
          {selectedChoiceObj ? (
            <ArabicText size="small">{selectedChoiceObj.arabic_vocalized}</ArabicText>
          ) : (
            <Text style={{ fontFamily: typography.family.ui, color: colors.text.secondary, fontSize: typography.size.body, textAlign: 'center' }}>
              Choisis ta réponse ↓
            </Text>
          )}
        </View>
      </View>

      {/* Choices */}
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        {config.choices.map(choice => {
          const isSelected = selectedChoice === choice.id;
          const showResult = isValidated && isSelected;

          let bg = colors.background.card;
          let borderColor = colors.border.medium;
          if (showResult && choice.is_correct) { bg = colors.status.successLight; borderColor = colors.status.success; }
          else if (showResult && !choice.is_correct) { bg = colors.status.errorLight; borderColor = colors.status.error; }
          else if (isSelected) { bg = colors.brand.light; borderColor = colors.brand.primary; }

          return (
            <TouchableOpacity
              key={choice.id}
              style={{
                backgroundColor: bg,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                borderWidth: 1.5,
                borderColor,
              }}
              onPress={() => handleSelect(choice.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={choice.transliteration ?? choice.arabic_vocalized}
            >
              <ArabicText size="small">{choice.arabic_vocalized}</ArabicText>
              {config.show_transliteration && choice.transliteration && (
                <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary, marginTop: 2 }}>
                  {choice.transliteration}
                </Text>
              )}
              {showResult && choice.feedback_fr && (
                <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, marginTop: spacing.xs, fontStyle: 'italic' }}>
                  {choice.feedback_fr}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedChoice && !isValidated && (
        <Button label="Répondre →" variant="primary" onPress={handleValidate} />
      )}
    </ScrollView>
  );
}
