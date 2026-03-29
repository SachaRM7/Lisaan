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
import { useWords, useSimpleWords, useWordsByTheme } from '../../../src/hooks/useWords';
import { useRoots } from '../../../src/hooks/useRoots';
import { useSentences } from '../../../src/hooks/useSentences';
import { useDialogues, useDialogueWithTurns } from '../../../src/hooks/useDialogues';
import { generateLetterExercises } from '../../../src/engines/exercise-generator';
import { generateHarakatExercises, LESSON_DIACRITIC_RANGES } from '../../../src/engines/harakat-exercise-generator';
import { generateWordExercises, LESSON_WORD_CONFIG } from '../../../src/engines/word-exercise-generator';
import { generateSentenceExercises, LESSON_SENTENCE_CONFIG } from '../../../src/engines/sentence-exercise-generator';
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
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Button } from '../../../src/components/ui';
import { XPFloatingLabel } from '../../../src/components/XPFloatingLabel';
import { BadgeUnlockModal } from '../../../src/components/BadgeUnlockModal';
import { StreakCelebration } from '../../../src/components/StreakCelebration';
import { Ionicons } from '@expo/vector-icons';
import { useBadges } from '../../../src/hooks/useBadges';
import { BadgeUnlock } from '../../../src/engines/badge-engine';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import {
  getCompletedLessonsCount,
  checkIfModuleComplete,
  getModuleStats,
} from '../../../src/db/local-queries';
import { track } from '../../../src/analytics/posthog';

const LESSON_LETTER_RANGES: Record<number, [number, number]> = {
  1: [1, 4], 2: [5, 7], 3: [8, 11], 4: [12, 15],
  5: [16, 19], 6: [20, 23], 7: [24, 28],
};

function getEncouragement(pct: number): string {
  if (pct === 100) return 'Parfait !';
  if (pct >= 70) return 'Bien joué !';
  return 'Continue tes efforts !';
}

