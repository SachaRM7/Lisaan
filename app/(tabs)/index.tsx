// app/(tabs)/index.tsx
// Home screen - hub quotidien intelligent (Mission 3 E20)
import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useModules } from '../../src/hooks/useModules';
import { useLessons } from '../../src/hooks/useLessons';
import { useProgress } from '../../src/hooks/useProgress';
import { useDueCards } from '../../src/hooks/useSRSCards';
import { useUserStore } from '../../src/stores/index';
import { useTheme } from '../../src/contexts/ThemeContext';
import { TodayHeader } from '../../src/components/today/TodayHeader';
import { ContinueCard } from '../../src/components/today/ContinueCard';
import { SrsCard } from '../../src/components/today/SrsCard';
import { ExploreSection } from '../../src/components/today/ExploreSection';
import type { Module } from '../../src/hooks/useModules';
import type { Lesson } from '../../src/hooks/useLessons';
import type { LessonProgress } from '../../src/hooks/useProgress';

// -- Logique deverrouillage --

function isModuleUnlocked(
  moduleSortOrder: number,
  progressByModule: Record<string, LessonProgress[]>,
  modules: Module[],
  lessonCountByModule: Record<string, number>,
): boolean {
  if (moduleSortOrder === 1) return true;
  const previousModule = modules.find(m => m.sort_order === moduleSortOrder - 1);
  if (!previousModule) return true;
  const previousProgress = progressByModule[previousModule.id] ?? [];
  const previousCompleted = previousProgress.filter(p => p.status === 'completed').length;
  const previousTotal = lessonCountByModule[previousModule.id] ?? 0;
  return previousTotal > 0 && previousCompleted >= previousTotal;
}

// -- Home screen principal --

export default function TodayScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();
  const streak = useUserStore((s) => s.user?.streak_current ?? 0);

  const { data: modules, isLoading } = useModules();
  const { data: progress = [] } = useProgress();
  const { data: dueCards = [] } = useDueCards();

  // Nombre de lecons par module (MSM M1-M6)
  const { data: m1Lessons } = useLessons(modules?.[0]?.id ?? '');
  const { data: m2Lessons } = useLessons(modules?.[1]?.id ?? '');
  const { data: m3Lessons } = useLessons(modules?.[2]?.id ?? '');
  const { data: m4Lessons } = useLessons(modules?.[3]?.id ?? '');
  const { data: m5Lessons } = useLessons(modules?.[4]?.id ?? '');
  const { data: m6Lessons } = useLessons(modules?.[5]?.id ?? '');

  const allModules = modules ?? [];

  const lessonsByModuleId = useMemo<Record<string, Lesson[]>>(() => ({
    [modules?.[0]?.id ?? '']: m1Lessons ?? [],
    [modules?.[1]?.id ?? '']: m2Lessons ?? [],
    [modules?.[2]?.id ?? '']: m3Lessons ?? [],
    [modules?.[3]?.id ?? '']: m4Lessons ?? [],
    [modules?.[4]?.id ?? '']: m5Lessons ?? [],
    [modules?.[5]?.id ?? '']: m6Lessons ?? [],
  }), [modules, m1Lessons, m2Lessons, m3Lessons, m4Lessons, m5Lessons, m6Lessons]);

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

  // Hero module : premier module debloque non entierement complete
  const heroModule = useMemo<Module | null>(() => {
    for (const mod of allModules) {
      const unlocked = isModuleUnlocked(mod.sort_order, progressByModule, allModules, lessonCountByModule);
      if (!unlocked) continue;
      const total = lessonCountByModule[mod.id] ?? 0;
      const completed = (progressByModule[mod.id] ?? []).filter(p => p.status === 'completed').length;
      if (total === 0 || completed < total) return mod;
    }
    for (let i = allModules.length - 1; i >= 0; i--) {
      const mod = allModules[i];
      if (isModuleUnlocked(mod.sort_order, progressByModule, allModules, lessonCountByModule)) return mod;
    }
    return allModules[0] ?? null;
  }, [allModules, progressByModule, lessonCountByModule]);

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

  // Stats MSA (modules M1-M10)
  const msaModules = allModules.filter(m => m.sort_order >= 1 && m.sort_order <= 10);
  const msaCompleted = msaModules.filter(m => {
    const total = lessonCountByModule[m.id] ?? 0;
    if (total === 0) return false;
    const completed = (progressByModule[m.id] ?? []).filter(p => p.status === 'completed').length;
    return completed >= total;
  }).length;

  // Dialecte count (modules dialectes - detectes par ID)
  const dialectModules = allModules.filter(m =>
    m.id.includes('darija') || m.id.includes('egyptian') ||
    m.id.includes('levantine') || m.id.includes('khaliji')
  );

  // Quran progress (detecte par ID)
  const quranModule = allModules.find(m => m.id.includes('quran'));
  const quranStudied = quranModule
    ? (progressByModule[quranModule.id] ?? []).filter(p => p.status === 'completed').length
    : 0;
  const quranMemorized = quranModule
    ? (progressByModule[quranModule.id] ?? []).filter(p => p.status === 'completed' && (p.score ?? 0) >= 90).length
    : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top']} >
        <ActivityIndicator size="large" color={colors.brand.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top']} >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.base,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Zone A - Header + Greeting */}
        <TodayHeader streak={streak} />

        {/* Zone C - Carte Continuer */}
        {heroModule ? (
          <ContinueCard
            module={heroModule}
            completedCount={heroCompleted}
            totalLessons={heroTotal}
            nextLesson={heroNextLesson}
          />
        ) : (
          /* Aucun module en cours -> invitation */
          <Pressable
            onPress={() => router.push('/(tabs)/parcours')}
            style={{
              backgroundColor: colors.background.card,
              borderRadius: borderRadius.md,
              borderWidth: 2,
              borderColor: colors.brand.primary,
              borderStyle: 'dashed',
              padding: spacing.xl,
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Text style={{
              fontFamily: typography.family.arabicBold,
              fontSize: typography.size.arabicTitle,
              lineHeight: Math.round(typography.size.arabicTitle * typography.lineHeight.arabic),
              color: colors.text.heroArabic,
              textAlign: 'center',
            }}>
              مرحبا بكم
            </Text>
            <Text style={{
              fontFamily: typography.family.uiMedium,
              fontSize: typography.size.body,
              color: colors.text.primary,
            }}>
              Commencer votre parcours
            </Text>
            <View style={{
              height: 44,
              borderRadius: borderRadius.pill,
              backgroundColor: colors.brand.primary,
              paddingHorizontal: spacing.lg,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                fontFamily: typography.family.uiBold,
                fontSize: typography.size.body,
                color: colors.text.inverse,
              }}>
                Explorer
              </Text>
            </View>
          </Pressable>
        )}

        {/* Zone D - Carte SRS */}
        <View style={{ marginTop: spacing.base }}>
          <SrsCard dueCards={dueCards} />
        </View>

        {/* Zone E - Explorer */}
        <View style={{ marginTop: spacing.xl }}>
          <ExploreSection
            msaProgress={{ completed: msaCompleted, total: msaModules.length }}
            dialectCount={dialectModules.length}
            quranProgress={{ studied: quranStudied, memorized: quranMemorized }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
