// app/lesson/[id]/exercises.tsx
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLesson } from '../../../src/hooks/useLessons';
import { useLetters, useLettersForLesson } from '../../../src/hooks/useLetters';
import { useDiacritics, useDiacriticsForLesson } from '../../../src/hooks/useDiacritics';
import { useWords, useSimpleWords } from '../../../src/hooks/useWords';
import { useRoots } from '../../../src/hooks/useRoots';
import { generateLetterExercises } from '../../../src/engines/exercise-generator';
import { generateHarakatExercises, LESSON_DIACRITIC_RANGES } from '../../../src/engines/harakat-exercise-generator';
import { generateWordExercises, LESSON_WORD_CONFIG, LESSON_ROOT_TRANSLITS } from '../../../src/engines/word-exercise-generator';
import { ExerciseRenderer } from '../../../src/components/exercises/ExerciseRenderer';
import type { ExerciseResult } from '../../../src/types/exercise';
import { useUpdateSRSCard, useSRSCards } from '../../../src/hooks/useSRSCards';
import { useQueryClient } from '@tanstack/react-query';
import { computeSRSUpdate, exerciseResultToQuality, createNewCard } from '../../../src/engines/srs';
import { useCompleteLesson } from '../../../src/hooks/useProgress';
import { useSettingsStore } from '../../../src/stores/useSettingsStore';
import { updateStreak } from '../../../src/engines/streak';
import { addXP, calculateLessonXP } from '../../../src/engines/xp';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../../../src/constants/theme';

const LESSON_LETTER_RANGES: Record<number, [number, number]> = {
  1: [1, 4], 2: [5, 7], 3: [8, 11], 4: [12, 15],
  5: [16, 19], 6: [20, 23], 7: [24, 28],
};

function getEncouragement(pct: number): string {
  if (pct === 100) return 'Parfait ! 🎉';
  if (pct >= 70) return 'Bien joué ! Continue comme ça.';
  return 'Pas mal ! Refais la leçon pour consolider.';
}

