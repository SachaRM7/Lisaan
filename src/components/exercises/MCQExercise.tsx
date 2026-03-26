// src/components/exercises/MCQExercise.tsx
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ExerciseComponentProps, ExerciseOption } from '../../types/exercise';
import ArabicText from '../arabic/ArabicText';
import { AudioButton } from '../AudioButton';
import { Colors, Spacing, Radius, FontSizes, Layout } from '../../constants/theme';
import { useSettingsStore } from '../../stores/useSettingsStore';

// ── Carte prompt (question) ────────────────────────────────────
function PromptCard({
  ar, fr, audioUrl, audioFallbackText, defaultHarakats, defaultTranslation,
}: {
  ar?: string; fr?: string;
  audioUrl?: string; audioFallbackText?: string;
  defaultHarakats: boolean; defaultTranslation: boolean;
}) {
  const [showH, setShowH] = useState(defaultHarakats);
  const [showT, setShowT] = useState(defaultTranslation);

  const canToggleHarakats = !!ar && hasHarakats(ar);

  return (
    <View style={styles.promptBox}>
      {ar ? (
        canToggleHarakats ? (
          <TouchableOpacity onPress={() => setShowH(v => !v)} activeOpacity={0.8}>
            <ArabicText harakatsMode={showH ? 'always' : 'never'}>{ar}</ArabicText>
          </TouchableOpacity>
        ) : (
          <ArabicText harakatsMode="never">{ar}</ArabicText>
        )
      ) : null}
      {(audioUrl || audioFallbackText) ? (
        <AudioButton
          audioUrl={audioUrl}
          fallbackText={audioFallbackText}
          autoPlay={true}
          size={36}
          style={styles.bigAudioBtn}
        />
      ) : null}
      {fr ? (
        showT ? (
          <TouchableOpacity onPress={() => setShowT(false)} activeOpacity={0.8}>
            <Text style={styles.promptFr}>{fr}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowT(true)} activeOpacity={0.8}>
            <Text style={styles.revealHint}>Afficher la traduction</Text>
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
  option, answered,
  defaultHarakats, defaultTranslation,
  onSelect, getStyle, getTextStyle,
}: {
  option: ExerciseOption;
  answered: boolean; selected: string | null;
  defaultHarakats: boolean; defaultTranslation: boolean;
  onSelect: (o: ExerciseOption) => void;
  getStyle: (o: ExerciseOption) => any;
  getTextStyle: (o: ExerciseOption) => any;
}) {
  const [showH, setShowH] = useState(defaultHarakats);
  const [showT, setShowT] = useState(defaultTranslation);

  // Les lettres isolées n'ont pas de harakats → pas de toggle
  const canToggleHarakats = !!option.text.ar && hasHarakats(option.text.ar);

  return (
    <TouchableOpacity
      style={getStyle(option)}
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
        // Si pas d'arabe, le français EST la réponse → toujours visible
        !option.text.ar || showT ? (
          <TouchableOpacity
            onPress={() => { if (!answered && option.text.ar) setShowT(false); }}
            activeOpacity={option.text.ar ? 0.8 : 1}
            disabled={answered || !option.text.ar}
          >
            <Text style={getTextStyle(option)}>{option.text.fr}</Text>
          </TouchableOpacity>
        ) : (
          !answered ? (
            <TouchableOpacity onPress={() => setShowT(true)} activeOpacity={0.8}>
              <Text style={styles.revealHint}>Afficher la traduction</Text>
            </TouchableOpacity>
          ) : (
            option.correct ? (
              <Text style={getTextStyle(option)}>{option.text.fr}</Text>
            ) : null
          )
        )
      ) : null}
    </TouchableOpacity>
  );
}

// ── Composant principal ────────────────────────────────────────
export function MCQExercise({ config, onComplete }: ExerciseComponentProps) {
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

  function getOptionStyle(option: ExerciseOption) {
    if (!answered) return styles.option;
    if (option.correct) return [styles.option, styles.optionCorrect];
    if (option.id === selected && !option.correct) return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDimmed];
  }

  function getOptionTextStyle(option: ExerciseOption) {
    if (!answered) return styles.optionText;
    if (option.correct) return [styles.optionText, styles.optionTextCorrect];
    if (option.id === selected && !option.correct) return [styles.optionText, styles.optionTextWrong];
    return [styles.optionText, styles.optionTextDimmed];
  }

  const isCorrectAnswer = selected === correctOption?.id;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {config.instruction_fr ? (
        <Text style={styles.instruction}>{config.instruction_fr}</Text>
      ) : null}

      {config.prompt.ar || config.prompt.fr ? (
        // Prompt textuel (mots, phrases…) + bouton audio optionnel intégré
        <PromptCard
          ar={config.prompt.ar}
          fr={config.prompt.fr}
          audioUrl={config.audio_url}
          audioFallbackText={config.audio_fallback_text}
          defaultHarakats={defaultHarakats}
          defaultTranslation={defaultTranslation}
        />
      ) : (config.audio_url || config.audio_fallback_text) ? (
        // Pas de prompt texte → AudioButton seul (ex: exercice lettres)
        <View style={styles.promptBox}>
          <AudioButton
            audioUrl={config.audio_url}
            fallbackText={config.audio_fallback_text}
            autoPlay={true}
            size={40}
            style={styles.bigAudioBtn}
          />
        </View>
      ) : null}

      <View style={styles.options}>
        {options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            answered={answered}
            selected={selected}
            defaultHarakats={defaultHarakats}
            defaultTranslation={defaultTranslation}
            onSelect={handleSelect}
            getStyle={getOptionStyle}
            getTextStyle={getOptionTextStyle}
          />
        ))}
      </View>

      {answered ? (
        <View style={[styles.feedback, isCorrectAnswer ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={[styles.feedbackText, isCorrectAnswer ? styles.feedbackTextCorrect : styles.feedbackTextWrong]}>
            {isCorrectAnswer
              ? '✓ Bravo !'
              : `✗ La bonne réponse était : ${correctOption?.text.fr ?? correctOption?.text.ar ?? ''}`}
          </Text>
        </View>
      ) : null}
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

  promptBox: {
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  promptFr: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  revealHint: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
    opacity: 0.5,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  options: {
    gap: Spacing.md,
  },
  option: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  optionCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  optionWrong: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  optionDimmed: {
    opacity: 0.4,
  },
  optionText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionTextCorrect: { color: Colors.success },
  optionTextWrong: { color: Colors.error },
  optionTextDimmed: { color: Colors.textMuted },

  feedback: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  feedbackCorrect: { backgroundColor: Colors.successLight },
  feedbackWrong: { backgroundColor: Colors.errorLight },
  feedbackText: {
    fontSize: FontSizes.body,
    fontWeight: '700',
  },
  feedbackTextCorrect: { color: Colors.success },
  feedbackTextWrong: { color: Colors.error },

  bigAudioBtn: {
    alignSelf: 'center',
  },
});
