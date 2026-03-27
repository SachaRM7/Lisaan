// app/lesson/[id].tsx
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

// ── Hooks data ───────────────────────────────────────────────
import { useLesson } from '../../src/hooks/useLessons';
import { useLetters, useLettersForLesson } from '../../src/hooks/useLetters';
import { useDiacritics, useDiacriticsForLesson } from '../../src/hooks/useDiacritics';
import { useWords, useSimpleWords, useWordsByTheme } from '../../src/hooks/useWords';
import { useRoots } from '../../src/hooks/useRoots';
import { useSentences } from '../../src/hooks/useSentences';
import { useDialogues, useDialogueWithTurns } from '../../src/hooks/useDialogues';
import { useGrammarRules } from '../../src/hooks/useGrammarRules';
import { useConjugationsByWords } from '../../src/hooks/useConjugations';
import { useUpdateSRSCard, useSRSCards } from '../../src/hooks/useSRSCards';
import { useCompleteLesson } from '../../src/hooks/useProgress';
import { useBadges } from '../../src/hooks/useBadges';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';

// ── Generators ───────────────────────────────────────────────
import { generateLetterLessonSections } from '../../src/engines/exercise-generator';
import { generateHarakatLessonSections, LESSON_DIACRITIC_RANGES } from '../../src/engines/harakat-exercise-generator';
import { generateWordLessonSections, LESSON_WORD_CONFIG } from '../../src/engines/word-exercise-generator';
import { generateSentenceLessonSections, LESSON_SENTENCE_CONFIG } from '../../src/engines/sentence-exercise-generator';
import { generateGrammarExercises } from '../../src/engines/grammar-exercise-generator';
import { generateConjugationExercises } from '../../src/engines/conjugation-exercise-generator';

// ── Engines ──────────────────────────────────────────────────
import { computeSRSUpdate, exerciseResultToQuality, createNewCard } from '../../src/engines/srs';
import { updateStreak } from '../../src/engines/streak';
import { addXP, calculateLessonXP } from '../../src/engines/xp';
import { track } from '../../src/analytics/posthog';

// ── DB ───────────────────────────────────────────────────────
import {
  getLessonSession,
  upsertLessonSession,
  deleteLessonSession,
  getLessonProgress,
  getCompletedLessonsCount,
  checkIfModuleComplete,
  getModuleStats,
} from '../../src/db/local-queries';

// ── Components ───────────────────────────────────────────────
import { SectionPlayer } from '../../src/components/lesson/SectionPlayer';
import { LessonHub } from '../../src/components/lesson/LessonHub';
import { XPFloatingLabel } from '../../src/components/XPFloatingLabel';
import { BadgeUnlockModal } from '../../src/components/BadgeUnlockModal';
import { StreakCelebration } from '../../src/components/StreakCelebration';

// ── Types ────────────────────────────────────────────────────
import type { LessonSections } from '../../src/types/section';
import type { LessonSessionState, SectionProgress } from '../../src/types/section';
import type { ExerciseResult } from '../../src/types/exercise';
import { BadgeUnlock } from '../../src/engines/badge-engine';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../../src/constants/theme';

// ── Constants ────────────────────────────────────────────────
const LESSON_LETTER_RANGES: Record<number, [number, number]> = {
  1: [1, 4], 2: [5, 7], 3: [8, 11], 4: [12, 15],
  5: [16, 19], 6: [20, 23], 7: [24, 28],
};

const MODULE_GRAMMAR_ID    = 'a1000000-0000-0000-0000-000000000005';
const MODULE_CONJUGATION_ID = 'a1000000-0000-0000-0000-000000000006';

type LessonScreenMode = 'loading' | 'hub' | 'playing' | 'lesson_complete';

function getEncouragement(pct: number): string {
  if (pct === 100) return 'Parfait ! 🎉';
  if (pct >= 70) return 'Bien joué ! Continue comme ça.';
  return 'Pas mal ! Refais la leçon pour consolider.';
}

