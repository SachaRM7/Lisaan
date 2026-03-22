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
import { useDiacritics } from '../src/hooks/useDiacritics';
import { useWords } from '../src/hooks/useWords';
import { useSentences } from '../src/hooks/useSentences';
import { getCardsDueForReview, computeSRSUpdate, exerciseResultToQuality } from '../src/engines/srs';
import { generateReviewExercise, generateDiacriticReviewExercise } from '../src/engines/review-exercise-generator';
import { applyConfusionPairCap } from '../src/engines/srs';
import type { ExerciseConfig } from '../src/types/exercise';
import { CONFUSION_PAIRS } from '../src/constants/confusion-pairs';
import { ExerciseRenderer } from '../src/components/exercises/ExerciseRenderer';
import type { ExerciseResult } from '../src/types/exercise';
import type { SRSCard } from '../src/engines/srs';
import { updateStreak } from '../src/engines/streak';
import { addXP, calculateReviewXP } from '../src/engines/xp';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../src/constants/theme';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

export default function ReviewSession() {
  const router = useRouter();
  const { data: allCards = [] } = useSRSCards();
  const { data: allLetters = [] } = useLetters();
  const { data: allDiacritics = [] } = useDiacritics();
  const { data: allWords = [] } = useWords();
  const { data: allSentences = [] } = useSentences();
  const updateSRSCard = useUpdateSRSCard();
  const startTime = useMemo(() => Date.now(), []);

  const initialQueue = useMemo(() => {
    const capped = applyConfusionPairCap(allCards, CONFUSION_PAIRS);
    return getCardsDueForReview(capped);
  }, [allCards]);

  const [queue, setQueue] = useState<SRSCard[]>(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ card: SRSCard; correct: boolean }[]>([]);
  const [succeededCount, setSucceededCount] = useState(0);
  const [phase, setPhase] = useState<'session' | 'results'>('session');

  // Gelé au démarrage de la session — ne doit pas changer quand le cache se met à jour
  const [totalCards] = useState(initialQueue.length);

  function handleComplete(result: ExerciseResult) {
    const card = queue[currentIndex];
    const quality = exerciseResultToQuality(result.correct, result.attempts, result.time_ms);

    const update = computeSRSUpdate(card, quality);
    updateSRSCard.mutate({ itemType: card.item_type, itemId: card.item_id, update });

    setResults(prev => [...prev, { card, correct: result.correct }]);

    if (quality < 3) {
      setQueue(prev => {
        const next = [...prev];
        next.splice(currentIndex, 1);
        next.push(card);
        if (next.length === 0) setPhase('results');
        return next;
      });
    } else {
      const newSucceeded = succeededCount + 1;
      setSucceededCount(newSucceeded);
      if (newSucceeded >= totalCards) {
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
    const earnedXP = calculateReviewXP(totalCards);

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <Text style={styles.resultsTitle}>Session terminée ! 🎉</Text>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreNumber}>{totalCards}</Text>
            <Text style={styles.scoreLabel}>cartes révisées</Text>
            <Text style={styles.xpText}>+{earnedXP} XP</Text>
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
            onPress={() => {
              addXP(earnedXP);
              updateStreak();
              router.replace('/(tabs)/review' as never);
            }}
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

  const dataReady = allLetters.length > 0 || allDiacritics.length > 0 || allWords.length > 0 || allSentences.length > 0;
  if (!currentCard || !dataReady) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loader}>
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Générer l'exercice selon le type de carte ──────────
  let exercise: ExerciseConfig | null = null;

  if (currentCard.item_type === 'letter') {
    const targetLetter = allLetters.find(l => l.id === currentCard.item_id);
    if (targetLetter) {
      exercise = generateReviewExercise(currentCard, targetLetter, allLetters);
    }
  } else if (currentCard.item_type === 'diacritic') {
    const targetDiacritic = allDiacritics.find(d => d.id === currentCard.item_id);
    if (targetDiacritic) {
      exercise = generateDiacriticReviewExercise(currentCard, targetDiacritic, allDiacritics);
    }
  } else if (currentCard.item_type === 'word') {
    const targetWord = allWords.find(w => w.id === currentCard.item_id);
    if (targetWord) {
      const distractors = allWords
        .filter(w => w.id !== targetWord.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      exercise = {
        id: `review-word-${currentCard.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie ce mot ?',
        prompt: { ar: targetWord.arabic_vocalized },
        options: [
          { id: targetWord.id, text: { fr: targetWord.translation_fr }, correct: true },
          ...distractors.map(d => ({ id: d.id, text: { fr: d.translation_fr }, correct: false })),
        ].sort(() => Math.random() - 0.5),
        metadata: { word_id: targetWord.id },
      };
    }
  } else if (currentCard.item_type === 'sentence') {
    const targetSentence = allSentences.find(s => s.id === currentCard.item_id);
    if (targetSentence) {
      const distractors = allSentences
        .filter(s => s.id !== targetSentence.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      exercise = {
        id: `review-sentence-${currentCard.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie cette phrase ?',
        prompt: { ar: targetSentence.arabic_vocalized },
        options: [
          { id: targetSentence.id, text: { fr: targetSentence.translation_fr }, correct: true },
          ...distractors.map(d => ({ id: d.id, text: { fr: d.translation_fr }, correct: false })),
        ].sort(() => Math.random() - 0.5),
        metadata: { sentence_id: targetSentence.id },
      };
    }
  }

  if (!exercise) {
    // Item introuvable ou type inconnu — compter comme réussi pour ne pas bloquer
    const newSucceeded = succeededCount + 1;
    setSucceededCount(newSucceeded);
    if (newSucceeded >= totalCards) {
      setPhase('results');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
    return null;
  }

  const progress = succeededCount / totalCards;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Révision {succeededCount + 1} / {totalCards}
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
  xpText: { fontSize: FontSizes.heading, fontWeight: '700', color: Colors.primary, marginTop: 4 },
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
