// app/(tabs)/learn.tsx
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, FontSizes, Spacing, Radius, Shadows, Layout } from '../../src/constants/theme';
import { useModules } from '../../src/hooks/useModules';
import { useLessons } from '../../src/hooks/useLessons';
import { useProgress, useInitFirstLesson } from '../../src/hooks/useProgress';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { supabase } from '../../src/db/remote';
import type { Module } from '../../src/hooks/useModules';
import type { Lesson } from '../../src/hooks/useLessons';
import type { LessonProgress } from '../../src/hooks/useProgress';

const MODULE_1_LESSON_COUNT = 7;
const PROGRESS_QUERY_KEY = ['user_progress'];

// ── Composant leçon ────────────────────────────────────────

function lessonStatusIcon(status: LessonProgress['status'] | undefined): string {
  if (status === 'completed') return '✅';
  if (status === 'available') return '🔓';
  return '🔒';
}

function LessonRow({
  lesson,
  progress,
  onPress,
}: {
  lesson: Lesson;
  progress: LessonProgress | undefined;
  onPress: () => void;
}) {
  const status = progress?.status;
  const isLocked = !status || status === 'locked';

  return (
    <Pressable
      style={[styles.lessonRow, isLocked && styles.lessonRowLocked]}
      onPress={isLocked ? undefined : onPress}
    >
      <View style={styles.lessonLeft}>
        <Text style={styles.lessonOrder}>{lesson.sort_order}.</Text>
        <View style={styles.lessonTitles}>
          <Text style={[styles.lessonTitleAr, isLocked && styles.lessonTextLocked]}>{lesson.title_ar}</Text>
          <Text style={[styles.lessonTitleFr, isLocked && styles.lessonTextLocked]}>
            {lesson.title_fr}
            {status === 'completed' && progress?.score != null
              ? `  ${progress.score}%`
              : ''}
          </Text>
        </View>
      </View>
      <Text style={styles.lessonStatus}>{lessonStatusIcon(status)}</Text>
    </Pressable>
  );
}

// ── Module 1 ───────────────────────────────────────────────

