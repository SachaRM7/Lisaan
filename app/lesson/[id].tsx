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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/db/remote';
import { useLettersForLesson } from '../../src/hooks/useLetters';
import LetterCard from '../../src/components/arabic/LetterCard';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../../src/constants/theme';

// Mapping sort_order de leçon → [start, end] des lettres
const LESSON_LETTER_RANGES: Record<number, [number, number]> = {
  1: [1, 4],
  2: [5, 7],
  3: [8, 11],
  4: [12, 15],
  5: [16, 19],
  6: [20, 23],
  7: [24, 28],
};

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Charger la leçon
  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Déterminer la plage de lettres selon le sort_order de la leçon
  const range = lesson ? LESSON_LETTER_RANGES[lesson.sort_order as number] : null;
  const { data: letters, isLoading: lettersLoading } = useLettersForLesson(
    range?.[0] ?? 0,
    range?.[1] ?? 0,
  );

  const isLoading = lessonLoading || lettersLoading;
  const letter = letters?.[currentIndex];
  const total = letters?.length ?? 0;
  const isLast = currentIndex === total - 1;

  function handleNext() {
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push(`/lesson/${id}/exercises` as never);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!letter) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Lettre introuvable.</Text>
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
        {letters?.map((_, i) => (
          <View key={i} style={[styles.dot, i <= currentIndex && styles.dotFilled]} />
        ))}
      </View>
      <Text style={styles.counter}>{currentIndex + 1} / {total}</Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LetterCard letter={letter} mode="full" />

        {letter.pedagogy_notes ? (
          <View style={styles.pedagogyBox}>
            <Text style={styles.pedagogyText}>{letter.pedagogy_notes}</Text>
          </View>
        ) : null}
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
