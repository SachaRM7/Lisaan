// app/(tabs)/parcours.tsx
// Screen: structured MSA + Dialectes + Coranique catalog (Mission 4 E20)
import React, { useMemo, createElement } from 'react';
import { View, ScrollView, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useModules } from '../../src/hooks/useModules';
import { useLessons } from '../../src/hooks/useLessons';
import { useProgress } from '../../src/hooks/useProgress';
import { useTheme } from '../../src/contexts/ThemeContext';
import { variantThemes } from '../../src/constants/theme';
import { SectionHeader } from '../../src/components/parcours/SectionHeader';
import { MsaModuleList } from '../../src/components/parcours/MsaModuleList';
import { DialecteCard } from '../../src/components/parcours/DialecteCard';
import { QuranicCard } from '../../src/components/parcours/QuranicCard';
import type { Module } from '../../src/hooks/useModules';
import type { LessonProgress } from '../../src/hooks/useProgress';

const DIALECTE_VARIANTS = ['darija', 'egyptian', 'levantine', 'khaliji'] as const;

export default function ParcoursScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { data: modules, isLoading } = useModules();
  const { data: progress = [] } = useProgress();

  const { data: m1Lessons } = useLessons(modules?.[0]?.id ?? '');
  const { data: m2Lessons } = useLessons(modules?.[1]?.id ?? '');
  const { data: m3Lessons } = useLessons(modules?.[2]?.id ?? '');
  const { data: m4Lessons } = useLessons(modules?.[3]?.id ?? '');
  const { data: m5Lessons } = useLessons(modules?.[4]?.id ?? '');
  const { data: m6Lessons } = useLessons(modules?.[5]?.id ?? '');
  const { data: m7Lessons } = useLessons(modules?.[6]?.id ?? '');
  const { data: m8Lessons } = useLessons(modules?.[7]?.id ?? '');
  const { data: m9Lessons } = useLessons(modules?.[8]?.id ?? '');
  const { data: m10Lessons } = useLessons(modules?.[9]?.id ?? '');

  const allModules = modules ?? [];

  const lessonsByModuleId = useMemo(() => {
    const map = {};
    allModules.forEach((mod, i) => {
      const lessonSets = [m1Lessons, m2Lessons, m3Lessons, m4Lessons, m5Lessons,
                          m6Lessons, m7Lessons, m8Lessons, m9Lessons, m10Lessons];
      map[mod.id] = (lessonSets[i] ?? []).filter(l => l.module_id === mod.id);
    });
    for (const mod of allModules) {
      if (!map[mod.id]) map[mod.id] = [];
    }
    return map;
  }, [allModules, m1Lessons, m2Lessons, m3Lessons, m4Lessons, m5Lessons,
      m6Lessons, m7Lessons, m8Lessons, m9Lessons, m10Lessons]);

  const lessonCountByModule = useMemo(() => {
    const counts = {};
    for (const [modId, lessons] of Object.entries(lessonsByModuleId)) {
      counts[modId] = lessons.length;
    }
    return counts;
  }, [lessonsByModuleId]);

  const progressByModule = useMemo(() => {
    const byMod = {};
    for (const mod of allModules) {
      const modLessonIds = new Set((lessonsByModuleId[mod.id] ?? []).map(l => l.id));
      byMod[mod.id] = progress.filter(p => modLessonIds.has(p.lesson_id));
    }
    return byMod;
  }, [allModules, lessonsByModuleId, progress]);

  const msaModules = useMemo(
    () => allModules.filter(m => m.sort_order >= 1 && m.sort_order <= 10)
      .sort((a, b) => a.sort_order - b.sort_order),
    [allModules],
  );

  const quranModule = useMemo(
    () => allModules.find(m => m.id.includes('quran')),
    [allModules],
  );

  const module2 = allModules.find(m => m.sort_order === 2);
  const module2Completed = module2
    ? (progressByModule[module2.id] ?? []).filter(p => p.status === 'completed').length >=
      (lessonCountByModule[module2.id] ?? 0)
    : false;

  const dialecteProgress = useMemo(() => {
    const result = {};
    for (const dv of DIALECTE_VARIANTS) {
      const mod = allModules.find(m => m.id.includes(dv));
      if (mod) {
        const total = lessonCountByModule[mod.id] ?? 0;
        const completed = (progressByModule[mod.id] ?? []).filter(p => p.status === 'completed').length;
        result[dv] = { completed, total };
      } else {
        result[dv] = { completed: 0, total: 0 };
      }
    }
    return result;
  }, [allModules, lessonCountByModule, progressByModule]);

  const quranStudied = quranModule
    ? (progressByModule[quranModule.id] ?? []).filter(p => p.status === 'completed').length
    : 0;
  const quranMemorized = quranModule
    ? (progressByModule[quranModule.id] ?? []).filter(p => p.status === 'completed' && (p.score ?? 0) >= 90).length
    : 0;

  if (isLoading) {
    return createElement(SafeAreaView,
      { style: { flex: 1, backgroundColor: colors.background.main } },
      createElement(ActivityIndicator, { size: 'large', color: colors.brand.primary, style: { flex: 1 } })
    );
  }

  return createElement(SafeAreaView,
    { style: { flex: 1, backgroundColor: colors.background.main } },
    createElement(ScrollView,
      {
        contentContainerStyle: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 },
        showsVerticalScrollIndicator: false,
      },
      createElement(Text, {
        style: { fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary, marginBottom: spacing.xl },
      }, 'Parcours'),
      // MSA Section
      createElement(SectionHeader, {
        accentColor: variantThemes.msa.accent,
        title: 'Arabe Standard',
        subtitle: 'Le tronc commun',
      }),
      createElement(View, {
        style: { backgroundColor: colors.background.card, borderRadius: 16, padding: spacing.md, marginBottom: spacing.xl },
      }, createElement(MsaModuleList, {
        modules: msaModules,
        lessonsByModuleId,
        progressByModule,
        lessonCountByModule,
      })),
      // Dialectes Section
      createElement(SectionHeader, {
        accentColor: variantThemes.darija.accent,
        title: 'Dialectes',
        subtitle: 'Les couleurs de l arabe',
      }),
      !module2Completed && createElement(View, {
        style: { backgroundColor: colors.status.warningLight, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
      },
        createElement(Text, { style: { fontSize: 14 } }, 'TIP'),
        createElement(Text, {
          style: { fontFamily: typography.family.ui, fontSize: typography.size.small, color: '#92400E', flex: 1 },
        }, 'Recommande : completer le Module 2 avant de commencer les dialectes')
      ),
      createElement(View, { style: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl } },
        ...DIALECTE_VARIANTS.slice(0, 2).map(dv =>
          createElement(View, { key: dv, style: { flex: 1 } },
            createElement(DialecteCard, {
              variant: dv,
              progress: dialecteProgress[dv],
              onPress: () => router.push(`/dialect/${dv}`),
            })
          )
        )
      ),
      createElement(View, { style: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl } },
        ...DIALECTE_VARIANTS.slice(2, 4).map(dv =>
          createElement(View, { key: dv, style: { flex: 1 } },
            createElement(DialecteCard, {
              variant: dv,
              progress: dialecteProgress[dv],
              onPress: () => router.push(`/dialect/${dv}`),
            })
          )
        )
      ),
      // Coranique Section
      createElement(SectionHeader, {
        accentColor: variantThemes.quranic.accent,
        title: 'Arabe Coranique',
        subtitle: 'Comprendre les sourates',
      }),
      createElement(QuranicCard, {
        studiedCount: quranStudied,
        memorizedCount: quranMemorized,
        onPress: () => router.push('/quran'),
      })
    )
  );
}
