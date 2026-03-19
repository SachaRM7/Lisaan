// app/lesson/[id].tsx
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLesson } from '../../src/hooks/useLessons';
import { useLettersForLesson } from '../../src/hooks/useLetters';
import { useDiacriticsForLesson } from '../../src/hooks/useDiacritics';
import { useCreateSRSCardsForLesson } from '../../src/hooks/useSRSCards';
import LetterCard from '../../src/components/arabic/LetterCard';
import DiacriticCard from '../../src/components/arabic/DiacriticCard';
import SyllableDisplay from '../../src/components/arabic/SyllableDisplay';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../../src/constants/theme';
import { LESSON_DIACRITIC_RANGES } from '../../src/engines/harakat-exercise-generator';

// Mapping sort_order de leçon → [start, end] des lettres (Module 1)
const LESSON_LETTER_RANGES: Record<number, [number, number]> = {
  1: [1, 4], 2: [5, 7], 3: [8, 11], 4: [12, 15],
  5: [16, 19], 6: [20, 23], 7: [24, 28],
};

type LessonContentType = 'letters' | 'diacritics';

function getLessonContentType(moduleSortOrder: number): LessonContentType {
  if (moduleSortOrder === 2) return 'diacritics';
  return 'letters';
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const createSRSCards = useCreateSRSCardsForLesson();

  // Charger la leçon avec son module
  const { data: lesson, isLoading: lessonLoading } = useLesson(id ?? '');

  const moduleSortOrder = (lesson?.modules as { sort_order: number } | undefined)?.sort_order ?? 1;
  const contentType = getLessonContentType(moduleSortOrder);

  // ── Module 1 : lettres ──────────────────────────────────────
  const letterRange = contentType === 'letters' && lesson
    ? (LESSON_LETTER_RANGES[lesson.sort_order] ?? null)
    : null;
  const { data: letters, isLoading: lettersLoading } = useLettersForLesson(
    letterRange?.[0] ?? 0,
    letterRange?.[1] ?? 0,
  );

  // ── Module 2 : diacritiques ─────────────────────────────────
  const diacriticSortOrders = contentType === 'diacritics' && lesson
    ? (LESSON_DIACRITIC_RANGES[lesson.sort_order] ?? [])
    : [];
  const { data: diacritics, isLoading: diacriticsLoading } = useDiacriticsForLesson(diacriticSortOrders);

  const isLoading = lessonLoading || lettersLoading || diacriticsLoading;

  // ── Items à afficher selon le type ─────────────────────────
  const items = contentType === 'letters' ? (letters ?? []) : (diacritics ?? []);
  const total = items.length;
  const isLast = currentIndex === total - 1;

  function handleNext() {
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const goToExercises = () => router.push(`/lesson/${id}/exercises` as never);
      if (contentType === 'letters' && letters && letters.length > 0) {
        createSRSCards.mutate(
          { letterIds: letters.map((l) => l.id) },
          { onSuccess: goToExercises, onError: goToExercises },
        );
      } else {
        goToExercises();
      }
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (total === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Contenu introuvable.</Text>
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
        <Text style={styles.lessonTitle} numberOfLines={1}>{lesson?.title_fr}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Dots de progression */}
      <View style={styles.dotsRow}>
        {items.map((_, i) => (
          <View key={i} style={[styles.dot, i <= currentIndex && styles.dotFilled]} />
        ))}
      </View>
      <Text style={styles.counter}>{currentIndex + 1} / {total}</Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {contentType === 'letters' ? (
          // ── Présentation lettre ────────────────────────────
          <>
            {letters?.[currentIndex] && (
              <LetterCard letter={letters[currentIndex]} mode="full" />
            )}
            {letters?.[currentIndex]?.pedagogy_notes ? (
              <View style={styles.pedagogyBox}>
                <Text style={styles.pedagogyText}>{letters[currentIndex].pedagogy_notes}</Text>
              </View>
            ) : null}
          </>
        ) : (
          // ── Présentation diacritique ───────────────────────
          <>
            {diacritics?.[currentIndex] && (
              <DiacriticCard
                diacritic={diacritics[currentIndex]}
                mode="full"
                fontSize="xlarge"
              />
            )}
            {diacritics?.[currentIndex]?.pedagogy_notes ? (
              <View style={styles.pedagogyBox}>
                <Text style={styles.pedagogyText}>{diacritics[currentIndex].pedagogy_notes}</Text>
              </View>
            ) : null}
            {diacritics?.[currentIndex] && (
              <SyllableDisplay
                mode="single_diacritic"
                diacritics={[diacritics[currentIndex]]}
                letterForms={diacritics[currentIndex].example_letters}
              />
            )}
            {/* Comparaison avec les diacritiques précédents (leçons 2+) */}
            {contentType === 'diacritics' &&
             lesson &&
             lesson.sort_order >= 2 &&
             diacritics &&
             diacritics.length > 0 && (
              <CompareDiacriticsSection
                lessonSortOrder={lesson.sort_order}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.listenBtn} activeOpacity={0.7}>
          <Text style={styles.listenLabel}>🔊 Écouter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextLabel}>
            {isLast ? 'Commencer les exercices →' : 'Suivant →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/**
 * Section de comparaison des diacritiques précédents (leçons 2 et 3)
 * Affiche un SyllableDisplay en mode compare_diacritics
 */
function CompareDiacriticsSection({
  lessonSortOrder,
}: {
  lessonSortOrder: number;
}) {
  // Récupérer les sort_orders des diacritiques précédents + actuels
  const compareSortOrders: number[] = [];
  if (lessonSortOrder === 2) {
    compareSortOrders.push(1, 3); // Fatha + Kasra
  } else if (lessonSortOrder === 3) {
    compareSortOrders.push(1, 3, 2); // Fatha + Kasra + Damma
  }

  const { data: compareDiacritics } = useDiacriticsForLesson(compareSortOrders);

  if (!compareDiacritics || compareDiacritics.length < 2) return null;

  return (
    <View style={styles.compareSection}>
      <Text style={styles.compareSectionTitle}>Comparaison :</Text>
      <SyllableDisplay
        mode="compare_diacritics"
        diacritics={compareDiacritics}
        letterForms={['ب', 'ت', 'س', 'ن']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1 },
  errorText: { padding: Spacing.xl, color: Colors.textSecondary, textAlign: 'center' },

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
  lessonTitle: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotFilled: { backgroundColor: Colors.primary },
  counter: { textAlign: 'center', fontSize: FontSizes.small, color: Colors.textMuted, marginBottom: Spacing.md },

  scroll: { paddingHorizontal: Layout.screenPaddingH, paddingBottom: Spacing['2xl'], gap: Spacing.xl },

  pedagogyBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  pedagogyText: { fontSize: FontSizes.body, color: Colors.textPrimary, lineHeight: 24 },

  compareSection: {
    gap: Spacing.sm,
  },
  compareSectionTitle: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  listenBtn: {
    height: Layout.buttonHeight,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenLabel: { fontSize: FontSizes.body, color: Colors.primary, fontWeight: '600' },
  nextBtn: {
    flex: 1,
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { fontSize: FontSizes.body, fontWeight: '700', color: Colors.textOnPrimary },
});
