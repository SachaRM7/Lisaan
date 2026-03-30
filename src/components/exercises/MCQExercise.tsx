// src/components/exercises/MCQExercise.tsx
import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
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
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const startTime = useRef(Date.now());
  const hapticFeedback = useSettingsStore((s) => s.haptic_feedback);
  const translationMode = useSettingsStore((s) => s.translation_mode);
  const harakatsMode = useSettingsStore((s) => s.harakats_mode);

  const defaultTranslation = translationMode === 'always';
  const defaultHarakats = harakatsMode === 'always' || harakatsMode === 'adaptive';

  const options = config.options ?? [];
  const correctOption = options.find((o) => o.correct);

  // Shake Reanimated — appliqué au conteneur des options
  const shakeOffset = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  function triggerShake() {
    shakeOffset.value = withSequence(
      withTiming(10, { duration: 55 }),
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-10, { duration: 55 }),
      withTiming(6, { duration: 45 }),
      withTiming(-6, { duration: 45 }),
      withTiming(0, { duration: 40 }),
    );
  }

  function handleSelect(option: ExerciseOption) {
    if (validated) return;
    setSelected(option.id);
  }

  function handleValidate() {
    if (!selected || validated) return;
    setValidated(true);

    const isCorrect = options.find(o => o.id === selected)?.correct ?? false;

    if (hapticFeedback) {
      Haptics.notificationAsync(
        isCorrect
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    }

    if (!isCorrect) {
      triggerShake();
    }

    setTimeout(() => {
      onComplete({
        exercise_id: config.id,
        correct: isCorrect,
        time_ms: Date.now() - startTime.current,
        attempts: isCorrect ? 1 : 2,
        user_answer: selected,
      });
    }, isCorrect ? 800 : 1200);
  }

  function getExerciseState(option: ExerciseOption): 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed' {
    if (!validated) return selected === option.id ? 'selected' : 'default';
    if (option.correct) return 'correct';
    if (option.id === selected) return 'incorrect';
    return 'dimmed';
  }

  const isCorrectAnswer = validated && (options.find(o => o.id === selected)?.correct ?? false);
  const buttonDisabled = !selected;
  const buttonBg = buttonDisabled
    ? colors.status.disabled
    : colors.brand.primary;

  return (
    <View style={{ flex: 1 }}>
      {/* Contenu scrollable */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl }}
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

        {/* Options avec shake Reanimated */}
        <Reanimated.View style={[{ gap: spacing.base }, shakeStyle]}>
          {options.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              answered={validated}
              selected={selected}
              defaultHarakats={defaultHarakats}
              defaultTranslation={defaultTranslation}
              onSelect={handleSelect}
              exerciseState={getExerciseState(option)}
            />
          ))}
        </Reanimated.View>

        {/* Feedback après validation */}
        {validated ? (
          <View style={{
            borderRadius: borderRadius.md,
            padding: spacing.base,
            marginBottom: spacing.base,
            alignItems: 'center',
            backgroundColor: isCorrectAnswer ? colors.status.successLight : colors.status.errorLight,
            borderWidth: 1,
            borderColor: isCorrectAnswer ? colors.status.success : colors.status.error,
          }}>
            <Text style={{
              fontFamily: typography.family.uiBold,
              fontSize: typography.size.body,
              color: isCorrectAnswer ? colors.status.success : colors.status.error,
              textAlign: 'center',
            }}>
              {isCorrectAnswer
                ? '✓ Bravo !'
                : `✗ La bonne réponse était : ${correctOption?.text.fr ?? correctOption?.text.ar ?? ''}`}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer sticky — Valider / Continuer */}
      <View style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.base,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
        backgroundColor: colors.background.main,
      }}>
        <Pressable
          onPress={validated ? undefined : handleValidate}
          disabled={buttonDisabled}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: borderRadius.pill,
            backgroundColor: buttonDisabled ? colors.status.disabled : pressed ? colors.brand.dark : buttonBg,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            ...(buttonDisabled ? {} : shadows.prominent),
          })}
        >
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.body,
            color: buttonDisabled ? colors.text.secondary : colors.text.inverse,
          }}>
            {validated ? 'Continuer →' : 'Valider'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
