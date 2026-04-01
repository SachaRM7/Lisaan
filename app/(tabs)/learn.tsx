// app/(tabs)/learn.tsx
// Layout Bento : HeroModuleCard (full-width) + grille carrée complétés/verrouillés
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useModules } from '../../src/hooks/useModules';
import { useLessons } from '../../src/hooks/useLessons';
import { useProgress, useInitFirstLesson } from '../../src/hooks/useProgress';
import { useDailyChallenges } from '../../src/hooks/useDailyChallenges';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { supabase } from '../../src/db/remote';
import { useTheme } from '../../src/contexts/ThemeContext';
import { HeroModuleCard } from '../../src/components/learn/HeroModuleCard';
import { CompletedModuleCard } from '../../src/components/learn/CompletedModuleCard';
import { LockedModuleCard } from '../../src/components/learn/LockedModuleCard';
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

// ── Mutation déverrouillage ─────────────────────────────────

function useUnlockModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (firstLessonId: string) => {
      const userId = useAuthStore.getState().effectiveUserId();
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
  const router = useRouter();
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
  const userId = useAuthStore((s) => s.effectiveUserId());
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [_newlyUnlocked, setNewlyUnlocked] = useState<number | null>(null);
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
    const currentUserId = useAuthStore.getState().effectiveUserId();
    if (!currentUserId || !progressLoaded || !module1Lessons || module1Lessons.length === 0) return;
    const firstLesson = module1Lessons[0];
    const firstLessonProgress = progress.find(p => p.lesson_id === firstLesson.id);
    if (!firstLessonProgress || firstLessonProgress.status === 'locked') {
      initFirstLesson.mutate(firstLesson.id);
    }
  }, [userId, progressLoaded, progress, module1Lessons]);

  const allModules = modules ?? [];

  const lessonsByModuleId = useMemo<Record<string, Lesson[]>>(() => ({
    [modules?.[0]?.id ?? '']: module1Lessons ?? [],
    [modules?.[1]?.id ?? '']: module2Lessons ?? [],
    [modules?.[2]?.id ?? '']: module3Lessons ?? [],
    [modules?.[3]?.id ?? '']: module4Lessons ?? [],
    [modules?.[4]?.id ?? '']: module5Lessons ?? [],
    [modules?.[5]?.id ?? '']: module6Lessons ?? [],
  }), [modules, module1Lessons, module2Lessons, module3Lessons, module4Lessons, module5Lessons, module6Lessons]);

  const lessonCountByModule = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const [modId, lessons] of Object.entries(lessonsByModuleId)) {
      counts[modId] = lessons.length;
    }
    return counts;
  }, [lessonsByModuleId]);

  const progressByModule = useMemo<Record<string, LessonProgress[]>>(() => {
    const byMod: Record<string, LessonProgress[]> = {};
    for (const mod of allModules) {
      const modLessonIds = new Set((lessonsByModuleId[mod.id] ?? []).map(l => l.id));
      byMod[mod.id] = progress.filter(p => modLessonIds.has(p.lesson_id));
    }
    return byMod;
  }, [allModules, lessonsByModuleId, progress]);

  // ── Module Hero : premier module débloqué non entièrement complété ──

  const heroModule = useMemo<Module | null>(() => {
    for (const mod of allModules) {
      const unlocked = isModuleUnlocked(mod.sort_order, progressByModule, allModules, lessonCountByModule);
      if (!unlocked) continue;
      const total = lessonCountByModule[mod.id] ?? 0;
      const completed = (progressByModule[mod.id] ?? []).filter(p => p.status === 'completed').length;
      if (total === 0 || completed < total) return mod;
    }
    // Tout complété → afficher le dernier débloqué
    for (let i = allModules.length - 1; i >= 0; i--) {
      const mod = allModules[i];
      if (isModuleUnlocked(mod.sort_order, progressByModule, allModules, lessonCountByModule)) return mod;
    }
    return allModules[0] ?? null;
  }, [allModules, progressByModule, lessonCountByModule]);

  // Prochaine leçon du hero (in_progress en priorité, sinon available)
  const heroNextLesson = useMemo<Lesson | null>(() => {
    if (!heroModule) return null;
    const heroLessons = lessonsByModuleId[heroModule.id] ?? [];
    for (const l of heroLessons) {
      if (progress.find(p => p.lesson_id === l.id)?.status === 'in_progress') return l;
    }
    for (const l of heroLessons) {
      if (progress.find(p => p.lesson_id === l.id)?.status === 'available') return l;
    }
    return heroLessons[0] ?? null;
  }, [heroModule, lessonsByModuleId, progress]);

  const heroCompleted = heroModule
    ? (progressByModule[heroModule.id] ?? []).filter(p => p.status === 'completed').length
    : 0;
  const heroTotal = heroModule ? (lessonCountByModule[heroModule.id] ?? 0) : 0;

  // ── Modules de la grille (tous sauf hero) ──

  // Modules non-hero, du plus récent au plus ancien (actifs en tête, complétés en bas)
  const gridModules = useMemo(
    () => [...allModules.filter(m => m.id !== heroModule?.id)].reverse(),
    [allModules, heroModule],
  );

  // Paires pour le rendu 2 colonnes
  const gridPairs = useMemo<[Module, Module | null][]>(() => {
    const pairs: [Module, Module | null][] = [];
    for (let i = 0; i < gridModules.length; i += 2) {
      pairs.push([gridModules[i], gridModules[i + 1] ?? null]);
    }
    return pairs;
  }, [gridModules]);

  // ── Logique bannière déverrouillage ──

  const module2Unlocked = isModuleUnlocked(2, progressByModule, allModules, lessonCountByModule);
  const module3Unlocked = isModuleUnlocked(3, progressByModule, allModules, lessonCountByModule);
  const module4Unlocked = isModuleUnlocked(4, progressByModule, allModules, lessonCountByModule);
  const module5Unlocked = isModuleUnlocked(5, progressByModule, allModules, lessonCountByModule);
  const module6Unlocked = isModuleUnlocked(6, progressByModule, allModules, lessonCountByModule);

  function handleModuleUnlock(index: number, lessons: Lesson[] | undefined, message: string) {
    return (unlocked: boolean) => {
      if (unlocked && !prevUnlocked.current[index + 2]) {
        prevUnlocked.current[index + 2] = true;
        const mod = allModules.find(m => m.sort_order === index + 2);
        const alreadyHadProgress = mod ? (progressByModule[mod.id]?.length ?? 0) > 0 : false;
        if (!alreadyHadProgress) {
          setNewlyUnlocked(index + 1);
          setBannerMsg(message);
          if (lessons && lessons.length > 0) unlockModule.mutate(lessons[0].id);
          setTimeout(() => setBannerMsg(null), 4000);
          setTimeout(() => setNewlyUnlocked(null), 6000);
        }
      }
    };
  }

  useEffect(() => { handleModuleUnlock(0, module2Lessons, '🎉 Module 2 débloqué ! Découvre les harakats.')(module2Unlocked); }, [module2Unlocked]);
  useEffect(() => { handleModuleUnlock(1, module3Lessons, '🎉 Module 3 débloqué ! Lis tes premiers mots arabes.')(module3Unlocked); }, [module3Unlocked]);
  useEffect(() => { handleModuleUnlock(2, module4Lessons, '🎉 Module 4 débloqué ! Construis du sens en arabe.')(module4Unlocked); }, [module4Unlocked]);
  useEffect(() => { handleModuleUnlock(3, module5Lessons, '🎉 Module 5 débloqué ! Découvre la grammaire essentielle.')(module5Unlocked); }, [module5Unlocked]);
  useEffect(() => { handleModuleUnlock(4, module6Lessons, '🎉 Module 6 débloqué ! Conjugue tes premiers verbes.')(module6Unlocked); }, [module6Unlocked]);

  const { todayChallenge, isTodayCompleted } = useDailyChallenges();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.brand.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top']}>
      {/* Bannière déverrouillage */}
      {bannerMsg && (
        <View style={{
          backgroundColor: colors.brand.primary,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          alignItems: 'center',
        }}>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.body,
            color: colors.text.inverse,
            textAlign: 'center',
          }}>
            {bannerMsg}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.base,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
        }}>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.h2,
            color: colors.text.primary,
          }}>
            Lisaan
          </Text>

          {/* Chip streak + Daily Challenge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {/* Daily Challenge Button */}
            {todayChallenge && (
              <TouchableOpacity
                onPress={() => router.push('/daily-challenge')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  backgroundColor: isTodayCompleted ? colors.status.successLight : colors.accent.gold,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.micro,
                  ...shadows.subtle,
                }}
              >
                <Text style={{ fontSize: 14 }}>⚡</Text>
                <Text style={{
                  fontFamily: typography.family.uiBold,
                  fontSize: typography.size.small,
                  color: isTodayCompleted ? colors.status.success : colors.text.primary,
                }}>
                  {isTodayCompleted ? '✓' : 'Défi'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Streak */}
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
              <Text style={{
                fontFamily: typography.family.uiBold,
                fontSize: typography.size.small,
                color: colors.accent.gold,
              }}>
                {userStats?.streak_current ?? 0}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Hero Module Card (full-width) ── */}
        {heroModule && (
          <HeroModuleCard
            module={heroModule}
            number={heroModule.sort_order}
            completedCount={heroCompleted}
            totalLessons={heroTotal}
            onPressCard={() => router.push(`/module/${heroModule.id}` as any)}
            onPressContinue={() => {
              if (heroNextLesson) {
                router.push(`/lesson/${heroNextLesson.id}` as any);
              } else {
                router.push(`/module/${heroModule.id}` as any);
              }
            }}
          />
        )}

        {/* ── Grille : complétés + verrouillés ── */}
        {gridPairs.length > 0 && (
          <View style={{ marginTop: spacing.lg, gap: spacing.base }}>
            {gridPairs.map(([m1, m2], pairIndex) => {
              const m1Unlocked = isModuleUnlocked(m1.sort_order, progressByModule, allModules, lessonCountByModule);
              const m1Total = lessonCountByModule[m1.id] ?? 0;
              const m1Completed = (progressByModule[m1.id] ?? []).filter(p => p.status === 'completed').length;
              const m1Done = m1Unlocked && m1Total > 0 && m1Completed >= m1Total;

              const m2Unlocked = m2 ? isModuleUnlocked(m2.sort_order, progressByModule, allModules, lessonCountByModule) : false;
              const m2Total = m2 ? (lessonCountByModule[m2.id] ?? 0) : 0;
              const m2Completed = m2 ? (progressByModule[m2.id] ?? []).filter(p => p.status === 'completed').length : 0;
              const m2Done = m2 && m2Unlocked && m2Total > 0 && m2Completed >= m2Total;

              return (
                <View key={`pair-${pairIndex}`} style={{ flexDirection: 'row', gap: spacing.base }}>
                  {m1Unlocked ? (
                    <CompletedModuleCard
                      module={m1}
                      number={m1.sort_order}
                      onPress={() => router.push(`/module/${m1.id}` as any)}
                    />
                  ) : (
                    <LockedModuleCard module={m1} number={m1.sort_order} />
                  )}

                  {m2 ? (
                    m2Unlocked ? (
                      <CompletedModuleCard
                        module={m2}
                        number={m2.sort_order}
                        onPress={() => router.push(`/module/${m2.id}` as any)}
                      />
                    ) : (
                      <LockedModuleCard module={m2} number={m2.sort_order} />
                    )
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
