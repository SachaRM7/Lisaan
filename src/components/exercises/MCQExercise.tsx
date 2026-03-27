// src/components/exercises/MCQExercise.tsx
import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ExerciseComponentProps, ExerciseOption } from '../../types/exercise';
import ArabicText from '../arabic/ArabicText';
import { AudioButton } from '../AudioButton';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTheme } from '../../contexts/ThemeContext';

// ── Carte prompt (question) ────────────────────────────────────
function PromptCard({
  ar, fr, audioUrl, audioFallbackText, defaultHarakats, defaultTranslation,
}: {
  ar?: string; fr?: string;
  audioUrl?: string; audioFallbackText?: string;
  defaultHarakats: boolean; defaultTranslation: boolean;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [showH, setShowH] = useState(defaultHarakats);
  const [showT, setShowT] = useState(defaultTranslation);
  const canToggleHarakats = !!ar && hasHarakats(ar);

  return (
    <View style={{
      alignItems: 'center',
      backgroundColor: colors.background.group,
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.hero,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    }}>
      {ar ? (
        canToggleHarakats ? (
          <TouchableOpacity onPress={() => setShowH(v => !v)} activeOpacity={0.8}>
            <ArabicText size="xlarge" harakatsMode={showH ? 'always' : 'never'}>{ar}</ArabicText>
          </TouchableOpacity>
        ) : (
          <ArabicText size="xlarge" harakatsMode="never">{ar}</ArabicText>
        )
      ) : null}
      {(audioUrl || audioFallbackText) ? (
        <AudioButton
          audioUrl={audioUrl}
          fallbackText={audioFallbackText}
          autoPlay={true}
          size={36}
          style={{ alignSelf: 'center' }}
        />
      ) : null}
      {fr ? (
        showT ? (
          <TouchableOpacity onPress={() => setShowT(false)} activeOpacity={0.8}>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary, textAlign: 'center' }}>
              {fr}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowT(true)} activeOpacity={0.8}>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, opacity: 0.5, textAlign: 'center', fontStyle: 'italic' }}>
              Afficher la traduction
            </Text>
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
}

const HARAKAT_REGEX = /[\u064B-\u065F\u0670]/;
function hasHarakats(text: string) { return HARAKAT_REGEX.test(text); }

// ── Carte option (réponse) ─────────────────────────────────────
function OptionCard({
  option, answered, defaultHarakats, defaultTranslation, onSelect,
  exerciseState,
}: {
  option: ExerciseOption;
  answered: boolean;
  selected: string | null;
  defaultHarakats: boolean;
  defaultTranslation: boolean;
  onSelect: (o: ExerciseOption) => void;
  exerciseState: 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed';
}) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const [showH, setShowH] = useState(defaultHarakats);
  const [showT, setShowT] = useState(defaultTranslation);
  const canToggleHarakats = !!option.text.ar && hasHarakats(option.text.ar);

  const cardStyle = (() => {
    switch (exerciseState) {
      case 'correct':
        return { backgroundColor: colors.status.successLight, borderWidth: 2, borderColor: colors.status.success };
      case 'incorrect':
        return { backgroundColor: colors.status.errorLight, borderWidth: 2, borderColor: colors.status.error };
      case 'selected':
        return { backgroundColor: colors.brand.light, borderWidth: 2, borderColor: colors.brand.primary, ...shadows.medium };
      case 'dimmed':
        return { backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.border.subtle, opacity: 0.4 };
      default:
        return { backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.border.subtle, ...shadows.subtle };
    }
  })();

  const textColor = (() => {
    switch (exerciseState) {
      case 'correct':   return colors.status.success;
      case 'incorrect': return colors.status.error;
      case 'selected':  return colors.brand.primary;
      case 'dimmed':    return colors.text.secondary;
      default:          return colors.text.primary;
    }
  })();

  return (
    <TouchableOpacity
      style={[
        {
          borderRadius: borderRadius.md,
          paddingVertical: spacing.base,
          paddingHorizontal: spacing.md,
          alignItems: 'center',
          minHeight: 64,
          justifyContent: 'center',
          gap: spacing.xs,
        },
        cardStyle,
      ]}
      onPress={() => onSelect(option)}
      disabled={answered}
      activeOpacity={0.75}
      accessibilityRole="radio"
      accessibilityState={{ checked: answered && option.correct }}
      accessibilityLabel={option.text.fr ?? option.text.ar}
    >
      {option.text.ar ? (
        canToggleHarakats ? (
          <TouchableOpacity onPress={() => { if (!answered) setShowH(v => !v); }} activeOpacity={0.8}>
            <ArabicText harakatsMode={showH ? 'always' : 'never'}>{option.text.ar}</ArabicText>
          </TouchableOpacity>
        ) : (
          <ArabicText harakatsMode="never">{option.text.ar}</ArabicText>
        )
      ) : null}
      {option.text.fr ? (
        !option.text.ar || showT ? (
          <TouchableOpacity
            onPress={() => { if (!answered && option.text.ar) setShowT(false); }}
            activeOpacity={option.text.ar ? 0.8 : 1}
            disabled={answered || !option.text.ar}
          >
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: textColor, textAlign: 'center' }}>
              {option.text.fr}
            </Text>
          </TouchableOpacity>
        ) : (
          !answered ? (
            <TouchableOpacity onPress={() => setShowT(true)} activeOpacity={0.8}>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, opacity: 0.5, textAlign: 'center', fontStyle: 'italic' }}>
                Afficher la traduction
              </Text>
            </TouchableOpacity>
          ) : (
            option.correct ? (
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: textColor, textAlign: 'center' }}>
                {option.text.fr}
              </Text>
            ) : null
          )
        )
      ) : null}
    </TouchableOpacity>
  );
}

