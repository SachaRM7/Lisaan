// src/components/lesson/LessonHub.tsx

import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import type { Lesson } from '../../types';
import type { LessonSection, SectionProgress } from '../../types/section';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui';

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
                    <Text style={{ fontSize: 20 }}>
                      {status === 'completed' ? '✅' : status === 'in_progress' ? '◐' : '🔒'}
                    </Text>
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
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.xs }}>
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.brand.primary }}>
                Leçon complétée !
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
                <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.primary }}>
                  {section.title_fr}
                </Text>
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
              variant="secondary"
              onPress={onStartFromBeginning}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