// ── Composant principal ───────────────────────────────────────

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  // ── Mode & session ───────────────────────────────────────
  const [mode, setMode] = useState<LessonScreenMode>('loading');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sessionState, setSessionState] = useState<LessonSessionState | null>(null);
  const [lessonStatus, setLessonStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [replayMode, setReplayMode] = useState<'teaching_only' | 'exercises_only' | undefined>();
  const [playerKey, setPlayerKey] = useState(0);

  // ── Résultat final ───────────────────────────────────────
  const [finalScore, setFinalScore] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [finalSectionProgress, setFinalSectionProgress] = useState<SectionProgress[]>([]);
  const startTime = useRef(Date.now());

  // ── XP / Badges / Streak ─────────────────────────────────
  const [showXP, setShowXP] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [updatedStreakCurrent, setUpdatedStreakCurrent] = useState<number | null>(null);
  const [showStreak, setShowStreak] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<BadgeUnlock | null>(null);
  const pendingBadges = useRef<BadgeUnlock[]>([]);

  // ── Hooks ────────────────────────────────────────────────
  const { data: lesson, isLoading: lessonLoading } = useLesson(id ?? '');
  const moduleSortOrder = (lesson?.modules as { sort_order: number } | undefined)?.sort_order ?? 1;
  const moduleId = lesson?.module_id ?? '';
  const contentType: LessonSections['contentType'] =
    moduleId === MODULE_GRAMMAR_ID    ? 'grammar'      :
    moduleId === MODULE_CONJUGATION_ID ? 'conjugation'  :
    moduleSortOrder === 2 ? 'diacritics' :
    moduleSortOrder === 3 ? 'words'      :
    moduleSortOrder === 4 ? 'sentences'  :
    'letters';

  // content_refs : IDs des règles / mots liés à cette leçon
  const contentRefs: string[] = useMemo(() => {
    try { return JSON.parse(lesson?.content_refs ?? '[]'); } catch { return []; }
  }, [lesson?.content_refs]);

  const exercise_direction = useSettingsStore((s) => s.exercise_direction);
  const updateSRSCard = useUpdateSRSCard();
  const { data: srsCards } = useSRSCards();
  const updatedItemIds = useRef(new Set<string>());
  const completeLesson = useCompleteLesson();
  const { checkBadges } = useBadges();

  // ── Module 1 : lettres ───────────────────────────────────
  const letterRange = contentType === 'letters' && lesson
    ? (LESSON_LETTER_RANGES[lesson.sort_order] ?? null)
    : null;
  const { data: lessonLetters, isLoading: lettersLoading } = useLettersForLesson(
    letterRange?.[0] ?? 0,
    letterRange?.[1] ?? 0,
  );
  const { data: allLetters } = useLetters();

  // ── Module 2 : diacritiques ──────────────────────────────
  const diacriticSortOrders = contentType === 'diacritics' && lesson
    ? (LESSON_DIACRITIC_RANGES[lesson.sort_order] ?? [])
    : [];
  const { data: lessonDiacritics, isLoading: diacriticsLoading } = useDiacriticsForLesson(diacriticSortOrders);
  const { data: allDiacritics } = useDiacritics();

  // ── Module 3 : mots ──────────────────────────────────────
  const { data: allRoots, isLoading: rootsLoading } = useRoots();
  const { data: allWords } = useWords();
  const { data: simpleWords, isLoading: simpleWordsLoading } = useSimpleWords();

  const wordTheme = useMemo(() => {
    if (contentType !== 'words' || !lesson) return null;
    const wordConfig = LESSON_WORD_CONFIG[lesson.sort_order];
    return wordConfig?.type === 'theme' ? (wordConfig.theme ?? null) : null;
  }, [contentType, lesson?.sort_order]);
  const { data: themeWords, isLoading: themeWordsLoading } = useWordsByTheme(wordTheme);

  const lessonWords = useMemo(() => {
    if (contentType !== 'words' || !lesson) return [];
    const wordConfig = LESSON_WORD_CONFIG[lesson.sort_order];
    if (!wordConfig) return [];
    if (wordConfig.type === 'simple' || wordConfig.type === 'solar_lunar') return simpleWords ?? [];
    if (wordConfig.type === 'theme') return themeWords ?? [];
    return allWords ?? [];
  }, [contentType, lesson?.sort_order, simpleWords, allWords, themeWords]);

  // ── Module 5 : grammaire ─────────────────────────────────
  const { rules: grammarRules, loading: grammarLoading } = useGrammarRules(
    contentType === 'grammar' ? moduleId : ''
  );

  // ── Module 6 : conjugaison ───────────────────────────────
  const { conjugations: lessonConjugations, loading: conjugationsLoading } = useConjugationsByWords(
    contentType === 'conjugation' ? contentRefs : [],
    'past'
  );
  const { conjugations: allConjugations } = useConjugationsByWords(
    contentType === 'conjugation' ? [
      'd0000000-0000-0000-0000-000000000001',
      'd0000000-0000-0000-0000-000000000002',
      'd0000000-0000-0000-0000-000000000003',
      'd0000000-0000-0000-0000-000000000004',
      'd0000000-0000-0000-0000-000000000005',
      'd0000000-0000-0000-0000-000000000006',
    ] : [],
    'past'
  );

  // ── Module 4 : phrases ───────────────────────────────────
  const { data: allSentences, isLoading: sentencesLoading, refetch: refetchSentences } = useSentences();
  const { data: allDialogues, isLoading: dialoguesLoading } = useDialogues();
  const [forceSyncing, setForceSyncing] = useState(false);
  const syncAttempted = useRef(false);

  const sentenceConfig = contentType === 'sentences' && lesson
    ? LESSON_SENTENCE_CONFIG[lesson.sort_order]
    : null;
  const dial0Id = sentenceConfig?.dialogueIds?.[0] ?? null;
  const dial1Id = sentenceConfig?.dialogueIds?.[1] ?? null;
  const dial2Id = sentenceConfig?.dialogueIds?.[2] ?? null;
  const { data: dial0 } = useDialogueWithTurns(dial0Id);
  const { data: dial1 } = useDialogueWithTurns(dial1Id);
  const { data: dial2 } = useDialogueWithTurns(dial2Id);

  const lessonSentences = useMemo(() => {
    if (contentType !== 'sentences' || !sentenceConfig) return [];
    const ids = sentenceConfig.sentenceIds ?? [];
    if (sentenceConfig.type === 'fill_blank') {
      return (allSentences ?? []).filter(s => s.difficulty <= 2);
    }
    return (allSentences ?? []).filter(s => ids.includes(s.id));
  }, [contentType, sentenceConfig, allSentences]);

  const dialoguesWithTurns = useMemo(() => {
    return [dial0, dial1, dial2].filter(Boolean) as any[];
  }, [dial0, dial1, dial2]);

  // ── isLoading ────────────────────────────────────────────
  const isLoading = lessonLoading || lettersLoading || diacriticsLoading
    || (contentType === 'words' && (rootsLoading || simpleWordsLoading || themeWordsLoading))
    || (contentType === 'sentences' && (sentencesLoading || dialoguesLoading || forceSyncing))
    || (contentType === 'grammar' && grammarLoading)
    || (contentType === 'conjugation' && conjugationsLoading);

  // ── Force sync sentences si vides ────────────────────────
  useEffect(() => {
    if (contentType !== 'sentences' || sentencesLoading) return;
    if ((!allSentences || allSentences.length === 0) && !syncAttempted.current) {
      syncAttempted.current = true;
      setForceSyncing(true);
      import('../../src/engines/content-sync').then(({ syncContentFromCloud }) =>
        syncContentFromCloud()
          .then(() => refetchSentences())
          .finally(() => setForceSyncing(false))
      );
    }
  }, [contentType, sentencesLoading, allSentences]);

  // ── Génération des sections ───────────────────────────────
  const lessonSections = useMemo<LessonSections>(() => {
    if (contentType === 'letters') {
      if (!lessonLetters?.length || !allLetters?.length) return { contentType: 'letters', sections: [] };
      return generateLetterLessonSections(lessonLetters, allLetters, exercise_direction);
    }
    if (contentType === 'diacritics') {
      if (!lessonDiacritics?.length || !allDiacritics?.length || !lesson) return { contentType: 'diacritics', sections: [] };
      return generateHarakatLessonSections(lesson.sort_order, lessonDiacritics, allDiacritics, allLetters ?? []);
    }
    if (contentType === 'words') {
      if (!lesson || !allRoots) return { contentType: 'words', sections: [] };
      return generateWordLessonSections(lesson.sort_order, lessonWords, allWords ?? [], allRoots);
    }
    if (contentType === 'grammar') {
      if (!grammarRules.length) return { contentType: 'grammar', sections: [] };
      const lessonRules = contentRefs.length
        ? grammarRules.filter(r => contentRefs.includes(r.id))
        : grammarRules;
      if (!lessonRules.length) return { contentType: 'grammar', sections: [] };
      const exercises = generateGrammarExercises(lessonRules);
      return {
        contentType: 'grammar',
        sections: [{ id: 'section-grammar-0', index: 0, title_fr: lessonRules[0].title_fr, teachingItemIds: lessonRules.map(r => r.id), exercises }],
      };
    }
    if (contentType === 'conjugation') {
      if (!lessonConjugations.length) return { contentType: 'conjugation', sections: [] };
      const wordIds = [...new Set(lessonConjugations.map(e => e.word_id))];
      const allVerbEntries = allConjugations.length ? allConjugations : lessonConjugations;
      const exercises = wordIds.flatMap(wid =>
        generateConjugationExercises(wid, lessonConjugations.filter(e => e.word_id === wid), allVerbEntries)
      );
      return {
        contentType: 'conjugation',
        sections: [{ id: 'section-conj-0', index: 0, title_fr: lesson?.title_fr ?? 'Conjugaison', teachingItemIds: wordIds, exercises }],
      };
    }
    // sentences
    if (!lesson || !sentenceConfig) return { contentType: 'sentences', sections: [] };
    return generateSentenceLessonSections(
      lesson.sort_order, lessonSentences, allSentences ?? [], allWords ?? [], dialoguesWithTurns,
    );
  }, [contentType, lesson, lessonLetters, allLetters, exercise_direction,
      lessonDiacritics, allDiacritics, lessonWords, allWords, allRoots,
      lessonSentences, allSentences, sentenceConfig, dialoguesWithTurns,
      grammarRules, contentRefs, lessonConjugations, allConjugations]);

  // ── Init : détecter mode au chargement ───────────────────
  const initDone = useRef(false);
  useEffect(() => {
    if (isLoading || !lesson || !userId || lessonSections.sections.length === 0 || initDone.current) return;
    initDone.current = true;

    async function init() {
      const lessonId = id ?? '';
      const [progress, session] = await Promise.all([
        getLessonProgress(lessonId, userId!),
        getLessonSession(lessonId, userId!),
      ]);

      const status = (progress?.status ?? 'not_started') as 'not_started' | 'in_progress' | 'completed';
      setLessonStatus(status);

      if (status === 'not_started' && !session) {
        // Première fois → démarrer directement en mode 'playing', section 0
        const freshProgress: SectionProgress[] = lessonSections.sections.map(s => ({
          sectionId: s.id,
          teachingCompleted: false,
          nextExerciseIndex: 0,
          exerciseResults: [],
          status: 'not_started' as const,
        }));
        const newSession: LessonSessionState = {
          lessonId,
          userId: userId!,
          currentSectionIndex: 0,
          sectionProgress: freshProgress,
          updatedAt: new Date().toISOString(),
        };
        await upsertLessonSession(newSession);
        setSessionState(newSession);
        setCurrentSectionIndex(0);
        setMode('playing');
      } else if (session) {
        // Session existante → hub
        setSessionState(session);
        setCurrentSectionIndex(session.currentSectionIndex);
        setMode('hub');
      } else if (status === 'completed') {
        // Déjà complétée, pas de session → hub mode replay
        setMode('hub');
      } else {
        // in_progress sans session → démarrer depuis le début
        const freshProgress: SectionProgress[] = lessonSections.sections.map(s => ({
          sectionId: s.id,
          teachingCompleted: false,
          nextExerciseIndex: 0,
          exerciseResults: [],
          status: 'not_started' as const,
        }));
        const newSession: LessonSessionState = {
          lessonId,
          userId: userId!,
          currentSectionIndex: 0,
          sectionProgress: freshProgress,
          updatedAt: new Date().toISOString(),
        };
        await upsertLessonSession(newSession);
        setSessionState(newSession);
        setCurrentSectionIndex(0);
        setMode('playing');
      }
    }
    init();
  }, [isLoading, lesson, userId, lessonSections.sections.length]);

  // ── Progression mid-section ───────────────────────────────
  async function handleProgressUpdate(progress: SectionProgress) {
    if (!sessionState || !userId || !id) return;
    const updatedSectionProgress = [...(sessionState.sectionProgress)];
    updatedSectionProgress[currentSectionIndex] = progress;
    const newSession: LessonSessionState = {
      ...sessionState,
      sectionProgress: updatedSectionProgress,
      updatedAt: new Date().toISOString(),
    };
    setSessionState(newSession);
    await upsertLessonSession(newSession);
  }

  // ── Fin d'une section ─────────────────────────────────────
  async function handleSectionComplete(progress: SectionProgress) {
    // En mode relecture → enchaîner directement sur les exercices de la même section
    if (replayMode === 'teaching_only') {
      setReplayMode('exercises_only');
      setPlayerKey(k => k + 1); // Force remontage du SectionPlayer
      return;
    }

    // En mode exercices seuls (replay) → retour au hub
    if (replayMode === 'exercises_only') {
      setReplayMode(undefined);
      setMode('hub');
      return;
    }

    if (!sessionState || !userId || !id) return;

    const updatedSectionProgress = [...(sessionState.sectionProgress)];
    updatedSectionProgress[currentSectionIndex] = progress;
    const nextIndex = currentSectionIndex + 1;

    if (nextIndex >= lessonSections.sections.length) {
      // Toutes les sections terminées
      await deleteLessonSession(id, userId);
      await handleLessonComplete(updatedSectionProgress);
    } else {
      // Passer à la section suivante
      const newSession: LessonSessionState = {
        ...sessionState,
        currentSectionIndex: nextIndex,
        sectionProgress: updatedSectionProgress,
        updatedAt: new Date().toISOString(),
      };
      setSessionState(newSession);
      await upsertLessonSession(newSession);
      setCurrentSectionIndex(nextIndex);
      setReplayMode(undefined);
    }
  }

  // ── Complétion de leçon (XP, badges, SRS) ────────────────
  async function handleLessonComplete(allSectionProgress: SectionProgress[]) {
    const lessonId = id ?? '';
    const allResults: ExerciseResult[] = allSectionProgress.flatMap(sp => sp.exerciseResults);
    const correct = allResults.filter(r => r.correct).length;
    const total = allResults.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const totalTimeSecs = Math.round((Date.now() - startTime.current) / 1000);
    const baseXP = (lesson?.xp_reward as number | undefined) ?? 20;
    const xp = calculateLessonXP(baseXP, pct);

    setFinalScore(pct);
    setFinalTime(totalTimeSecs);
    setFinalSectionProgress(allSectionProgress);
    setEarnedXP(xp);

    track('lesson_completed', {
      lesson_id: lessonId,
      module_id: lesson?.module_id,
      score: pct,
      time_seconds: totalTimeSecs,
      xp_earned: xp,
      is_perfect: pct === 100,
    });

    addXP(xp);
    setShowXP(true);

    updateStreak().then(data => {
      if (data) {
        setUpdatedStreakCurrent(data.streak_current);
        if ([3, 7, 14, 30].includes(data.streak_current)) setShowStreak(true);
      }
    });

    // SRS
    if (contentType === 'diacritics' && lessonDiacritics?.length) {
      await createSRSCardsForItems(lessonDiacritics.map(d => d.id), 'diacritic');
      queryClient.invalidateQueries({ queryKey: ['srs_cards'] });
    }
    if (contentType === 'words' && lessonWords.length) {
      await createSRSCardsForItems(lessonWords.map(w => w.id), 'word');
      queryClient.invalidateQueries({ queryKey: ['srs_cards'] });
    }
    if (contentType === 'sentences' && sentenceConfig) {
      const sentenceIds = sentenceConfig.type === 'fill_blank'
        ? (allSentences ?? []).filter(s => s.difficulty <= 2).map(s => s.id)
        : (sentenceConfig.sentenceIds ?? []);
      if (sentenceIds.length > 0) {
        await createSRSCardsForItems(sentenceIds, 'sentence');
        queryClient.invalidateQueries({ queryKey: ['srs_cards'] });
      }
    }

    setMode('lesson_complete');
  }

  // ── Hub callbacks ─────────────────────────────────────────
  function handleResumeAtSection(sectionIndex: number) {
    setReplayMode(undefined);
    setCurrentSectionIndex(sectionIndex);
    setMode('playing');
  }

  function handleReplayTeaching(sectionIndex: number) {
    setReplayMode('teaching_only');
    setCurrentSectionIndex(sectionIndex);
    setPlayerKey(k => k + 1);
    setMode('playing');
  }

  function handleReplayExercises(sectionIndex: number) {
    setReplayMode('exercises_only');
    setCurrentSectionIndex(sectionIndex);
    setPlayerKey(k => k + 1);
    setMode('playing');
  }

  async function handleStartFromBeginning() {
    if (!userId || !id) return;
    await deleteLessonSession(id, userId);
    const freshProgress: SectionProgress[] = lessonSections.sections.map(s => ({
      sectionId: s.id,
      teachingCompleted: false,
      nextExerciseIndex: 0,
      exerciseResults: [],
      status: 'not_started' as const,
    }));
    const newSession: LessonSessionState = {
      lessonId: id,
      userId,
      currentSectionIndex: 0,
      sectionProgress: freshProgress,
      updatedAt: new Date().toISOString(),
    };
    await upsertLessonSession(newSession);
    setSessionState(newSession);
    setCurrentSectionIndex(0);
    setReplayMode(undefined);
    startTime.current = Date.now();
    setMode('playing');
  }

  // ── SectionPlayer back ────────────────────────────────────
  function handleSectionBack() {
    // La session est déjà sauvegardée en continu → on affiche le hub
    if (lessonStatus === 'completed') {
      setMode('hub');
    } else {
      setLessonStatus('in_progress');
      setMode('hub');
    }
  }

  // ── ContentData pour SectionPlayer ───────────────────────
  const wordConfig = contentType === 'words' && lesson ? LESSON_WORD_CONFIG[lesson.sort_order] : null;

  const contentData = useMemo(() => ({
    letters: lessonLetters,
    diacritics: lessonDiacritics,
    words: lessonWords,
    roots: allRoots ?? [],
    sentences: lessonSentences,
    dialogues: dialoguesWithTurns,
    grammarRules: grammarRules,
    conjugationEntries: lessonConjugations,
    wordConfigType: wordConfig?.type,
    sentenceConfigType: sentenceConfig?.type,
    lessonSortOrder: lesson?.sort_order,
  }), [lessonLetters, lessonDiacritics, lessonWords, allRoots, lessonSentences,
       dialoguesWithTurns, grammarRules, lessonConjugations,
       wordConfig?.type, sentenceConfig?.type, lesson?.sort_order]);

  // ── Résultat de leçon ─────────────────────────────────────
  async function handleContinue() {
    if (!id) { router.replace('/(tabs)/learn'); return; }
    const uid = useAuthStore.getState().userId;

    await completeLesson.mutateAsync({
      lessonId: id,
      score: finalScore,
      timeSpentSeconds: finalTime,
    });

    if (!uid) { router.replace('/(tabs)/learn'); return; }

    const moduleId = lesson?.module_id;
    const isModuleComplete = moduleId ? await checkIfModuleComplete(moduleId, uid) : false;
    const completedCount = await getCompletedLessonsCount(uid);
    const newBadges = await checkBadges({
      lessonCount: completedCount,
      completedModuleId: isModuleComplete && moduleId ? moduleId : undefined,
      isPerfectScore: finalScore === 100,
      streakDays: updatedStreakCurrent ?? undefined,
    });

    if (isModuleComplete && moduleId) {
      const stats = await getModuleStats(moduleId, uid);
      router.replace({
        pathname: '/module-complete',
        params: {
          moduleTitle: stats.title_fr,
          moduleIcon: stats.icon,
          totalXP: stats.total_xp.toString(),
          lessonsCount: stats.lessons_count.toString(),
          timeMinutes: Math.round(stats.total_seconds / 60).toString(),
        },
      } as any);
      return;
    }

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

  // ── Settings ──────────────────────────────────────────────
  const settingsForPlayer = useSettingsStore.getState();

  // ── Rendu ─────────────────────────────────────────────────

  if (mode === 'loading' || isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (mode === 'hub' && lesson) {
    return (
      <LessonHub
        lesson={lesson as any}
        sections={lessonSections.sections}
        sectionProgress={sessionState?.sectionProgress ?? []}
        lessonStatus={lessonStatus}
        onStartFromBeginning={handleStartFromBeginning}
        onResumeAtSection={handleResumeAtSection}
        onReplayTeaching={handleReplayTeaching}
        onReplayExercises={handleReplayExercises}
        onBack={() => router.back()}
      />
    );
  }

  if (mode === 'playing' && lessonSections.sections.length > 0) {
    const section = lessonSections.sections[currentSectionIndex];
    if (!section) {
      return (
        <SafeAreaView style={styles.safe}>
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        </SafeAreaView>
      );
    }

    const initialProgress: SectionProgress = sessionState?.sectionProgress[currentSectionIndex] ?? {
      sectionId: section.id,
      teachingCompleted: false,
      nextExerciseIndex: 0,
      exerciseResults: [],
      status: 'not_started',
    };

    return (
      <>
        <XPFloatingLabel xp={earnedXP} visible={showXP} onAnimationEnd={() => setShowXP(false)} />
        <SectionPlayer
          key={playerKey}
          section={section}
          contentType={lessonSections.contentType}
          initialProgress={replayMode === 'exercises_only'
            ? { ...initialProgress, nextExerciseIndex: 0, exerciseResults: [] }
            : initialProgress}
          contentData={contentData as any}
          settings={settingsForPlayer as any}
          onProgressUpdate={handleProgressUpdate}
          onSectionComplete={handleSectionComplete}
          onBack={handleSectionBack}
          replayMode={replayMode}
        />
      </>
    );
  }

  if (mode === 'lesson_complete') {
    const allResults = finalSectionProgress.flatMap(sp => sp.exerciseResults);
    const correct = allResults.filter(r => r.correct).length;
    const total = allResults.length;
    const isPerfect = finalScore >= 100;

    return (
      <SafeAreaView style={styles.safe}>
        <XPFloatingLabel xp={earnedXP} visible={showXP} onAnimationEnd={() => setShowXP(false)} />
        <StreakCelebration
          streakDays={updatedStreakCurrent ?? 0}
          visible={showStreak}
          onHide={() => setShowStreak(false)}
        />
        <BadgeUnlockModal badge={currentBadge} onDismiss={handleBadgeDismiss} />
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <Text style={styles.resultsTitle}>Leçon terminée !</Text>
          <Text style={styles.encouragement}>{getEncouragement(finalScore)}</Text>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreNumber}>{correct}/{total}</Text>
            <Text style={styles.scoreLabel}>bonnes réponses</Text>
            <View style={styles.scoreBarTrack}>
              <View style={[styles.scoreBarFill, { width: `${finalScore}%` }]} />
            </View>
            <Text style={styles.scorePct}>{finalScore}%</Text>
          </View>

          <View style={styles.xpBox}>
            <Text style={styles.xpText}>
              {isPerfect ? `+${earnedXP} XP 🎯` : `+${earnedXP} XP`}
            </Text>
            {isPerfect && <Text style={styles.xpBonus}>Bonus score parfait ×1,5 !</Text>}
            {updatedStreakCurrent !== null && (
              <Text style={styles.streakText}>
                🔥 Streak : {updatedStreakCurrent} jour{updatedStreakCurrent > 1 ? 's' : ''}
              </Text>
            )}
          </View>

          <Text style={styles.timeText}>
            Temps total : {finalTime < 60
              ? `${finalTime}s`
              : `${Math.floor(finalTime / 60)}min ${finalTime % 60}s`}
          </Text>

          <TouchableOpacity style={styles.ctaBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.ctaLabel}>Continuer →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Fallback
  return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
    </SafeAreaView>
  );
}

// ── Création cartes SRS ───────────────────────────────────────

async function createSRSCardsForItems(
  itemIds: string[],
  itemType: 'diacritic' | 'word' | 'sentence',
): Promise<void> {
  const { useAuthStore } = await import('../../src/stores/useAuthStore');
  const userId = useAuthStore.getState().userId;
  if (!userId) return;
  const { upsertSRSCard } = await import('../../src/db/local-queries');
  for (const itemId of itemIds) {
    const card = createNewCard(userId, itemType, itemId);
    await upsertSRSCard({ id: `${userId}-${itemType}-${itemId}`, ...card });
  }
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1 },

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
  scoreLabel: { fontSize: FontSizes.body, color: Colors.textSecondary },
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
  xpText: { fontSize: FontSizes.heading, fontWeight: '700', color: Colors.primary },
  xpBonus: { fontSize: FontSizes.caption, color: Colors.primary },
  streakText: { fontSize: FontSizes.caption, color: Colors.textSecondary, marginTop: 2 },
  timeText: { fontSize: FontSizes.caption, color: Colors.textMuted },
  ctaBtn: {
    width: '100%',
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  ctaLabel: { fontSize: FontSizes.body, fontWeight: '700', color: Colors.textOnPrimary },
});
