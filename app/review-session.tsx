// app/review-session.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useSRSCards, useUpdateSRSCard } from '../src/hooks/useSRSCards';
import { useLetters } from '../src/hooks/useLetters';
import { useDiacritics } from '../src/hooks/useDiacritics';
import { useWords } from '../src/hooks/useWords';
import { useSentences } from '../src/hooks/useSentences';
import {
  getCardsDueForReview,
  computeSRSUpdate,
  exerciseResultToQuality,
  flashcardResultToQuality,
  writeResultToQuality,
} from '../src/engines/srs';
import { applyConfusionPairCap } from '../src/engines/srs';
import { selectModesForSession } from '../src/engines/review-mode-selector';
import {
  generateFlashcardExercise,
  generateWriteExercise,
  generateMatchReviewExercise,
  generateMCQFromItemData,
  type ItemData,
} from '../src/engines/review-exercise-generator';
import { generateReviewExercise, generateDiacriticReviewExercise } from '../src/engines/review-exercise-generator';
import type { ExerciseConfig, ExerciseType } from '../src/types/exercise';
import type { ExerciseResult } from '../src/types/exercise';
import type { SRSCard } from '../src/engines/srs';
import type { ReviewSessionConfig, ExamQuestionResult } from '../src/types/review';
import { CONFUSION_PAIRS } from '../src/constants/confusion-pairs';
import { ExerciseRenderer } from '../src/components/exercises/ExerciseRenderer';
import { getSRSCardsByModules, getSRSCardsForUser } from '../src/db/local-queries';
import { updateStreak } from '../src/engines/streak';
import { addXP, calculateReviewXP } from '../src/engines/xp';
import { useTheme } from '../src/contexts/ThemeContext';
import { Button } from '../src/components/ui';
import { ExamResultScreen } from '../src/components/review/ExamResultScreen';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

// ─── resolveItemData ──────────────────────────────────────────────────────────

function resolveItemData(
  card: SRSCard,
  allLetters: any[],
  allDiacritics: any[],
  allWords: any[],
  allSentences: any[],
): ItemData | null {
  switch (card.item_type) {
    case 'letter': {
      const l = allLetters.find(x => x.id === card.item_id);
      if (!l) return null;
      return { arabic: l.form_isolated, french: l.name_fr, transliteration: l.transliteration, audio_url: l.audio_url };
    }
    case 'diacritic': {
      const d = allDiacritics.find(x => x.id === card.item_id);
      if (!d) return null;
      return { arabic: d.name_ar, french: d.name_fr, transliteration: d.transliteration };
    }
    case 'word': {
      const w = allWords.find(x => x.id === card.item_id);
      if (!w) return null;
      return { arabic: w.arabic_vocalized, french: w.translation_fr, transliteration: w.transliteration, audio_url: w.audio_url };
    }
    case 'sentence': {
      const s = allSentences.find(x => x.id === card.item_id);
      if (!s) return null;
      return { arabic: s.arabic_vocalized, french: s.translation_fr, transliteration: s.transliteration };
    }
    default:
      return null;
  }
}

// ─── buildExercise ─────────────────────────────────────────────────────────────

