// app/(tabs)/learn.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing, Radius, Shadows, Layout } from '../../src/constants/theme';
import { useModules } from '../../src/hooks/useModules';
import { useLessons } from '../../src/hooks/useLessons';
import { useProgress, useInitFirstLesson } from '../../src/hooks/useProgress';
import type { Module } from '../../src/hooks/useModules';
import type { Lesson } from '../../src/hooks/useLessons';
import type { LessonProgress } from '../../src/hooks/useProgress';

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

// ── Composant Module 1 (avec accordion leçons) ─────────────

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

// ── Composant modules locked ───────────────────────────────

function LockedModuleCard({ module, number }: { module: Module; number: number }) {
  return (
    <View style={[styles.moduleCard, styles.moduleCardLocked]}>
      <View style={styles.moduleHeader}>
        <View style={styles.moduleHeaderLeft}>
          <Text style={styles.moduleLabel}>MODULE {number}</Text>
          <Text style={styles.moduleTitleAr}>{module.title_ar}</Text>
          <Text style={styles.moduleTitleFr}>{module.title_fr}</Text>
        </View>
        <Text style={styles.lockIcon}>🔒</Text>
      </View>
    </View>
  );
}

// ── Écran principal ────────────────────────────────────────

export default function LearnScreen() {
  const { data: modules, isLoading } = useModules();
  const { data: progress = [] } = useProgress();
  const { data: module1Lessons } = useLessons(modules?.[0]?.id ?? '');
  const initFirstLesson = useInitFirstLesson();

  // Initialiser la leçon 1 si aucune progression n'existe
  useEffect(() => {
    if (progress.length === 0 && module1Lessons && module1Lessons.length > 0) {
      initFirstLesson.mutate(module1Lessons[0].id);
    }
  }, [progress.length, module1Lessons]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Apprendre</Text>
        </View>

        {/* Modules */}
        <View style={styles.modulesList}>
          {modules?.map((module, index) => {
            if (index === 0) {
              return <Module1Card key={module.id} module={module} progressList={progress} />;
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
  header: {
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.textPrimary,
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
