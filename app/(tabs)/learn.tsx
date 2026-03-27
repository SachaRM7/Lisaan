// app/(tabs)/learn.tsx
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useModules } from '../../src/hooks/useModules';
import { useLessons } from '../../src/hooks/useLessons';
import { useProgress, useInitFirstLesson } from '../../src/hooks/useProgress';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { supabase } from '../../src/db/remote';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import type { Module } from '../../src/hooks/useModules';
import type { Lesson } from '../../src/hooks/useLessons';
import type { LessonProgress } from '../../src/hooks/useProgress';

const PROGRESS_QUERY_KEY = ['user_progress'];

// ── Logique déverrouillage ──────────────────────────────────

function isModuleUnlocked(
  moduleSortOrder: number,
  progressByModule: Record<string, LessonProgress[]>,
  modules: Module[],
  lessonCountByModule: Record<string, number>,
): boolean {
  if (moduleSortOrder === 1) return true;
  const previousModule = modules.find(m => m.sort_order === moduleSortOrder - 1);
  if (!previousModule) return false;
  const previousProgress = progressByModule[previousModule.id] ?? [];
  const previousCompleted = previousProgress.filter(p => p.status === 'completed').length;
  const previousTotal = lessonCountByModule[previousModule.id] ?? 0;
  return previousTotal > 0 && previousCompleted >= previousTotal;
}

// ── Ligne de leçon ──────────────────────────────────────────

function LessonRow({
  lesson, progress, onPress,
}: {
  lesson: Lesson;
  progress: LessonProgress | undefined;
  onPress: () => void;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const status = progress?.status;
  const isLocked = !status || status === 'locked';
  const isCompleted = status === 'completed';
  const arabicLineHeight = Math.round(22 * 1.9);

  return (
    <Pressable
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        },
        isLocked && { opacity: 0.4 },
      ]}
      onPress={isLocked ? undefined : onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary, width: 20 }}>
          {lesson.sort_order}.
        </Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: typography.family.arabic, fontSize: typography.size.arabicSmall, lineHeight: arabicLineHeight, color: colors.text.heroArabic }}>
            {lesson.title_ar}
          </Text>
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
            {lesson.title_fr}
          </Text>
        </View>
      </View>
      <View style={{
        width: 20,
        height: 20,
        borderRadius: borderRadius.pill,
        backgroundColor: isCompleted ? colors.status.success : isLocked ? colors.background.group : colors.background.group,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 10 }}>
          {isCompleted ? '✓' : isLocked ? '🔒' : '→'}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Card Module Déverrouillé ────────────────────────────────

function ModuleCard({
  module,
  number,
  progressList,
  isNewlyUnlocked,
}: {
  module: Module;
  number: number;
  progressList: LessonProgress[];
  isNewlyUnlocked: boolean;
}) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState(number === 1 || isNewlyUnlocked);
  const { data: lessons, isLoading } = useLessons(module.id);

  const completedCount = progressList.filter(p => p.status === 'completed').length;
  const totalCount = lessons?.length ?? 0;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const arabicLineHeight = Math.round(36 * 1.9);

  const glowAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isNewlyUnlocked) {
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.7, duration: 300, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.7, duration: 300, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isNewlyUnlocked]);

  return (
    <Animated.View style={[
      {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        ...shadows.subtle,
      },
      isNewlyUnlocked && { opacity: glowAnim },
    ]}>
      <Pressable onPress={() => setExpanded(e => !e)}>
        {/* Header de la card */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: spacing.lg }}>
          {/* Gauche : module label + titre fr */}
          <View style={{ flex: 1, gap: spacing.micro }}>
            <Text style={{
              fontFamily: typography.family.uiBold,
              fontSize: typography.size.tiny,
              color: colors.text.secondary,
              letterSpacing: typography.letterSpacing.caps,
              textTransform: 'uppercase',
            }}>
              MODULE {number}
            </Text>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.primary }}>
              {module.title_fr}
            </Text>
          </View>
          {/* Droite : titre arabe massif */}
          <Text style={{
            fontFamily: typography.family.arabic,
            fontSize: typography.size.arabicTitle,
            lineHeight: arabicLineHeight,
            color: colors.text.heroArabic,
            textAlign: 'right',
          }}>
            {module.title_ar}
          </Text>
        </View>

        {/* Barre de progression fine */}
        <ProgressBar
          progress={progressRatio}
          variant="thin"
          style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm }}
        />
      </Pressable>

      {/* Liste de leçons dépliable */}
      {expanded && (
        <View style={{ paddingBottom: spacing.xs }}>
          <View style={{ height: 1, backgroundColor: colors.border.subtle }} />
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.brand.primary} style={{ padding: spacing.base }} />
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
    </Animated.View>
  );
}

