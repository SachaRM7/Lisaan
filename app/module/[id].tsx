// app/module/[id].tsx
// Page détail module — liste des leçons avec animation stagger
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useModules } from '../../src/hooks/useModules';
import { useLessons } from '../../src/hooks/useLessons';
import { useProgress, useInitFirstLesson } from '../../src/hooks/useProgress';
import { useTheme } from '../../src/contexts/ThemeContext';
import { CircleProgress } from '../../src/components/ui/CircleProgress';
import type { Lesson } from '../../src/hooks/useLessons';
import type { LessonProgress } from '../../src/hooks/useProgress';

// ── Ligne de leçon ──────────────────────────────────────────

function LessonRow({
  lesson,
  progress,
  index,
  onPress,
}: {
  lesson: Lesson;
  progress: LessonProgress | undefined;
  index: number;
  onPress: () => void;
}) {
  const { colors, typography, spacing } = useTheme();
  const status = progress?.status;
  const isLocked = !status || status === 'locked';
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const arabicLineHeight = Math.round(typography.size.arabicBody * 1.9);

  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify().damping(16)}
      style={scaleStyle}
    >
      <Pressable
        onPress={isLocked ? undefined : onPress}
        onPressIn={() => { if (!isLocked) scale.value = withSpring(0.98, { damping: 20, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 20, stiffness: 300 }); }}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.subtle,
          },
          isLocked && { opacity: 0.4 },
          isCompleted && { opacity: 0.6 },
        ]}
      >
        {/* Numéro + dot in_progress */}
        <View style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.small,
            color: colors.text.secondary,
            textAlign: 'center',
          }}>
            {lesson.sort_order}
          </Text>
          {isInProgress && (
            <View style={{
              position: 'absolute',
              top: -2,
              right: 0,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: colors.brand.primary,
            }} />
          )}
        </View>

        {/* Titre FR */}
        <Text style={{
          flex: 1,
          fontFamily: typography.family.ui,
          fontSize: typography.size.body,
          color: colors.text.primary,
          marginLeft: spacing.xs,
        }}>
          {lesson.title_fr}
        </Text>

        {/* Titre arabe */}
        <Text style={{
          fontFamily: typography.family.arabic,
          fontSize: typography.size.arabicBody,
          lineHeight: arabicLineHeight,
          color: colors.text.heroArabic,
          marginHorizontal: spacing.sm,
        }}>
          {lesson.title_ar}
        </Text>

        {/* Pastille complété à droite */}
        {isCompleted && (
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.status.success,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="checkmark" size={12} color={colors.text.inverse} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Écran principal ────────────────────────────────────────

export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const { data: modules } = useModules();
  const { data: lessons, isLoading: lessonsLoading } = useLessons(id ?? '');
  const { data: progress = [] } = useProgress();
  const initFirstLesson = useInitFirstLesson();

  const module = useMemo(
    () => modules?.find(m => m.id === id) ?? null,
    [modules, id],
  );

  const moduleNumber = module?.sort_order ?? 1;

  const progressByLesson = useMemo<Record<string, LessonProgress>>(() => {
    const map: Record<string, LessonProgress> = {};
    for (const p of progress) {
      map[p.lesson_id] = p;
    }
    return map;
  }, [progress]);

  // Initialiser la 1ère leçon si aucune progress n'existe pour ce module
  React.useEffect(() => {
    if (!lessons || lessons.length === 0) return;
    const firstLesson = lessons[0];
    const firstProgress = progressByLesson[firstLesson.id];
    if (!firstProgress || firstProgress.status === 'locked') {
      initFirstLesson.mutate(firstLesson.id);
    }
  }, [lessons, progressByLesson]);

  const completedCount = useMemo(
    () => (lessons ?? []).filter(l => progressByLesson[l.id]?.status === 'completed').length,
    [lessons, progressByLesson],
  );

  const arabicTitleLineHeight = Math.round(typography.size.arabicTitle * 1.9);

  if (!module) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.brand.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Header ── */}
        <View style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.lg,
        }}>
          {/* Bouton retour */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.background.card,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.lg,
                ...shadows.subtle,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
          </Pressable>

          {/* Zone titre — empilée verticalement */}
          <View style={{ gap: spacing.micro }}>
            <Text style={{
              fontFamily: typography.family.uiMedium,
              fontSize: typography.size.tiny,
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.caps,
            }}>
              Module {moduleNumber}
            </Text>

            <Text style={{
              fontFamily: typography.family.uiBold,
              fontSize: typography.size.h1,
              color: colors.text.primary,
            }}>
              {module.title_fr}
            </Text>

            <Text style={{
              fontFamily: typography.family.arabic,
              fontSize: typography.size.arabicTitle,
              lineHeight: arabicTitleLineHeight,
              color: colors.text.heroArabic,
            }}>
              {module.title_ar}
            </Text>

            <View style={{ marginTop: spacing.xs }}>
              <CircleProgress
                completed={completedCount}
                total={lessons?.length ?? 0}
                size={44}
                strokeWidth={3}
              />
            </View>
          </View>
        </View>

        {/* ── Liste des leçons ── */}
        <View style={{
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.lg,
          marginHorizontal: spacing.lg,
          overflow: 'hidden',
          ...shadows.subtle,
        }}>
          {lessonsLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.brand.primary}
              style={{ padding: spacing.xl }}
            />
          ) : (
            (lessons ?? []).map((lesson, index) => {
              const prog = progressByLesson[lesson.id];
              return (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  progress={prog}
                  index={index}
                  onPress={() => router.push(`/lesson/${lesson.id}`)}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
