// app/lesson/[id]/exercises.tsx
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../src/db/remote';
import { useLetters, useLettersForLesson } from '../../../src/hooks/useLetters';
import { generateLetterExercises } from '../../../src/engines/exercise-generator';
import { ExerciseRenderer } from '../../../src/components/exercises/ExerciseRenderer';
import type { ExerciseResult } from '../../../src/types/exercise';
import { useUpdateSRSCard, useSRSCards } from '../../../src/hooks/useSRSCards';
import { computeSRSUpdate, exerciseResultToQuality } from '../../../src/engines/srs';
import { useCompleteLesson } from '../../../src/hooks/useProgress';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../../../src/constants/theme';

const LESSON_LETTER_RANGES: Record<number, [number, number]> = {
  1: [1, 4], 2: [5, 7], 3: [8, 11], 4: [12, 15],
  5: [16, 19], 6: [20, 23], 7: [24, 28],
};

function getEncouragement(pct: number): string {
  if (pct === 100) return 'Parfait ! 🎉';
  if (pct >= 70) return 'Bien joué ! Continue comme ça.';
  return 'Pas mal ! Refais la leçon pour consolider.';
}

export default function ExercisesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [phase, setPhase] = useState<'exercises' | 'results'>('exercises');
  const startTime = useMemo(() => Date.now(), []);
  const updateSRSCard = useUpdateSRSCard();
  const { data: srsCards } = useSRSCards();
  const completeLesson = useCompleteLesson();

  // Charger la leçon
  const { data: lesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const range = lesson ? LESSON_LETTER_RANGES[lesson.sort_order as number] : null;
  const { data: lessonLetters } = useLettersForLesson(range?.[0] ?? 0, range?.[1] ?? 0);
  const { data: allLetters } = useLetters();

  const exercises = useMemo(() => {
    if (!lessonLetters || !allLetters) return [];
    return generateLetterExercises(lessonLetters, allLetters);
  }, [lessonLetters, allLetters]);

  function handleComplete(result: ExerciseResult) {
    const newResults = [...results, result];
    setResults(newResults);

    // Mettre à jour la carte SRS pour la lettre de cet exercice
    const currentExercise = exercises[currentIndex];
    const letterId = currentExercise?.metadata?.letter_id as string | undefined;
    if (letterId && srsCards) {
      const card = srsCards.find((c) => c.item_id === letterId);
      if (card) {
        const quality = exerciseResultToQuality(result.correct, result.attempts, result.time_ms);
        const update = computeSRSUpdate(card, quality);
        updateSRSCard.mutate({ itemType: 'letter', itemId: letterId, update });
      }
    }

    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setPhase('results');
    }
  }

  // ── Écran de résultats ─────────────────────────────────────
  if (phase === 'results') {
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const totalTime = Math.round((Date.now() - startTime) / 1000);

    function handleContinue() {
      if (id) {
        completeLesson.mutate({
          lessonId: id as string,
          score: pct,
          timeSpentSeconds: totalTime,
        });
      }
      router.replace('/(tabs)/learn');
    }

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <Text style={styles.resultsTitle}>Leçon terminée !</Text>
          <Text style={styles.encouragement}>{getEncouragement(pct)}</Text>

          {/* Score */}
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNumber}>{correct}/{total}</Text>
            <Text style={styles.scoreLabel}>bonnes réponses</Text>
            <View style={styles.scoreBarTrack}>
              <View style={[styles.scoreBarFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.scorePct}>{pct}%</Text>
          </View>

          {/* Temps */}
          <Text style={styles.timeText}>
            Temps total : {totalTime < 60 ? `${totalTime}s` : `${Math.floor(totalTime / 60)}min ${totalTime % 60}s`}
          </Text>

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaLabel}>Continuer →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Écran d'exercice ───────────────────────────────────────
  const currentExercise = exercises[currentIndex];

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loader}>
          <Text style={styles.loadingText}>Génération des exercices…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercice {currentIndex + 1} / {exercises.length}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Barre de progression */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((currentIndex) / exercises.length) * 100}%` }]} />
      </View>

      <ExerciseRenderer key={currentExercise.id} config={currentExercise} onComplete={handleComplete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FontSizes.body, color: Colors.textSecondary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backArrow: { fontSize: 22, color: Colors.textSecondary },
  headerTitle: { fontSize: FontSizes.caption, fontWeight: '600', color: Colors.textPrimary },

  // Progress bar
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: Layout.screenPaddingH,
    marginTop: Spacing.sm,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },

  // Résultats
  resultsScroll: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.xl,
  },
  resultsTitle: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  encouragement: {
    fontSize: FontSizes.heading,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing['3xl'],
    alignItems: 'center',
    width: '100%',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 64,
  },
  scoreLabel: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  scoreBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  scorePct: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    color: Colors.primary,
  },
  timeText: {
    fontSize: FontSizes.caption,
    color: Colors.textMuted,
  },
  ctaBtn: {
    width: '100%',
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  ctaLabel: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
});
