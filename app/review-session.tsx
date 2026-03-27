// app/review-session.tsx
import { useState, useMemo } from 'react';
import {
  View,
  Text,
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
import { useTheme } from '../src/contexts/ThemeContext';
import { Button } from '../src/components/ui';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

export default function ReviewSession() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.xl, alignItems: 'center', gap: spacing.xl }}>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary, textAlign: 'center' }}>
            Session terminée ! 🎉
          </Text>

          <View style={{
            backgroundColor: colors.background.group,
            borderRadius: borderRadius.xl,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.lg,
            alignItems: 'center',
            width: '100%',
            borderWidth: 1,
            borderColor: colors.border.subtle,
            gap: spacing.sm,
          }}>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: 56, color: colors.brand.primary, lineHeight: 64 }}>
              {totalCards}
            </Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary }}>
              cartes révisées
            </Text>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.brand.primary, marginTop: spacing.xs }}>
              +{earnedXP} XP
            </Text>
          </View>

          <View style={{
            width: '100%',
            backgroundColor: colors.background.card,
            borderRadius: borderRadius.md,
            padding: spacing.base,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            gap: spacing.sm,
            ...shadows.subtle,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body }}>✓</Text>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.status.success }}>
                {correct} correctes du premier coup
              </Text>
            </View>
            {wrong > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body }}>↻</Text>
                <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.accent.gold }}>
                  {wrong} à revoir bientôt
                </Text>
              </View>
            )}
          </View>

          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
            Temps : {formatTime(totalTime)}
          </Text>

          <Button
            label="Continuer →"
            variant="primary"
            onPress={() => {
              addXP(earnedXP);
              updateStreak();
              router.replace('/(tabs)/review' as never);
            }}
            style={{ width: '100%' }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Session ────────────────────────────────────────────
  const currentCard = queue[currentIndex];

  const dataReady = allLetters.length > 0 || allDiacritics.length > 0 || allWords.length > 0 || allSentences.length > 0;
  if (!currentCard || !dataReady) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary }}>
            Chargement…
          </Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.base,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, justifyContent: 'center' }} hitSlop={12}>
          <Text style={{ fontSize: 22, color: colors.text.secondary }}>×</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.primary }}>
          Révision {succeededCount + 1} / {totalCards}
        </Text>
        <View style={{ width: 36, height: 36 }} />
      </View>

      {/* Barre de progression ultra-fine */}
      <View style={{ height: 4, backgroundColor: colors.background.group }}>
        <View style={{ height: 4, backgroundColor: colors.brand.primary, width: `${progress * 100}%` as any }} />
      </View>

      <ExerciseRenderer
        key={`${currentCard.id}-${currentIndex}`}
        config={exercise}
        onComplete={handleComplete}
      />
    </SafeAreaView>
  );
}