function Module1Card({ module, progressList }: { module: Module; progressList: LessonProgress[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const { data: lessons, isLoading } = useLessons(module.id);
  const completedCount = progressList.filter(p => p.status === 'completed').length;

  return (
    <View style={[styles.moduleCard, styles.moduleCardActive]}>
      <Pressable style={styles.moduleHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.moduleHeaderLeft}>
          <Text style={styles.moduleLabel}>MODULE 1</Text>
          <Text style={styles.moduleTitleAr}>{module.title_ar}</Text>
          <Text style={styles.moduleTitleFr}>{module.title_fr}</Text>
        </View>
        <View style={styles.moduleHeaderRight}>
          <Text style={styles.moduleLessonCount}>{completedCount}/{lessons?.length ?? 0}</Text>
          <Text style={styles.moduleChevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.lessonsList}>
          <View style={styles.lessonsDivider} />
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ padding: Spacing.lg }} />
          ) : (
            lessons?.map((lesson) => {
              const progress = progressList.find(p => p.lesson_id === lesson.id);
              return (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  progress={progress}
                  onPress={() => router.push(`/lesson/${lesson.id}`)}
                />
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// ── Module 2 déverrouillé ──────────────────────────────────

function Module2Card({
  module,
  progressList,
  isNewlyUnlocked,
}: {
  module: Module;
  progressList: LessonProgress[];
  isNewlyUnlocked: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(isNewlyUnlocked);
  const { data: lessons, isLoading } = useLessons(module.id);
  const completedCount = progressList.filter(p => p.status === 'completed').length;

  // Animation de glow quand nouvellement déverrouillé
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isNewlyUnlocked) {
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 300, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isNewlyUnlocked]);

  const cardStyle = isNewlyUnlocked
    ? [styles.moduleCard, styles.moduleCardActive, styles.moduleCardUnlocked]
    : [styles.moduleCard, styles.moduleCardActive];

  return (
    <Animated.View style={[...cardStyle, isNewlyUnlocked ? { opacity: glowAnim } : {}]}>
      <View style={[...cardStyle, { opacity: 1 }]}>
        <Pressable style={styles.moduleHeader} onPress={() => setExpanded(!expanded)}>
          <View style={styles.moduleHeaderLeft}>
            <Text style={styles.moduleLabel}>MODULE 2</Text>
            <Text style={styles.moduleTitleAr}>{module.title_ar}</Text>
            <Text style={styles.moduleTitleFr}>{module.title_fr}</Text>
          </View>
          <View style={styles.moduleHeaderRight}>
            <Text style={styles.moduleLessonCount}>{completedCount}/{lessons?.length ?? 0}</Text>
            <Text style={styles.moduleChevron}>{expanded ? '▲' : '▼'}</Text>
          </View>
        </Pressable>

        {expanded && (
          <View style={styles.lessonsList}>
            <View style={styles.lessonsDivider} />
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ padding: Spacing.lg }} />
            ) : (
              lessons?.map((lesson) => {
                const progress = progressList.find(p => p.lesson_id === lesson.id);
                return (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    progress={progress}
                    onPress={() => router.push(`/lesson/${lesson.id}`)}
                  />
                );
              })
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ── Module locked générique ────────────────────────────────

function LockedModuleCard({
  module,
  number,
  lockMessage,
}: {
  module: Module;
  number: number;
  lockMessage?: string;
}) {
  return (
    <View style={[styles.moduleCard, styles.moduleCardLocked]}>
      <View style={styles.moduleHeader}>
        <View style={styles.moduleHeaderLeft}>
          <Text style={styles.moduleLabel}>MODULE {number}</Text>
          <Text style={styles.moduleTitleAr}>{module.title_ar}</Text>
          <Text style={styles.moduleTitleFr}>{module.title_fr}</Text>
          {lockMessage ? (
            <Text style={styles.lockMessage}>{lockMessage}</Text>
          ) : null}
        </View>
        <Text style={styles.lockIcon}>🔒</Text>
      </View>
    </View>
  );
}

// ── Déverrouillage Module 2 ────────────────────────────────

function useUnlockModule2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (firstLessonId: string) => {
      const userId = useAuthStore.getState().userId;
      if (!userId) return;
      const { upsertProgress } = await import('../../src/db/local-queries');
      const { runSync } = await import('../../src/engines/sync-manager');
      await upsertProgress({
        id: crypto.randomUUID(),
        user_id: userId,
        lesson_id: firstLessonId,
        status: 'available',
        score: 0,
        completed_at: null,
        attempts: 0,
        time_spent_seconds: 0,
      });
      runSync().catch(console.warn);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
    },
  });
}

// ── Écran principal ────────────────────────────────────────

export default function LearnScreen() {
  const { data: modules, isLoading } = useModules();
  const { data: progress = [] } = useProgress();
  const { data: module1Lessons } = useLessons(modules?.[0]?.id ?? '');
  const { data: module2Lessons } = useLessons(modules?.[1]?.id ?? '');
  const initFirstLesson = useInitFirstLesson();
  const unlockModule2 = useUnlockModule2();
  const userId = useAuthStore((s) => s.userId);
  const [showUnlockBanner, setShowUnlockBanner] = useState(false);
  const [module2NewlyUnlocked, setModule2NewlyUnlocked] = useState(false);
  const prevModule2Unlocked = useRef(false);

  const { data: userStats } = useQuery({
    queryKey: ['user_stats_learn', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('users')
        .select('streak_current, total_xp')
        .eq('id', userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  // Initialiser la leçon 1 si aucune progression n'existe
  useEffect(() => {
    const currentUserId = useAuthStore.getState().userId;
    if (currentUserId && progress.length === 0 && module1Lessons && module1Lessons.length > 0) {
      initFirstLesson.mutate(module1Lessons[0].id);
    }
  }, [userId, progress.length, module1Lessons]);

  // Vérifier si le Module 1 est 100% terminé
  const module1Progress = progress.filter(p =>
    module1Lessons?.some(l => l.id === p.lesson_id),
  );
  const module1CompletedCount = module1Progress.filter(p => p.status === 'completed').length;
  const module2Unlocked = module1CompletedCount >= MODULE_1_LESSON_COUNT;

  // Détecter le moment exact du déverrouillage pour l'animation/banner
  useEffect(() => {
    if (module2Unlocked && !prevModule2Unlocked.current) {
      // Module 2 vient de se déverrouiller
      setModule2NewlyUnlocked(true);
      setShowUnlockBanner(true);
      prevModule2Unlocked.current = true;

      // Initialiser la première leçon du Module 2
      if (module2Lessons && module2Lessons.length > 0) {
        unlockModule2.mutate(module2Lessons[0].id);
      }

      setTimeout(() => setShowUnlockBanner(false), 4000);
      setTimeout(() => setModule2NewlyUnlocked(false), 6000);
    } else if (module2Unlocked) {
      prevModule2Unlocked.current = true;
    }
  }, [module2Unlocked, module2Lessons]);

  // Vérifier si Module 2 a déjà une progression (déverrouillé lors d'une session précédente)
  const module2HasProgress = module2Lessons
    ? progress.some(p => module2Lessons.some(l => l.id === p.lesson_id))
    : false;

  const module2IsPlayable = module2Unlocked && (module2HasProgress || module2Lessons?.length === 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Banner de déverrouillage */}
      {showUnlockBanner && (
        <View style={styles.unlockBanner}>
          <Text style={styles.unlockBannerText}>
            🎉 Module 2 débloqué ! Découvre les harakats.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Apprendre</Text>
          <View style={styles.statsChips}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>🔥 {userStats?.streak_current ?? 0}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>⭐ {userStats?.total_xp ?? 0}</Text>
            </View>
          </View>
        </View>

        {/* Modules */}
        <View style={styles.modulesList}>
          {modules?.map((module, index) => {
            if (index === 0) {
              return (
                <Module1Card
                  key={module.id}
                  module={module}
                  progressList={progress}
                />
              );
            }
            if (index === 1) {
              if (module2IsPlayable) {
                return (
                  <Module2Card
                    key={module.id}
                    module={module}
                    progressList={progress}
                    isNewlyUnlocked={module2NewlyUnlocked}
                  />
                );
              }
              return (
                <LockedModuleCard
                  key={module.id}
                  module={module}
                  number={2}
                  lockMessage="Termine le Module 1 pour débloquer"
                />
              );
            }
            return (
              <LockedModuleCard key={module.id} module={module} number={index + 1} />
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loader: {
    flex: 1,
  },
  scroll: {
    padding: Layout.screenPaddingH,
    paddingBottom: 100,
  },

  // Banner déverrouillage
  unlockBanner: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  unlockBannerText: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statsChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  chipText: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Modules
  modulesList: {
    gap: Spacing.lg,
  },
  moduleCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  moduleCardActive: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  moduleCardUnlocked: {
    borderLeftColor: '#F4A261',
    borderLeftWidth: 4,
  },
  moduleCardLocked: {
    opacity: 0.5,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
  },
  moduleHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  moduleHeaderRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  moduleLabel: {
    fontSize: FontSizes.small,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  moduleTitleAr: {
    fontFamily: 'Amiri',
    fontSize: FontSizes.arabicXS,
    color: Colors.textPrimary,
    textAlign: 'left',
  },
  moduleTitleFr: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  moduleLessonCount: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  moduleChevron: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
  },
  lockIcon: {
    fontSize: 18,
  },
  lockMessage: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },

  // Leçons
  lessonsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  lessonsList: {
    paddingBottom: Spacing.sm,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  lessonOrder: {
    fontSize: FontSizes.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    width: 20,
  },
  lessonTitles: {
    flex: 1,
    gap: 2,
  },
  lessonTitleAr: {
    fontFamily: 'Amiri',
    fontSize: FontSizes.arabicXS,
    color: Colors.textPrimary,
  },
  lessonTitleFr: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
  },
  lessonStatus: {
    fontSize: 16,
  },
  lessonRowLocked: {
    opacity: 0.4,
  },
  lessonTextLocked: {
    color: Colors.textMuted,
  },
});
