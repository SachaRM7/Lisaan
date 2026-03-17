// app/review-session.tsx
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSRSCards, useUpdateSRSCard } from '../src/hooks/useSRSCards';
import { useLetters } from '../src/hooks/useLetters';
import { getCardsDueForReview, computeSRSUpdate, exerciseResultToQuality } from '../src/engines/srs';
import { generateReviewExercise } from '../src/engines/review-exercise-generator';
import { applyConfusionPairCap } from '../src/engines/srs';
import { CONFUSION_PAIRS } from '../src/constants/confusion-pairs';
import { ExerciseRenderer } from '../src/components/exercises/ExerciseRenderer';
import type { ExerciseResult } from '../src/types/exercise';
import type { SRSCard } from '../src/engines/srs';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../src/constants/theme';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

export default function ReviewSession() {
  const router = useRouter();
  const { data: allCards = [] } = useSRSCards();
  const { data: allLetters = [] } = useLetters();
  const updateSRSCard = useUpdateSRSCard();
  const startTime = useMemo(() => Date.now(), []);

  // Appliquer le plafonnement confusion pairs puis filtrer les dues
  const initialQueue = useMemo(() => {
    const capped = applyConfusionPairCap(allCards, CONFUSION_PAIRS);
    return getCardsDueForReview(capped);
  }, [allCards]);

  const [queue, setQueue] = useState<SRSCard[]>(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ card: SRSCard; correct: boolean }[]>([]);
  const [phase, setPhase] = useState<'session' | 'results'>('session');

  const totalCards = initialQueue.length;
  const completedCount = results.length;

  function handleComplete(result: ExerciseResult) {
    const card = queue[currentIndex];
    const quality = exerciseResultToQuality(result.correct, result.attempts, result.time_ms);

    // Mettre à jour la carte SRS
    const update = computeSRSUpdate(card, quality);
    updateSRSCard.mutate({ itemType: card.item_type, itemId: card.item_id, update });

    setResults(prev => [...prev, { card, correct: result.correct }]);

    if (quality < 3) {
      // Carte échouée : retirer de la position courante, remettre en fin de file
      setQueue(prev => {
        const next = [...prev];
        next.splice(currentIndex, 1);
        next.push(card);
        if (next.length === 0) setPhase('results');
        return next;
      });
      // currentIndex reste le même → pointe vers la prochaine carte
    } else {
      // Carte réussie : avancer
      if (currentIndex + 1 >= queue.length) {
        setPhase('results');
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }
  }

  // ── Résultats ──────────────────────────────────────────
  if (phase === 'results') {
    const correct = results.filter(r => r.correct).length;
    const wrong = results.length - correct;
    const totalTime = Math.round((Date.now() - startTime) / 1000);

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <Text style={styles.resultsTitle}>Session terminée ! 🎉</Text>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreNumber}>{totalCards}</Text>
            <Text style={styles.scoreLabel}>cartes révisées</Text>
          </View>

          <View style={styles.detailBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>✓</Text>
              <Text style={[styles.detailText, { color: Colors.success }]}>
                {correct} correctes du premier coup
              </Text>
            </View>
            {wrong > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>↻</Text>
                <Text style={[styles.detailText, { color: Colors.warning }]}>
                  {wrong} à revoir bientôt
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.timeText}>Temps : {formatTime(totalTime)}</Text>

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.replace('/(tabs)/review' as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaLabel}>Continuer →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Session ────────────────────────────────────────────
  const currentCard = queue[currentIndex];

  if (!currentCard || allLetters.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loader}>
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const targetLetter = allLetters.find(l => l.id === currentCard.item_id);

  if (!targetLetter) {
    // Passer à la carte suivante si la lettre n'est pas trouvée
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setPhase('results');
    }
    return null;
  }

  const exercise = generateReviewExercise(currentCard, targetLetter, allLetters);
  const progress = completedCount / totalCards;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Révision {currentIndex + 1} / {queue.length}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Barre de progression */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ExerciseRenderer
        key={`${currentCard.id}-${currentIndex}`}
        config={exercise}
        onComplete={handleComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FontSizes.body, color: Colors.textSecondary },

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
    textAlign: 'center',
  },
  scoreBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing['3xl'],
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 64,
  },
  scoreLabel: { fontSize: FontSizes.body, color: Colors.textSecondary },
  detailBox: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailIcon: { fontSize: FontSizes.body, fontWeight: '700' },
  detailText: { fontSize: FontSizes.body },
  timeText: { fontSize: FontSizes.caption, color: Colors.textMuted },
  ctaBtn: {
    width: '100%',
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { fontSize: FontSizes.body, fontWeight: '700', color: Colors.textOnPrimary },
});