export default function ExercisesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [phase, setPhase] = useState<'exercises' | 'results'>('exercises');
  const [updatedStreakCurrent, setUpdatedStreakCurrent] = useState<number | null>(null);
  const startTime = useMemo(() => Date.now(), []);
  const queryClient = useQueryClient();
  const updateSRSCard = useUpdateSRSCard();
  const { data: srsCards } = useSRSCards();
  const updatedItemIds = useRef(new Set<string>());
  const completeLesson = useCompleteLesson();
  const exercise_direction = useSettingsStore((s) => s.exercise_direction);

  const { data: lesson } = useLesson(id ?? '');
  const moduleSortOrder = (lesson?.modules as { sort_order: number } | undefined)?.sort_order ?? 1;
  const contentType = moduleSortOrder === 2 ? 'diacritics' : moduleSortOrder === 3 ? 'words' : 'letters';

  // ── Module 1 : lettres ──────────────────────────────────────
  const range = contentType === 'letters' && lesson
    ? (LESSON_LETTER_RANGES[lesson.sort_order] ?? null)
    : null;
  const { data: lessonLetters } = useLettersForLesson(range?.[0] ?? 0, range?.[1] ?? 0);
  const { data: allLetters } = useLetters();

  // ── Module 2 : diacritiques ─────────────────────────────────
  const diacriticSortOrders = contentType === 'diacritics' && lesson
    ? (LESSON_DIACRITIC_RANGES[lesson.sort_order] ?? [])
    : [];
  const { data: lessonDiacritics } = useDiacriticsForLesson(diacriticSortOrders);
  const { data: allDiacritics } = useDiacritics();

  // ── Module 3 : mots et racines ──────────────────────────────
  const { data: allWords } = useWords();
  const { data: simpleWords } = useSimpleWords();
  const { data: allRoots } = useRoots();

  const lessonRoots = useMemo(() => {
    if (contentType !== 'words' || !lesson) return [];
    const translits = LESSON_ROOT_TRANSLITS[lesson.sort_order] ?? [];
    return (allRoots ?? []).filter(r => translits.includes(r.transliteration));
  }, [allRoots, contentType, lesson?.sort_order]);

  const lessonWords = useMemo(() => {
    if (contentType !== 'words' || !lesson) return [];
    const wordConfig = LESSON_WORD_CONFIG[lesson.sort_order];
    if (!wordConfig) return [];

    if (wordConfig.type === 'simple' || wordConfig.type === 'solar_lunar') {
      return simpleWords ?? [];
    }
    if (wordConfig.type === 'root') {
      const rootIds = lessonRoots.map(r => r.id);
      return (allWords ?? []).filter(w => w.root_id && rootIds.includes(w.root_id));
    }
    return allWords ?? []; // revision
  }, [contentType, lesson?.sort_order, simpleWords, allWords, lessonRoots]);

  // Déclencher streak + XP + SRS dès l'entrée en phase résultats
  useEffect(() => {
    if (phase !== 'results') return;
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const baseXP = (lesson?.xp_reward as number | undefined) ?? 20;
    const xp = calculateLessonXP(baseXP, pct);
    addXP(xp);
    updateStreak().then((data) => {
      if (data) setUpdatedStreakCurrent(data.streak_current);
    });

    if (contentType === 'diacritics' && lessonDiacritics && lessonDiacritics.length > 0) {
      createSRSCardsForItems(lessonDiacritics.map((d) => d.id), 'diacritic').then(() => {
        queryClient.invalidateQueries({ queryKey: ['srs_cards'] });
      });
    }

    if (contentType === 'words' && lessonWords.length > 0) {
      createSRSCardsForItems(lessonWords.map((w) => w.id), 'word').then(() => {
        queryClient.invalidateQueries({ queryKey: ['srs_cards'] });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Génération des exercices ────────────────────────────────
  const exercises = useMemo(() => {
    if (contentType === 'letters') {
      if (!lessonLetters || !allLetters) return [];
      return generateLetterExercises(lessonLetters, allLetters, exercise_direction);
    }
    if (contentType === 'diacritics') {
      if (!lessonDiacritics || !allDiacritics || !lesson) return [];
      return generateHarakatExercises(
        lesson.sort_order,
        lessonDiacritics,
        allDiacritics,
        allLetters ?? [],
      );
    }
    // words
    if (!lesson || !allRoots) return [];
    return generateWordExercises(lesson.sort_order, lessonWords, allWords ?? [], allRoots);
  }, [lessonLetters, allLetters, lessonDiacritics, allDiacritics, lesson, contentType, exercise_direction, lessonWords, allWords, allRoots]);

  function handleComplete(result: ExerciseResult) {
    const newResults = [...results, result];
    setResults(newResults);

    // Mettre à jour la carte SRS pour les lettres
    if (contentType === 'letters') {
      const currentExercise = exercises[currentIndex];
      const letterId = currentExercise?.metadata?.letter_id as string | undefined;
      if (letterId && srsCards && !updatedItemIds.current.has(letterId)) {
        const card = srsCards.find((c) => c.item_id === letterId);
        if (card) {
          updatedItemIds.current.add(letterId);
          const quality = exerciseResultToQuality(result.correct, result.attempts, result.time_ms);
          const update = computeSRSUpdate(card, quality);
          updateSRSCard.mutate({ itemType: 'letter', itemId: letterId, update });
        }
      }
    }

    // Mettre à jour la carte SRS pour les mots
    if (contentType === 'words') {
      const currentExercise = exercises[currentIndex];
      const wordId = currentExercise?.metadata?.word_id as string | undefined;
      if (wordId && srsCards && !updatedItemIds.current.has(wordId)) {
        const card = srsCards.find((c) => c.item_id === wordId && c.item_type === 'word');
        if (card) {
          updatedItemIds.current.add(wordId);
          const quality = exerciseResultToQuality(result.correct, result.attempts, result.time_ms);
          const update = computeSRSUpdate(card, quality);
          updateSRSCard.mutate({ itemType: 'word', itemId: wordId, update });
        }
      }
    }

    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setPhase('results');
    }
  }

  // ── Écran de résultats ─────────────────────────────────────
  if (phase === 'results') {
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    const baseXP = (lesson?.xp_reward as number | undefined) ?? 20;
    const earnedXP = calculateLessonXP(baseXP, pct);
    const isPerfect = pct >= 100;

    function handleContinue() {
      if (id) {
        completeLesson.mutate({
          lessonId: id as string,
          score: pct,
          timeSpentSeconds: totalTime,
        });
      }
      router.replace('/(tabs)/learn');
    }

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <Text style={styles.resultsTitle}>Leçon terminée !</Text>
          <Text style={styles.encouragement}>{getEncouragement(pct)}</Text>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreNumber}>{correct}/{total}</Text>
            <Text style={styles.scoreLabel}>bonnes réponses</Text>
            <View style={styles.scoreBarTrack}>
              <View style={[styles.scoreBarFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.scorePct}>{pct}%</Text>
          </View>

          <View style={styles.xpBox}>
            <Text style={styles.xpText}>
              {isPerfect ? `+${earnedXP} XP 🎯` : `+${earnedXP} XP`}
            </Text>
            {isPerfect && (
              <Text style={styles.xpBonus}>Bonus score parfait ×1,5 !</Text>
            )}
            {updatedStreakCurrent !== null && (
              <Text style={styles.streakText}>🔥 Streak : {updatedStreakCurrent} jour{updatedStreakCurrent > 1 ? 's' : ''}</Text>
            )}
          </View>

          <Text style={styles.timeText}>
            Temps total : {totalTime < 60 ? `${totalTime}s` : `${Math.floor(totalTime / 60)}min ${totalTime % 60}s`}
          </Text>

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaLabel}>Continuer →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Écran d'exercice ───────────────────────────────────────
  const currentExercise = exercises[currentIndex];

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loader}>
          <Text style={styles.loadingText}>Génération des exercices…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercice {currentIndex + 1} / {exercises.length}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((currentIndex) / exercises.length) * 100}%` }]} />
      </View>

      <ExerciseRenderer key={currentExercise.id} config={currentExercise} onComplete={handleComplete} />
    </SafeAreaView>
  );
}

/** Crée les cartes SRS pour un lot d'items (diacritics ou words) dans SQLite local */
async function createSRSCardsForItems(itemIds: string[], itemType: 'diacritic' | 'word'): Promise<void> {
  const { useAuthStore } = await import('../../../src/stores/useAuthStore');
  const userId = useAuthStore.getState().userId;
  if (!userId) return;

  const { upsertSRSCard } = await import('../../../src/db/local-queries');
  for (const itemId of itemIds) {
    const card = createNewCard(userId, itemType, itemId);
    await upsertSRSCard({
      id: `${userId}-${itemType}-${itemId}`,
      ...card,
    });
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FontSizes.body, color: Colors.textSecondary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backArrow: { fontSize: 22, color: Colors.textSecondary },
  headerTitle: { fontSize: FontSizes.caption, fontWeight: '600', color: Colors.textPrimary },

  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: Layout.screenPaddingH,
    marginTop: Spacing.sm,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },

  resultsScroll: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.xl,
  },
  resultsTitle: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  encouragement: {
    fontSize: FontSizes.heading,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing['3xl'],
    alignItems: 'center',
    width: '100%',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 64,
  },
  scoreLabel: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  scoreBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  scorePct: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    color: Colors.primary,
  },
  xpBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  xpText: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    color: Colors.primary,
  },
  xpBonus: {
    fontSize: FontSizes.caption,
    color: Colors.primary,
  },
  streakText: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timeText: {
    fontSize: FontSizes.caption,
    color: Colors.textMuted,
  },
  ctaBtn: {
    width: '100%',
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  ctaLabel: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
});