function buildExercise(
  card: SRSCard,
  itemData: ItemData,
  type: ExerciseType,
  distractors: ItemData[],
  direction: 'ar_to_fr' | 'fr_to_ar' | 'mixed',
  suppressFeedback: boolean,
  allLetters: any[],
  allDiacritics: any[],
): ExerciseConfig {
  const dir = direction === 'mixed'
    ? (Math.random() > 0.5 ? 'ar_to_fr' : 'fr_to_ar')
    : direction;

  let config: ExerciseConfig;

  if (type === 'flashcard') {
    config = generateFlashcardExercise(card, itemData, dir);
  } else if (type === 'write') {
    config = generateWriteExercise(card, itemData, dir);
  } else {
    // MCQ — utiliser anciens générateurs si letter/diacritic, sinon générique
    if (card.item_type === 'letter') {
      const letter = allLetters.find(l => l.id === card.item_id);
      if (letter) {
        config = generateReviewExercise(card, letter, allLetters);
      } else {
        config = generateMCQFromItemData(card, itemData, distractors, dir);
      }
    } else if (card.item_type === 'diacritic') {
      const diac = allDiacritics.find(d => d.id === card.item_id);
      if (diac) {
        config = generateDiacriticReviewExercise(card, diac, allDiacritics);
      } else {
        config = generateMCQFromItemData(card, itemData, distractors, dir);
      }
    } else {
      config = generateMCQFromItemData(card, itemData, distractors, dir);
    }
  }

  if (suppressFeedback) {
    config = { ...config, metadata: { ...config.metadata, suppressFeedback: true } };
  }
  return config;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ReviewSession() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ config?: string }>();
  const sessionConfig: ReviewSessionConfig = params.config
    ? JSON.parse(params.config) : { mode: 'daily' };

  const isExam = sessionConfig.free_options?.exam_mode ?? false;
  const isFreeMode = sessionConfig.mode === 'free';
  const direction = sessionConfig.free_options?.direction ?? 'ar_to_fr';
  const forcedType = sessionConfig.free_options?.forced_exercise_type ?? null;

  const userId = useAuthStore.getState().effectiveUserId();

  const { data: allCards = [] } = useSRSCards();
  const { data: allLetters = [] } = useLetters();
  const { data: allDiacritics = [] } = useDiacritics();
  const { data: allWords = [] } = useWords();
  const { data: allSentences = [] } = useSentences();
  const updateSRSCard = useUpdateSRSCard();
  const startTime = useMemo(() => Date.now(), []);

  const [freeCards, setFreeCards] = useState<SRSCard[] | null>(null);

  // Charger les cartes en mode free
  useEffect(() => {
    if (!isFreeMode || !userId) { setFreeCards([]); return; }
    (async () => {
      try {
        let cards: SRSCard[];
        const modIds = sessionConfig.free_options?.module_ids;
        if (modIds?.length) {
          cards = await getSRSCardsByModules(userId, modIds) as SRSCard[];
        } else {
          cards = await getSRSCardsForUser(userId) as SRSCard[];
        }
        const maxCards = sessionConfig.free_options?.max_cards ?? 20;
        cards = cards.sort(() => Math.random() - 0.5).slice(0, maxCards);
        setFreeCards(cards);
      } catch {
        setFreeCards([]);
      }
    })();
  }, [isFreeMode, userId]);

  const initialQueue = useMemo(() => {
    if (isFreeMode) return [];
    const capped = applyConfusionPairCap(allCards, CONFUSION_PAIRS);
    return getCardsDueForReview(capped);
  }, [allCards, isFreeMode]);

  const activeQueue = isFreeMode ? (freeCards ?? []) : initialQueue;

  // Mode selector par carte
  const modeMap = useMemo(() => {
    const audioMap = new Map<string, boolean>();
    allLetters.forEach(l => audioMap.set(l.id, !!l.audio_url));
    allWords.forEach(w => audioMap.set(w.id, !!w.audio_url));
    return selectModesForSession(activeQueue, audioMap);
  }, [activeQueue, allLetters, allWords]);

  // Groupage match : groupes de 4 par item_type
  const { singles, matchGroups } = useMemo(() => {
    const matchableTypes: SRSCard['item_type'][] = ['letter', 'diacritic'];
    const matchCards = activeQueue.filter(c =>
      !forcedType && modeMap.get(c.id) === 'match' && matchableTypes.includes(c.item_type)
    );

    // Grouper par item_type
    const byType = new Map<string, SRSCard[]>();
    for (const c of matchCards) {
      const arr = byType.get(c.item_type) ?? [];
      arr.push(c);
      byType.set(c.item_type, arr);
    }

    const groups: SRSCard[][] = [];
    const matchCardIds = new Set<string>();
    for (const [, cards] of byType) {
      for (let i = 0; i + 3 < cards.length; i += 4) {
        const group = cards.slice(i, i + 4);
        groups.push(group);
        group.forEach(c => matchCardIds.add(c.id));
      }
    }
    const singles = activeQueue.filter(c => !matchCardIds.has(c.id));
    return { singles, matchGroups: groups };
  }, [activeQueue, modeMap, forcedType]);

  // Queue de travail : singles d'abord, puis match groupés
  type WorkItem =
    | { kind: 'single'; card: SRSCard }
    | { kind: 'match'; cards: SRSCard[] };

  const workQueue = useMemo((): WorkItem[] => [
    ...singles.map(c => ({ kind: 'single' as const, card: c })),
    ...matchGroups.map(cards => ({ kind: 'match' as const, cards })),
  ], [singles, matchGroups]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [succeededCount, setSucceededCount] = useState(0);
  const [results, setResults] = useState<{ card: SRSCard; correct: boolean }[]>([]);
  const [examResults, setExamResults] = useState<ExamQuestionResult[]>([]);
  const [phase, setPhase] = useState<'session' | 'results'>('session');
  const totalCards = workQueue.length;

  function advanceToNext(_delay = 0) {
    const next = currentIndex + 1;
    if (next >= totalCards) {
      setPhase('results');
    } else {
      setCurrentIndex(next);
    }
  }

  function handleComplete(result: ExerciseResult) {
    const item = workQueue[currentIndex];
    if (!item) return;

    if (item.kind === 'single') {
      const card = item.card;
      const type = forcedType ?? modeMap.get(card.id) ?? 'mcq';

      let quality: number;
      if (type === 'flashcard') {
        quality = flashcardResultToQuality(result.user_answer as string, result.time_ms);
      } else if (type === 'write') {
        const isExact = result.attempts === 1 && result.correct;
        quality = writeResultToQuality(result.correct, isExact, result.time_ms);
      } else {
        quality = exerciseResultToQuality(result.correct, result.attempts, result.time_ms);
      }

      setResults(prev => [...prev, { card, correct: result.correct }]);

      if (isExam) {
        const exercise = currentExercise;
        setExamResults(prev => [...prev, {
          exercise_id: result.exercise_id,
          exercise_type: (exercise?.type ?? 'mcq') as ExerciseType,
          prompt_text: exercise?.prompt.ar ?? exercise?.prompt.fr ?? '',
          correct_answer: typeof exercise?.correct_answer === 'string'
            ? exercise.correct_answer
            : exercise?.write_accepted_answers?.[0]
            ?? exercise?.flashcard_back?.fr ?? exercise?.flashcard_back?.ar ?? '',
          user_answer: typeof result.user_answer === 'string' ? result.user_answer : '',
          is_correct: result.correct,
        }]);
        advanceToNext();
        return;
      }

      if (!isFreeMode) {
        const update = computeSRSUpdate(card, quality);
        updateSRSCard.mutate({ itemType: card.item_type, itemId: card.item_id, update });
      }

      if (quality < 3 && !isFreeMode) {
        // Remettre en queue
        setCurrentIndex(prev => prev + 1);
      } else {
        setSucceededCount(prev => prev + 1);
        advanceToNext();
      }
    } else {
      // Match groupé
      const quality = result.correct ? (result.time_ms < 30000 ? 5 : 4) : 2;
      item.cards.forEach(card => {
        setResults(prev => [...prev, { card, correct: result.correct }]);
        if (!isFreeMode && !isExam) {
          const update = computeSRSUpdate(card, quality);
          updateSRSCard.mutate({ itemType: card.item_type, itemId: card.item_id, update });
        }
      });
      setSucceededCount(prev => prev + item.cards.length);
      advanceToNext();
    }
  }

  // ── Résultats ─────────────────────────────────────────────
  if (phase === 'results') {
    if (isExam) {
      return (
        <ExamResultScreen
          results={examResults}
          onContinue={() => router.back()}
        />
      );
    }

    const correct = results.filter(r => r.correct).length;
    const wrong = results.length - correct;
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    const earnedXP = calculateReviewXP(totalCards);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.xl, alignItems: 'center', gap: spacing.xl }}>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary, textAlign: 'center' }}>
            Session terminée ! 🎉
          </Text>

          <View style={{
            backgroundColor: colors.background.group,
            borderRadius: borderRadius.xl,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.lg,
            alignItems: 'center',
            width: '100%',
            borderWidth: 1,
            borderColor: colors.border.subtle,
            gap: spacing.sm,
          }}>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: 56, color: colors.brand.primary, lineHeight: 64 }}>
              {totalCards}
            </Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary }}>
              cartes révisées
            </Text>
            {!isFreeMode && (
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.brand.primary, marginTop: spacing.xs }}>
                +{earnedXP} XP
              </Text>
            )}
          </View>

          <View style={{
            width: '100%',
            backgroundColor: colors.background.card,
            borderRadius: borderRadius.md,
            padding: spacing.base,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            gap: spacing.sm,
            ...shadows.subtle,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body }}>✓</Text>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.status.success }}>
                {correct} correctes
              </Text>
            </View>
            {wrong > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body }}>↻</Text>
                <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.accent.gold }}>
                  {wrong} à revoir
                </Text>
              </View>
            )}
          </View>

          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
            Temps : {formatTime(totalTime)}
          </Text>

          <Button
            label="Continuer →"
            variant="primary"
            onPress={() => {
              if (!isFreeMode) {
                addXP(earnedXP);
                updateStreak();
              }
              router.replace('/(tabs)/review' as never);
            }}
            style={{ width: '100%' }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Session ───────────────────────────────────────────────
  const item = workQueue[currentIndex];
  const dataReady = allLetters.length > 0 || allDiacritics.length > 0 || allWords.length > 0 || allSentences.length > 0;

  if (!item || !dataReady || (isFreeMode && freeCards === null)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary }}>
            Chargement…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Construire l'exercice
  let currentExercise: ExerciseConfig | null = null;

  if (item.kind === 'single') {
    const itemData = resolveItemData(item.card, allLetters, allDiacritics, allWords, allSentences);
    if (itemData) {
      const type = (forcedType ?? modeMap.get(item.card.id) ?? 'mcq') as ExerciseType;
      const distractors = (() => {
        const sameType = item.card.item_type;
        if (sameType === 'letter') {
          return allLetters
            .filter(l => l.id !== item.card.item_id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((l): ItemData => ({ arabic: l.form_isolated, french: l.name_fr }));
        }
        if (sameType === 'word') {
          return allWords
            .filter(w => w.id !== item.card.item_id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((w): ItemData => ({ arabic: w.arabic_vocalized, french: w.translation_fr }));
        }
        if (sameType === 'sentence') {
          return allSentences
            .filter(s => s.id !== item.card.item_id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((s): ItemData => ({ arabic: s.arabic_vocalized, french: s.translation_fr }));
        }
        return [];
      })();

      currentExercise = buildExercise(
        item.card, itemData, type, distractors,
        direction, isExam,
        allLetters, allDiacritics,
      );
    }
  } else {
    // Match groupé
    const itemsData = item.cards.map(c =>
      resolveItemData(c, allLetters, allDiacritics, allWords, allSentences)
    ).filter(Boolean) as ItemData[];
    if (itemsData.length >= 2) {
      currentExercise = generateMatchReviewExercise(item.cards, itemsData);
    }
  }

  // Exercice non constructible → skip
  if (!currentExercise) {
    setSucceededCount(prev => prev + 1);
    advanceToNext();
    return null;
  }

  const progress = succeededCount / Math.max(totalCards, 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.base,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, justifyContent: 'center' }} hitSlop={12}>
          <Text style={{ fontSize: 22, color: colors.text.secondary }}>×</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.primary }}>
          {isExam ? 'Examen' : 'Révision'} {succeededCount + 1} / {totalCards}
        </Text>
        <View style={{ width: 36, height: 36 }} />
      </View>

      {/* Barre de progression */}
      <View style={{ height: 4, backgroundColor: colors.background.group }}>
        <View style={{ height: 4, backgroundColor: colors.brand.primary, width: `${progress * 100}%` as any }} />
      </View>

      <ExerciseRenderer
        key={`${currentIndex}`}
        config={currentExercise}
        onComplete={handleComplete}
      />
    </SafeAreaView>
  );
}