export default function ExercisesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
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
  const { checkBadges } = useBadges();
  const [showXP, setShowXP] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<BadgeUnlock | null>(null);
  const pendingBadges = useRef<BadgeUnlock[]>([]);
  const [showStreak, setShowStreak] = useState(false);

  const { data: lesson } = useLesson(id ?? '');
  const moduleSortOrder = (lesson?.modules as { sort_order: number } | undefined)?.sort_order ?? 1;
  const contentType = moduleSortOrder === 2 ? 'diacritics'
    : moduleSortOrder === 3 ? 'words'
    : moduleSortOrder === 4 ? 'sentences'
    : 'letters';

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

  // ── Module 4 : phrases et dialogues ─────────────────────────
  const { data: allSentences } = useSentences();
  const { data: allDialogues } = useDialogues();

  const sentenceConfig = contentType === 'sentences' && lesson
    ? LESSON_SENTENCE_CONFIG[lesson.sort_order]
    : null;

  const dial0Id = sentenceConfig?.dialogueIds?.[0] ?? null;
  const dial1Id = sentenceConfig?.dialogueIds?.[1] ?? null;
  const dial2Id = sentenceConfig?.dialogueIds?.[2] ?? null;
  const { data: dial0 } = useDialogueWithTurns(dial0Id);
  const { data: dial1 } = useDialogueWithTurns(dial1Id);
  const { data: dial2 } = useDialogueWithTurns(dial2Id);

  const wordTheme = useMemo(() => {
    if (contentType !== 'words' || !lesson) return null;
    const wordConfig = LESSON_WORD_CONFIG[lesson.sort_order];
    return wordConfig?.type === 'theme' ? (wordConfig.theme ?? null) : null;
  }, [contentType, lesson?.sort_order]);

  const { data: themeWords } = useWordsByTheme(wordTheme);

  const lessonWords = useMemo(() => {
    if (contentType !== 'words' || !lesson) return [];
    const wordConfig = LESSON_WORD_CONFIG[lesson.sort_order];
    if (!wordConfig) return [];

    if (wordConfig.type === 'simple' || wordConfig.type === 'solar_lunar') {
      return simpleWords ?? [];
    }
    if (wordConfig.type === 'theme') {
      return themeWords ?? [];
    }
    return allWords ?? []; // revision
  }, [contentType, lesson?.sort_order, simpleWords, allWords, themeWords]);

  // Déclencher streak + XP + SRS dès l'entrée en phase résultats
  useEffect(() => {
    if (phase !== 'results') return;
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const baseXP = (lesson?.xp_reward as number | undefined) ?? 20;
    const xp = calculateLessonXP(baseXP, pct);

    track('lesson_completed', {
      lesson_id: id,
      module_id: lesson?.module_id,
      score: pct,
      time_seconds: Math.round((Date.now() - startTime) / 1000),
      xp_earned: xp,
      is_perfect: pct === 100,
    });
    addXP(xp);
    setShowXP(true);
    updateStreak().then((data) => {
      if (data) {
        setUpdatedStreakCurrent(data.streak_current);
        const milestones = [3, 7, 14, 30];
        if (milestones.includes(data.streak_current)) {
          setShowStreak(true);
        }
      }
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

    if (contentType === 'sentences' && sentenceConfig) {
      const ids = sentenceConfig.sentenceIds ?? [];
      const sentenceIds = sentenceConfig.type === 'fill_blank'
        ? (allSentences ?? []).filter(s => s.difficulty <= 2).map(s => s.id)
        : ids;
      if (sentenceIds.length > 0) {
        createSRSCardsForItems(sentenceIds, 'sentence').then(() => {
          queryClient.invalidateQueries({ queryKey: ['srs_cards'] });
        });
      }
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
    if (contentType === 'words') {
      if (!lesson || !allRoots) return [];
      return generateWordExercises(lesson.sort_order, lessonWords, allWords ?? [], allRoots);
    }

    // sentences
    if (!lesson || !sentenceConfig) return [];
    const ids = sentenceConfig.sentenceIds ?? [];
    const lessonSentences = sentenceConfig.type === 'fill_blank'
      ? (allSentences ?? []).filter(s => s.difficulty <= 2)
      : (allSentences ?? []).filter(s => ids.includes(s.id));
    const dialoguesWithTurns = sentenceConfig.dialogueIds
      ? [dial0, dial1, dial2].filter(Boolean) as any[]
      : undefined;
    return generateSentenceExercises(
      lesson.sort_order,
      lessonSentences,
      allSentences ?? [],
      allWords ?? [],
      dialoguesWithTurns,
    );
  }, [lessonLetters, allLetters, lessonDiacritics, allDiacritics, lesson, contentType, exercise_direction,
      lessonWords, allWords, allRoots, allSentences, sentenceConfig, dial0, dial1, dial2]);

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

    // Mettre à jour la carte SRS pour les phrases
    if (contentType === 'sentences') {
      const currentExercise = exercises[currentIndex];
      const sentenceId = currentExercise?.metadata?.sentence_id as string | undefined;
      if (sentenceId && srsCards && !updatedItemIds.current.has(sentenceId)) {
        const card = srsCards.find((c) => c.item_id === sentenceId && c.item_type === 'sentence');
        if (card) {
          updatedItemIds.current.add(sentenceId);
          const quality = exerciseResultToQuality(result.correct, result.attempts, result.time_ms);
          const update = computeSRSUpdate(card, quality);
          updateSRSCard.mutate({ itemType: 'sentence', itemId: sentenceId, update });
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

    async function handleContinue() {
      if (!id) { router.replace('/(tabs)/learn'); return; }
      const userId = useAuthStore.getState().effectiveUserId();

      // 1. Marquer la leçon complétée
      await completeLesson.mutateAsync({
        lessonId: id as string,
        score: pct,
        timeSpentSeconds: totalTime,
      });

      if (!userId) { router.replace('/(tabs)/learn'); return; }

      // 2. Vérifier si le module est complété
      const moduleId = lesson?.module_id;
      const isModuleComplete = moduleId
        ? await checkIfModuleComplete(moduleId, userId)
        : false;

      // 3. Vérifier les nouveaux badges
      const completedCount = await getCompletedLessonsCount(userId);
      const newBadges = await checkBadges({
        lessonCount: completedCount,
        completedModuleId: isModuleComplete && moduleId ? moduleId : undefined,
        isPerfectScore: pct === 100,
        streakDays: updatedStreakCurrent ?? undefined,
      });

      // 4. Module complété → écran de célébration
      if (isModuleComplete && moduleId) {
        const stats = await getModuleStats(moduleId, userId);
        router.replace({
          pathname: '/module-complete',
          params: {
            moduleTitle: stats.title_fr,
            moduleTitleAr: stats.title_ar ?? '',
            moduleNumber: stats.sort_order.toString(),
            moduleIcon: stats.icon,
            totalXP: stats.total_xp.toString(),
            lessonsCount: stats.lessons_count.toString(),
            timeMinutes: Math.round(stats.total_seconds / 60).toString(),
          },
        } as any);
        return;
      }

      // 5. Badges à afficher en file d'attente
      if (newBadges.length > 0) {
        pendingBadges.current = [...newBadges];
        setCurrentBadge(pendingBadges.current.shift() ?? null);
      } else {
        router.replace('/(tabs)/learn');
      }
    }

    function handleBadgeDismiss() {
      const next = pendingBadges.current.shift();
      if (next) {
        setCurrentBadge(next);
      } else {
        setCurrentBadge(null);
        router.replace('/(tabs)/learn');
      }
    }

    const streakDays = updatedStreakCurrent ?? 0;
    const timeLabel = totalTime < 60 ? `${totalTime}s` : `${Math.floor(totalTime / 60)}min ${totalTime % 60}s`;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        <XPFloatingLabel
          xp={earnedXP}
          visible={showXP}
          onAnimationEnd={() => setShowXP(false)}
        />
        <StreakCelebration
          streakDays={streakDays}
          visible={showStreak}
          onHide={() => setShowStreak(false)}
        />
        <BadgeUnlockModal badge={currentBadge} onDismiss={handleBadgeDismiss} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 48, alignItems: 'center', gap: 16 }}>

          {/* Médaillon doré */}
          <View style={{
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: colors.background.card,
            borderWidth: 2, borderColor: colors.accent.gold,
            alignItems: 'center', justifyContent: 'center',
            ...shadows.medium,
          }}>
            <Ionicons name="star" size={48} color={colors.accent.gold} />
          </View>

          {/* Titre */}
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary }}>
            Leçon Terminée !
          </Text>

          {/* Sous-titre conditionnel */}
          <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.brand.primary, textAlign: 'center' }}>
            {getEncouragement(pct)}
          </Text>

          {/* Carte score */}
          <View style={{
            width: '100%', backgroundColor: colors.background.card,
            borderRadius: borderRadius.md, padding: 24,
            alignItems: 'center', gap: 8,
            ...shadows.subtle,
          }}>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.brand.primary }}>
              {correct}/{total}
            </Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
              bonnes réponses
            </Text>
            <View style={{ width: '100%', height: 6, backgroundColor: colors.background.group, borderRadius: 9999, overflow: 'hidden', marginTop: 8 }}>
              <View style={{ height: '100%', width: `${pct}%`, backgroundColor: colors.brand.primary, borderRadius: 9999 }} />
            </View>
            <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.brand.primary }}>
              {pct}%
            </Text>
          </View>

          {/* Carte stats XP + Streak */}
          <View style={{
            width: '100%', backgroundColor: colors.background.group,
            borderRadius: borderRadius.md, padding: 16,
            flexDirection: 'row',
            ...shadows.subtle,
          }}>
            <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={20} color={colors.brand.primary} />
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.brand.dark }}>
                +{earnedXP} XP
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border.subtle }} />
            <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Ionicons name="flame" size={20} color={colors.accent.gold} />
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.brand.dark }}>
                {streakDays} jour{streakDays !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Temps */}
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
            Temps total : {timeLabel}
          </Text>

          {/* CTA */}
          <Button
            label="Continuer →"
            variant="primary"
            onPress={handleContinue}
            style={{ width: '100%', marginTop: 8 }}
          />
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
async function createSRSCardsForItems(itemIds: string[], itemType: 'diacritic' | 'word' | 'sentence'): Promise<void> {
  const { useAuthStore } = await import('../../../src/stores/useAuthStore');
  const userId = useAuthStore.getState().effectiveUserId();
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
