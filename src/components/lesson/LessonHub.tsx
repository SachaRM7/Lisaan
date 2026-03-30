// src/components/lesson/LessonHub.tsx

import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import type { Lesson } from '../../types';
import type { LessonSection, SectionProgress } from '../../types/section';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui';
import { Ionicons } from '@expo/vector-icons';

// ── Types ─────────────────────────────────────────────────────

interface LessonHubProps {
  lesson: Lesson;
  sections: LessonSection[];
  sectionProgress: SectionProgress[];
  lessonStatus: 'not_started' | 'in_progress' | 'completed';
  onStartFromBeginning: () => void;
  onResumeAtSection: (sectionIndex: number) => void;
  onReplayTeaching: (sectionIndex: number) => void;
  onReplayExercises: (sectionIndex: number) => void;
  onBack: () => void;
}

// ── Composant principal ───────────────────────────────────────

export function LessonHub({
  lesson,
  sections,
  sectionProgress,
  lessonStatus,
  onStartFromBeginning,
  onResumeAtSection,
  onReplayTeaching,
  onReplayExercises,
  onBack,
}: LessonHubProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const currentSectionIndex = sectionProgress.findIndex(p => p.status !== 'completed');
  const resumeIndex = currentSectionIndex >= 0 ? currentSectionIndex : 0;

  function getSectionStatus(index: number): 'completed' | 'in_progress' | 'locked' {
    const prog = sectionProgress[index];
    if (!prog) return 'locked';
    if (prog.status === 'completed') return 'completed';
    if (prog.status === 'not_started') return 'locked';
    return 'in_progress';
  }

  function getExerciseProgress(index: number): string | null {
    const prog = sectionProgress[index];
    if (!prog || prog.status === 'not_started' || prog.status === 'completed') return null;
    const section = sections[index];
    if (!section) return null;
    return `Exercice ${prog.nextExerciseIndex} / ${section.exercises.length}`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.subtle,
      }}>
        <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, justifyContent: 'center' }} hitSlop={12}>
          <Text style={{ fontSize: 22, color: colors.text.secondary }}>←</Text>
        </TouchableOpacity>
        <Text
          style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.h2, color: colors.text.primary, flex: 1, textAlign: 'center', marginHorizontal: spacing.sm }}
          numberOfLines={1}
        >
          {lesson.title_fr}
        </Text>
        <View style={{ width: 36, height: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      >
        {/* Fallback — statut inattendu (ex: 'available' non normalisé) */}
        {lessonStatus !== 'in_progress' && lessonStatus !== 'completed' && (
          <Button
            label="Commencer la leçon"
            variant="primary"
            onPress={onStartFromBeginning}
          />
        )}

        {/* Mode EN COURS */}
        {lessonStatus === 'in_progress' && (
          <>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xs }}>
              Tu en étais à la section {resumeIndex + 1} / {sections.length}
            </Text>

            {sections.map((section, index) => {
              const status = getSectionStatus(index);
              const exerciseInfo = getExerciseProgress(index);

              return (
                <View
                  key={section.id}
                  style={{
                    backgroundColor: status === 'locked' ? colors.background.main : colors.background.card,
                    borderRadius: borderRadius.md,
                    padding: spacing.base,
                    borderWidth: status === 'in_progress' ? 2 : 1,
                    borderColor: status === 'in_progress' ? colors.brand.primary : colors.border.subtle,
                    gap: spacing.xs,
                    opacity: status === 'locked' ? 0.5 : 1,
                    ...shadows.subtle,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    {status === 'completed' ? (
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.status.successLight, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={14} color={colors.status.success} />
                      </View>
                    ) : status === 'in_progress' ? (
                      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand.primary }} />
                      </View>
                    ) : (
                      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border.medium, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="lock-closed" size={12} color={colors.text.secondary} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{
                        fontFamily: typography.family.uiMedium,
                        fontSize: typography.size.body,
                        color: status === 'locked' ? colors.text.secondary : colors.text.primary,
                      }}>
                        {section.title_fr}
                      </Text>
                      {exerciseInfo && (
                        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
                          {exerciseInfo}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}

            <Button
              label="Reprendre où j'en étais"
              variant="primary"
              onPress={() => onResumeAtSection(resumeIndex)}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}

        {/* Mode COMPLÉTÉE */}
        {lessonStatus === 'completed' && (
          <>
            {/* Médaillon doré + titre */}
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm }}>
              <View style={{
                width: 120, height: 120, borderRadius: 60,
                backgroundColor: colors.background.card,
                borderWidth: 2, borderColor: colors.accent.gold,
                alignItems: 'center', justifyContent: 'center',
                ...shadows.medium,
              }}>
                <Ionicons name="star" size={48} color={colors.accent.gold} />
              </View>
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary, marginTop: spacing.xs }}>
                Leçon Complétée !
              </Text>
            </View>

            {sections.map((section, index) => (
              <View key={section.id} style={{
                backgroundColor: colors.background.card,
                borderRadius: borderRadius.md,
                padding: spacing.base,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                gap: spacing.sm,
                ...shadows.subtle,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary, flex: 1, marginRight: spacing.sm }}>
                    {section.title_fr}
                  </Text>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.status.successLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={14} color={colors.status.success} />
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border.subtle }} />
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label="Relire"
                    variant="secondary"
                    onPress={() => onReplayTeaching(index)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="S'exercer"
                    variant="primary"
                    onPress={() => onReplayExercises(index)}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ))}

            <Button
              label="Tout refaire depuis le début"
              variant="ghost"
              onPress={onStartFromBeginning}
              style={{ marginTop: spacing.sm, alignSelf: 'center' }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
