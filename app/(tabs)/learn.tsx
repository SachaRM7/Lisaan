// app/(tabs)/learn.tsx
import { useState } from 'react';
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
import type { Module } from '../../src/hooks/useModules';
import type { Lesson } from '../../src/hooks/useLessons';

// ── Composant leçon ────────────────────────────────────────

function LessonRow({ lesson, onPress }: { lesson: Lesson; onPress: () => void }) {
  return (
    <Pressable style={styles.lessonRow} onPress={onPress}>
      <View style={styles.lessonLeft}>
        <Text style={styles.lessonOrder}>{lesson.sort_order}.</Text>
        <View style={styles.lessonTitles}>
          <Text style={styles.lessonTitleAr}>{lesson.title_ar}</Text>
          <Text style={styles.lessonTitleFr}>{lesson.title_fr}</Text>
        </View>
      </View>
      <Text style={styles.lessonStatus}>🔓</Text>
    </Pressable>
  );
}

// ── Composant Module 1 (avec accordion leçons) ─────────────

function Module1Card({ module }: { module: Module }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const { data: lessons, isLoading } = useLessons(module.id);

  return (
    <View style={[styles.moduleCard, styles.moduleCardActive]}>
      <Pressable style={styles.moduleHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.moduleHeaderLeft}>
          <Text style={styles.moduleLabel}>MODULE 1</Text>
          <Text style={styles.moduleTitleAr}>{module.title_ar}</Text>
          <Text style={styles.moduleTitleFr}>{module.title_fr}</Text>
        </View>
        <View style={styles.moduleHeaderRight}>
          <Text style={styles.moduleLessonCount}>{lessons?.length ?? 0}/7</Text>
          <Text style={styles.moduleChevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.lessonsList}>
          <View style={styles.lessonsDivider} />
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ padding: Spacing.lg }} />
          ) : (
            lessons?.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                onPress={() => router.push(`/lesson/${lesson.id}`)}
              />
            ))
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
              return <Module1Card key={module.id} module={module} />;
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
});