// ── Card Module Verrouillé ──────────────────────────────────

function LockedModuleCard({ module, number, lockMessage }: { module: Module; number: number; lockMessage?: string }) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const arabicLineHeight = Math.round(36 * 1.9);

  return (
    <View style={{
      backgroundColor: colors.background.main,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      opacity: 0.5,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: spacing.lg }}>
        <View style={{ flex: 1, gap: spacing.micro }}>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.tiny, color: colors.text.secondary, letterSpacing: typography.letterSpacing.caps, textTransform: 'uppercase' }}>
            MODULE {number}
          </Text>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.secondary }}>
            {module.title_fr}
          </Text>
          {lockMessage && (
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, fontStyle: 'italic', marginTop: spacing.micro }}>
              {lockMessage}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: spacing.micro }}>
          <Text style={{ fontFamily: typography.family.arabic, fontSize: typography.size.arabicTitle, lineHeight: arabicLineHeight, color: colors.text.secondary, textAlign: 'right' }}>
            {module.title_ar}
          </Text>
          <Text style={{ fontSize: 16 }}>🔒</Text>
        </View>
      </View>
    </View>
  );
}

// ── Mutation déverrouillage ─────────────────────────────────

function useUnlockModule() {
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY }); },
  });
}

// ── Écran principal ────────────────────────────────────────

