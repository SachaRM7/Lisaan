// src/components/lesson/LessonHub.tsx

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import type { Lesson } from '../../types';
import type { LessonSection, SectionProgress } from '../../types/section';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../../constants/theme';

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
  // Trouver la section en cours (première non-complétée)
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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title_fr}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Mode EN COURS */}
        {lessonStatus === 'in_progress' && (
          <>
            <Text style={styles.resumeLabel}>
              Tu en étais à la section {resumeIndex + 1} / {sections.length}
            </Text>

            {sections.map((section, index) => {
              const status = getSectionStatus(index);
              const exerciseInfo = getExerciseProgress(index);

              return (
                <View
                  key={section.id}
                  style={[
                    styles.sectionCard,
                    status === 'in_progress' && styles.sectionCardActive,
                    status === 'locked' && styles.sectionCardLocked,
                  ]}
                >
                  <View style={styles.sectionCardRow}>
                    <Text style={styles.sectionIcon}>
                      {status === 'completed' ? '✅' : status === 'in_progress' ? '◐' : '🔒'}
                    </Text>
                    <View style={styles.sectionCardInfo}>
                      <Text style={[
                        styles.sectionCardTitle,
                        status === 'locked' && styles.sectionCardTitleLocked,
                      ]}>
                        {section.title_fr}
                      </Text>
                      {exerciseInfo && (
                        <Text style={styles.sectionCardSub}>{exerciseInfo}</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={() => onResumeAtSection(resumeIndex)}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaPrimaryLabel}>Reprendre où j'en étais</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Mode COMPLÉTÉE */}
        {lessonStatus === 'completed' && (
          <>
            <View style={styles.completedHeader}>
              <Text style={styles.completedTitle}>Leçon complétée !</Text>
            </View>

            {sections.map((section, index) => (
              <View key={section.id} style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>{section.title_fr}</Text>
                <View style={styles.replayRow}>
                  <TouchableOpacity
                    style={styles.replayBtn}
                    onPress={() => onReplayTeaching(index)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.replayBtnLabel}>Relire</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.replayBtn}
                    onPress={() => onReplayExercises(index)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.replayBtnLabel}>S'exercer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={onStartFromBeginning}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaSecondaryLabel}>Tout refaire depuis le début</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const PRIMARY = '#2D6A4F';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF5' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FAFAF5',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backArrow: { fontSize: 22, color: Colors.textSecondary },
  lessonTitle: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },

  scroll: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.md,
  },

  // Mode en cours
  resumeLabel: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  sectionCardActive: {
    borderColor: PRIMARY,
    borderWidth: 2,
  },
  sectionCardLocked: {
    backgroundColor: '#F0F0F0',
  },
  sectionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionCardInfo: {
    flex: 1,
    gap: 2,
  },
  sectionCardTitle: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionCardTitleLocked: {
    color: Colors.textMuted,
  },
  sectionCardSub: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },

  // Mode complétée
  completedHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  completedTitle: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    color: PRIMARY,
  },

  replayRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  replayBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    alignItems: 'center',
  },
  replayBtnLabel: {
    fontSize: FontSizes.small,
    fontWeight: '600',
    color: PRIMARY,
  },

  // CTAs
  ctaPrimary: {
    marginTop: Spacing.md,
    height: Layout.buttonHeight,
    backgroundColor: PRIMARY,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryLabel: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaSecondary: {
    marginTop: Spacing.sm,
    height: Layout.buttonHeight,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSecondaryLabel: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
});