// ── Composant principal ────────────────────────────────────────
export function MCQExercise({ config, onComplete }: ExerciseComponentProps) {
  const { colors, typography, spacing } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const startTime = useRef(Date.now());
  const attempts = useRef(1);
  const hapticFeedback = useSettingsStore((s) => s.haptic_feedback);
  const translationMode = useSettingsStore((s) => s.translation_mode);
  const harakatsMode = useSettingsStore((s) => s.harakats_mode);

  const defaultTranslation = translationMode === 'always';
  const defaultHarakats = harakatsMode === 'always' || harakatsMode === 'adaptive';

  const options = config.options ?? [];
  const correctOption = options.find((o) => o.correct);

  function handleSelect(option: ExerciseOption) {
    if (answered) return;
    setSelected(option.id);
    setAnswered(true);
    const isCorrect = option.correct;
    if (!isCorrect) attempts.current = 2;
    if (hapticFeedback) {
      Haptics.impactAsync(isCorrect
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium);
    }
    setTimeout(() => {
      onComplete({
        exercise_id: config.id,
        correct: isCorrect,
        time_ms: Date.now() - startTime.current,
        attempts: attempts.current,
        user_answer: option.id,
      });
    }, isCorrect ? 800 : 1200);
  }

  function getExerciseState(option: ExerciseOption): 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed' {
    if (!answered) return selected === option.id ? 'selected' : 'default';
    if (option.correct) return 'correct';
    if (option.id === selected) return 'incorrect';
    return 'dimmed';
  }

  const isCorrectAnswer = selected === correctOption?.id;

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg }}
      showsVerticalScrollIndicator={false}
    >
      {config.instruction_fr ? (
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center' }}>
          {config.instruction_fr}
        </Text>
      ) : null}

      {config.prompt.ar || config.prompt.fr ? (
        <PromptCard
          ar={config.prompt.ar}
          fr={config.prompt.fr}
          audioUrl={config.audio_url}
          audioFallbackText={config.audio_fallback_text}
          defaultHarakats={defaultHarakats}
          defaultTranslation={defaultTranslation}
        />
      ) : (config.audio_url || config.audio_fallback_text) ? (
        <View style={{ alignItems: 'center', backgroundColor: colors.background.group, borderRadius: 32, paddingVertical: spacing.hero, paddingHorizontal: spacing.lg }}>
          <AudioButton
            audioUrl={config.audio_url}
            fallbackText={config.audio_fallback_text}
            autoPlay={true}
            size={40}
            style={{ alignSelf: 'center' }}
          />
        </View>
      ) : null}

      <View style={{ gap: spacing.base }}>
        {options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            answered={answered}
            selected={selected}
            defaultHarakats={defaultHarakats}
            defaultTranslation={defaultTranslation}
            onSelect={handleSelect}
            exerciseState={getExerciseState(option)}
          />
        ))}
      </View>

      {answered ? (
        <View style={{
          borderRadius: 16,
          padding: spacing.base,
          alignItems: 'center',
          backgroundColor: isCorrectAnswer ? colors.status.successLight : colors.status.errorLight,
        }}>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.body,
            color: isCorrectAnswer ? colors.status.success : colors.status.error,
          }}>
            {isCorrectAnswer
              ? '✓ Bravo !'
              : `✗ La bonne réponse était : ${correctOption?.text.fr ?? correctOption?.text.ar ?? ''}`}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
