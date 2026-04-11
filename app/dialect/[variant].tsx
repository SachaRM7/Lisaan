// app/dialect/[variant].tsx
// Dialect interior screen - generic screen parametrized by variant (Mission 5 E20)

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useModules } from '../../src/hooks/useModules';
import { useLessons } from '../../src/hooks/useLessons';
import { useProgress } from '../../src/hooks/useProgress';
import { useTheme } from '../../src/contexts/ThemeContext';
import { variantThemes } from '../../src/constants/theme';
import type { VariantKey } from '../../src/constants/theme';
import type { Lesson } from '../../src/hooks/useLessons';
import type { LessonProgress } from '../../src/hooks/useProgress';

const VALID_VARIANTS: VariantKey[] = ['darija', 'egyptian', 'levantine', 'khaliji'];

export default function DialecteScreen() {
  const { variant } = useLocalSearchParams<{ variant: string }>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();

  const safeVariant = (VALID_VARIANTS.includes(variant as VariantKey) ? variant : 'darija') as VariantKey;
  const vt = variantThemes[safeVariant];

  const { data: modules, isLoading } = useModules();
  const { data: progress = [] } = useProgress();

  // Module dialecte correspondant
  const dialecteModule = useMemo(
    () => modules?.find(m => m.id.includes(safeVariant)),
    [modules, safeVariant],
  );

  const { data: lessons } = useLessons(dialecteModule?.id ?? '');

  // Module 2 MSA complet (prerequis)?
  const module2 = modules?.find(m => m.sort_order === 2);
  const { data: m2Lessons } = useLessons(module2?.id ?? '');
  const m2Completed = useMemo(() => {
    if (!module2 || !m2Lessons?.length) return false;
    const m2LessonIds = new Set(m2Lessons.map(l => l.id));
    const m2Progress = progress.filter(p => m2LessonIds.has(p.lesson_id));
    return m2Progress.filter(p => p.status === 'completed').length >= m2Lessons.length;
  }, [module2, m2Lessons, progress]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        <ActivityIndicator size="large" color={vt.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      {/* Header avec retour */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.base,
        paddingBottom: spacing.sm,
        gap: spacing.sm,
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: spacing.xs }}>
          <Ionicons name="chevron-back" size={24} color={vt.accent} />
        </Pressable>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.h2,
          color: colors.text.primary,
          flex: 1,
        }}>
          {vt.label}
        </Text>
        <View style={{ height: 2, flex: 1, backgroundColor: `${vt.accent}33` }} />
      </View>

      {/* Header Card */}
      <View style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
      }}>
        {/* Ligne accent sous le titre */}
        <View style={{ height: 2, width: 60, backgroundColor: vt.accent, borderRadius: 1, marginBottom: spacing.xs }} />

        {/* Titre arabe */}
        <Text style={{
          fontFamily: typography.family.arabicBold,
          fontSize: typography.size.arabicTitle,
          lineHeight: Math.round(typography.size.arabicTitle * typography.lineHeight.arabic),
          color: colors.text.heroArabic,
          textAlign: 'center',
        }}>
          {vt.labelAr}
        </Text>

        {/* Sous-titre FR */}
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.body,
          color: colors.text.secondary,
          textAlign: 'center',
        }}>
          {vt.label}
        </Text>

        {/* Barre de progression */}
        {dialecteModule && lessons && (
          <View style={{ width: '100%', alignItems: 'center', gap: spacing.xs }}>
            <View style={{
              height: 4,
              width: '60%',
              backgroundColor: colors.background.group,
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${lessons.length > 0 ? 0 : 0}%`,
                backgroundColor: vt.accent,
                borderRadius: 2,
              }} />
            </View>
            <Text style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.small,
              color: colors.text.secondary,
            }}>
              {lessons.length} lecons - a decouvrir
            </Text>
          </View>
        )}

        {/* Prerequis */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          marginTop: spacing.xs,
        }}>
          {m2Completed ? (
            <>
              <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
              <Text style={{
                fontFamily: typography.family.ui,
                fontSize: typography.size.small,
                color: colors.status.success,
              }}>
                Prerequis Module 2 MSA complete
              </Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 14 }}>TIP</Text>
              <Text style={{
                fontFamily: typography.family.ui,
                fontSize: typography.size.small,
                color: colors.text.secondary,
              }}>
                Recommande : completer Module 2 MSA
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Liste des lecons */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Titre section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
          <View style={{ width: 4, height: 24, backgroundColor: vt.accent, borderRadius: 2 }} />
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.h2,
            color: colors.text.primary,
          }}>
            Lecons
          </Text>
        </View>

        {!dialecteModule || !lessons?.length ? (
          <View style={{
            backgroundColor: colors.background.group,
            borderRadius: borderRadius.md,
            padding: spacing.xl,
            alignItems: 'center',
          }}>
            <Text style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.body,
              color: colors.text.secondary,
              textAlign: 'center',
            }}>
              Aucun contenu {vt.label} disponible pour le moment.
            </Text>
          </View>
        ) : (
          <>{lessons.map((lesson, index) => (
            <DialecteLessonRow
              key={lesson.id}
              lesson={lesson}
              variant={safeVariant}
              index={index + 1}
              progress={progress.find(p => p.lesson_id === lesson.id)}
              onPress={() => router.push(`/lesson/${lesson.id}` as any)}
            />
          ))}</>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DialecteLessonRow({
  lesson,
  variant,
  index,
  progress,
  onPress,
}: {
  lesson: Lesson;
  variant: VariantKey;
  index: number;
  progress?: LessonProgress;
  onPress: () => void;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const vt = variantThemes[variant];
  const arabicLineHeight = Math.round(typography.size.arabicSmall * typography.lineHeight.arabic);

  const status = progress?.status ?? 'locked';
  const isLocked = status === 'locked';

  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        opacity: isLocked ? 0.5 : 1,
        borderLeftWidth: 3,
        borderLeftColor: vt.accent,
      }}
    >
      {/* Cercle numero */}
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: isLocked ? colors.status.disabled : vt.accent,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {status === 'completed' ? (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        ) : isLocked ? (
          <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
        ) : (
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.small,
            color: '#FFFFFF',
          }}>
            {index}
          </Text>
        )}
      </View>

      {/* Textes */}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: typography.family.uiMedium,
          fontSize: typography.size.body,
          color: colors.text.primary,
        }}>
          {lesson.title_fr}
        </Text>
        {lesson.title_ar && (
          <Text style={{
            fontFamily: typography.family.arabic,
            fontSize: typography.size.arabicSmall,
            lineHeight: arabicLineHeight,
            color: colors.text.heroArabic,
          }}>
            {lesson.title_ar}
          </Text>
        )}
      </View>

      {/* Statut */}
      {status === 'completed' && (
        <Text style={{ fontSize: 16 }}>OK</Text>
      )}
      {!isLocked && status !== 'completed' && (
        <Ionicons name="chevron-forward" size={18} color={vt.accent} />
      )}
    </Pressable>
  );
}