export default function LearnScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { data: modules, isLoading } = useModules();
  const { data: progress = [], isSuccess: progressLoaded } = useProgress();
  const { data: module1Lessons } = useLessons(modules?.[0]?.id ?? '');
  const { data: module2Lessons } = useLessons(modules?.[1]?.id ?? '');
  const { data: module3Lessons } = useLessons(modules?.[2]?.id ?? '');
  const { data: module4Lessons } = useLessons(modules?.[3]?.id ?? '');
  const { data: module5Lessons } = useLessons(modules?.[4]?.id ?? '');
  const { data: module6Lessons } = useLessons(modules?.[5]?.id ?? '');
  const initFirstLesson = useInitFirstLesson();
  const unlockModule = useUnlockModule();
  const userId = useAuthStore((s) => s.userId);
  const [unlockBannerMessage, setUnlockBannerMessage] = useState<string | null>(null);
  const [newlyUnlockedIndex, setNewlyUnlockedIndex] = useState<number | null>(null);
  const prevUnlocked = useRef<Record<number, boolean>>({});

  const { data: userStats } = useQuery({
    queryKey: ['user_stats_learn', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase.from('users').select('streak_current, total_xp').eq('id', userId).single();
      return data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    const currentUserId = useAuthStore.getState().userId;
    if (!currentUserId || !progressLoaded || !module1Lessons || module1Lessons.length === 0) return;
    const firstLesson = module1Lessons[0];
    const firstLessonProgress = progress.find(p => p.lesson_id === firstLesson.id);
    if (!firstLessonProgress || firstLessonProgress.status === 'locked') {
      initFirstLesson.mutate(firstLesson.id);
    }
  }, [userId, progressLoaded, progress, module1Lessons]);

  const allModules = modules ?? [];
  const lessonsByModule: Record<string, { id: string }[]> = {
    [modules?.[0]?.id ?? '']: module1Lessons ?? [],
    [modules?.[1]?.id ?? '']: module2Lessons ?? [],
    [modules?.[2]?.id ?? '']: module3Lessons ?? [],
    [modules?.[3]?.id ?? '']: module4Lessons ?? [],
    [modules?.[4]?.id ?? '']: module5Lessons ?? [],
    [modules?.[5]?.id ?? '']: module6Lessons ?? [],
  };

  const lessonCountByModule: Record<string, number> = {};
  for (const [modId, lessons] of Object.entries(lessonsByModule)) {
    lessonCountByModule[modId] = lessons.length;
  }

  const progressByModule: Record<string, LessonProgress[]> = {};
  for (const mod of allModules) {
    progressByModule[mod.id] = progress.filter(p =>
      lessonsByModule[mod.id]?.some((l: { id: string }) => l.id === p.lesson_id)
    );
  }

  const module2Unlocked = isModuleUnlocked(2, progressByModule, allModules, lessonCountByModule);
  const module3Unlocked = isModuleUnlocked(3, progressByModule, allModules, lessonCountByModule);
  const module4Unlocked = isModuleUnlocked(4, progressByModule, allModules, lessonCountByModule);
  const module5Unlocked = isModuleUnlocked(5, progressByModule, allModules, lessonCountByModule);
  const module6Unlocked = isModuleUnlocked(6, progressByModule, allModules, lessonCountByModule);

  function handleModuleUnlock(index: number, lessons: typeof module2Lessons, message: string) {
    return (unlocked: boolean) => {
      if (unlocked && !prevUnlocked.current[index + 2]) {
        prevUnlocked.current[index + 2] = true;
        const mod = allModules.find(m => m.sort_order === index + 2);
        const alreadyHadProgress = mod ? (progressByModule[mod.id]?.length ?? 0) > 0 : false;
        if (!alreadyHadProgress) {
          setNewlyUnlockedIndex(index + 1);
          setUnlockBannerMessage(message);
          if (lessons && lessons.length > 0) unlockModule.mutate(lessons[0].id);
          setTimeout(() => setUnlockBannerMessage(null), 4000);
          setTimeout(() => setNewlyUnlockedIndex(null), 6000);
        }
      }
    };
  }

  // Déclencher les effets de déverrouillage
  useEffect(() => { handleModuleUnlock(0, module2Lessons, '🎉 Module 2 débloqué ! Découvre les harakats.')(module2Unlocked); }, [module2Unlocked]);
  useEffect(() => { handleModuleUnlock(1, module3Lessons, '🎉 Module 3 débloqué ! Lis tes premiers mots arabes.')(module3Unlocked); }, [module3Unlocked]);
  useEffect(() => { handleModuleUnlock(2, module4Lessons, '🎉 Module 4 débloqué ! Construis du sens en arabe.')(module4Unlocked); }, [module4Unlocked]);
  useEffect(() => { handleModuleUnlock(3, module5Lessons, '🎉 Module 5 débloqué ! Découvre la grammaire essentielle.')(module5Unlocked); }, [module5Unlocked]);
  useEffect(() => { handleModuleUnlock(4, module6Lessons, '🎉 Module 6 débloqué ! Conjugue tes premiers verbes.')(module6Unlocked); }, [module6Unlocked]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.brand.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top']}>
      {/* Banner déverrouillage */}
      {unlockBannerMessage && (
        <View style={{ backgroundColor: colors.brand.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, alignItems: 'center' }}>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.inverse, textAlign: 'center' }}>
            {unlockBannerMessage}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.base, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary }}>
            Lisaan
          </Text>
          {/* Chip streak */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: colors.background.card,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.micro,
            ...shadows.subtle,
          }}>
            <Text style={{ fontSize: 14 }}>🔥</Text>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.small, color: colors.accent.gold }}>
              {userStats?.streak_current ?? 0}
            </Text>
          </View>
        </View>

        {/* Modules */}
        <View style={{ gap: spacing.base }}>
          {allModules.map((module, index) => {
            const number = index + 1;
            const progressList = progressByModule[module.id] ?? [];

            const unlocked = isModuleUnlocked(module.sort_order, progressByModule, allModules, lessonCountByModule);
            const hasProgress = progress.some(p =>
              lessonsByModule[module.id]?.some((l: { id: string }) => l.id === p.lesson_id)
            );
            const isPlayable = index === 0 || (unlocked && (hasProgress || lessonsByModule[module.id]?.length === 0));

            if (isPlayable) {
              return (
                <ModuleCard
                  key={module.id}
                  module={module}
                  number={number}
                  progressList={progressList}
                  isNewlyUnlocked={newlyUnlockedIndex === index}
                />
              );
            }

            const prevModule = allModules.find(m => m.sort_order === module.sort_order - 1);
            const lockMessage = prevModule ? `Termine le Module ${number - 1} pour débloquer` : undefined;

            return (
              <LockedModuleCard
                key={module.id}
                module={module}
                number={number}
                lockMessage={lockMessage}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
