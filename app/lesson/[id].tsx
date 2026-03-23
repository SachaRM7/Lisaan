// app/lesson/[id].tsx
import { useState, useMemo, useEffect, useRef } from 'react';
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
import { useRoots } from '../../src/hooks/useRoots';
import { useSimpleWords, useWordsByRoots } from '../../src/hooks/useWords';
import { useSentences } from '../../src/hooks/useSentences';
import { useDialogues, useDialogueWithTurns } from '../../src/hooks/useDialogues';
import LetterCard from '../../src/components/arabic/LetterCard';
import DiacriticCard from '../../src/components/arabic/DiacriticCard';
import SyllableDisplay from '../../src/components/arabic/SyllableDisplay';
import WordCard from '../../src/components/arabic/WordCard';
import RootFamilyDisplay from '../../src/components/arabic/RootFamilyDisplay';
import SentenceCard from '../../src/components/arabic/SentenceCard';
import DialogueDisplay from '../../src/components/arabic/DialogueDisplay';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../../src/constants/theme';
import { LESSON_DIACRITIC_RANGES } from '../../src/engines/harakat-exercise-generator';
import { LESSON_WORD_CONFIG, LESSON_ROOT_TRANSLITS } from '../../src/engines/word-exercise-generator';
import { LESSON_SENTENCE_CONFIG } from '../../src/engines/sentence-exercise-generator';
import type { Root } from '../../src/hooks/useRoots';
import type { Word } from '../../src/hooks/useWords';
import type { Sentence } from '../../src/hooks/useSentences';
import type { DialogueWithTurns } from '../../src/hooks/useDialogues';

const LESSON_LETTER_RANGES: Record<number, [number, number]> = {
  1: [1, 4], 2: [5, 7], 3: [8, 11], 4: [12, 15],
  5: [16, 19], 6: [20, 23], 7: [24, 28],
};

type LessonContentType = 'letters' | 'diacritics' | 'words' | 'sentences';

function getLessonContentType(moduleSortOrder: number): LessonContentType {
  if (moduleSortOrder === 2) return 'diacritics';
  if (moduleSortOrder === 3) return 'words';
  if (moduleSortOrder === 4) return 'sentences';
  return 'letters';
}

type SentencePresentationItem =
  | { kind: 'suffix_table' }
  | { kind: 'nominal_rule' }
  | { kind: 'sentence'; sentence: Sentence }
  | { kind: 'dialogue'; dialogue: DialogueWithTurns };

type WordPresentationItem =
  | { kind: 'word'; word: Word; root?: Root | null }
  | { kind: 'root_family'; root: Root; words: Word[] }
  | { kind: 'solar_intro' };

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [forceSyncing, setForceSyncing] = useState(false);
  const syncAttempted = useRef(false);
  const createSRSCards = useCreateSRSCardsForLesson();

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

  // ── Module 3 : mots et racines ──────────────────────────────
  const { data: allRoots, isLoading: rootsLoading } = useRoots();
  const { data: simpleWords, isLoading: simpleWordsLoading } = useSimpleWords();

  const lessonRoots = useMemo(
    () => {
      if (contentType !== 'words' || !lesson) return [];
      const translits = LESSON_ROOT_TRANSLITS[lesson.sort_order] ?? [];
      return (allRoots ?? []).filter(r => translits.includes(r.transliteration));
    },
    [allRoots, contentType, lesson?.sort_order],
  );

  const lessonRootIds = useMemo(() => lessonRoots.map(r => r.id), [lessonRoots]);
  const { data: rootWords, isLoading: rootWordsLoading } = useWordsByRoots(lessonRootIds);

  const wordPresentationItems = useMemo<WordPresentationItem[]>(() => {
    if (contentType !== 'words' || !lesson) return [];
    const wordConfig = LESSON_WORD_CONFIG[lesson.sort_order];
    if (!wordConfig || wordConfig.type === 'revision') return [];

    if (wordConfig.type === 'simple') {
      return (simpleWords ?? []).map(w => ({ kind: 'word' as const, word: w, root: null }));
    }

    if (wordConfig.type === 'solar_lunar') {
      return [
        { kind: 'solar_intro' as const },
        ...(simpleWords ?? []).map(w => ({ kind: 'word' as const, word: w, root: null })),
      ];
    }

    if (wordConfig.type === 'root') {
      const items: WordPresentationItem[] = [];
      for (const root of lessonRoots) {
        const words = (rootWords ?? []).filter(w => w.root_id === root.id);
        items.push({ kind: 'root_family' as const, root, words });
        for (const word of words) {
          items.push({ kind: 'word' as const, word, root });
        }
      }
      return items;
    }

    return [];
  }, [contentType, lesson?.sort_order, simpleWords, rootWords, lessonRoots]);

  // ── Module 4 : phrases et dialogues ────────────────────────
  const { data: allSentences, isLoading: sentencesLoading, refetch: refetchSentences } = useSentences();
  const { data: allDialogues, isLoading: dialoguesLoading } = useDialogues();

  const sentenceConfig = contentType === 'sentences' && lesson
    ? LESSON_SENTENCE_CONFIG[lesson.sort_order]
    : null;

  const dial0Id = sentenceConfig?.dialogueIds?.[0] ?? null;
  const dial1Id = sentenceConfig?.dialogueIds?.[1] ?? null;
  const dial2Id = sentenceConfig?.dialogueIds?.[2] ?? null;
  const { data: dial0 } = useDialogueWithTurns(dial0Id);
  const { data: dial1 } = useDialogueWithTurns(dial1Id);
  const { data: dial2 } = useDialogueWithTurns(dial2Id);

  const sentencePresentationItems = useMemo<SentencePresentationItem[]>(() => {
    if (contentType !== 'sentences' || !lesson || !sentenceConfig) return [];
    const type = sentenceConfig.type;

    // Leçon 5 : pas de présentation
    if (type === 'fill_blank') return [];

    // Leçon 6 : dialogues
    if (type === 'dialogue') {
      const items: SentencePresentationItem[] = [];
      [dial0, dial1, dial2].forEach(d => {
        if (d) items.push({ kind: 'dialogue', dialogue: d as DialogueWithTurns });
      });
      return items;
    }

    // Leçons 1-4 : phrases
    const ids = sentenceConfig.sentenceIds ?? [];
    const sentences = (allSentences ?? []).filter(s => ids.includes(s.id));
    const items: SentencePresentationItem[] = [];

    if (type === 'possessive') items.push({ kind: 'suffix_table' });
    if (type === 'nominal') items.push({ kind: 'nominal_rule' });

    sentences.forEach(s => items.push({ kind: 'sentence', sentence: s }));
    return items;
  }, [contentType, lesson?.sort_order, sentenceConfig, allSentences, dial0, dial1, dial2]);

  const isLoading = lessonLoading || lettersLoading || diacriticsLoading
    || (contentType === 'words' && (rootsLoading || simpleWordsLoading || rootWordsLoading))
    || (contentType === 'sentences' && (sentencesLoading || dialoguesLoading || forceSyncing));

  const items: unknown[] = contentType === 'letters'
    ? (letters ?? [])
    : contentType === 'diacritics'
      ? (diacritics ?? [])
      : contentType === 'sentences'
        ? sentencePresentationItems
        : wordPresentationItems;

  const total = items.length;
  const isLast = currentIndex === total - 1;

  // Leçon 6 Module 3 (révision) : pas de présentation
  useEffect(() => {
    if (contentType !== 'words' || isLoading || !lesson) return;
    const wordConfig = LESSON_WORD_CONFIG[lesson.sort_order];
    if (wordConfig?.type === 'revision') {
      router.replace(`/lesson/${id}/exercises` as never);
    }
  }, [contentType, isLoading, lesson?.sort_order]);

  // Leçon 5 Module 4 (fill_blank) : pas de présentation
  useEffect(() => {
    if (contentType !== 'sentences' || isLoading || !lesson) return;
    if (sentenceConfig?.type === 'fill_blank') {
      router.replace(`/lesson/${id}/exercises` as never);
    }
  }, [contentType, isLoading, sentenceConfig?.type]);

  // Si sentences vides après chargement → force sync une seule fois + refetch
  useEffect(() => {
    if (contentType !== 'sentences' || sentencesLoading) return;
    if ((!allSentences || allSentences.length === 0) && !syncAttempted.current) {
      syncAttempted.current = true;
      setForceSyncing(true);
      import('../../src/engines/content-sync').then(({ syncContentFromCloud }) =>
        syncContentFromCloud()
          .then(() => refetchSentences())
          .finally(() => setForceSyncing(false))
      );
    }
  }, [contentType, sentencesLoading]);

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
    const wordConfig = contentType === 'words' && lesson ? LESSON_WORD_CONFIG[lesson.sort_order] : null;
    const isRevision = wordConfig?.type === 'revision';
    if (!isRevision) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.lessonTitle} numberOfLines={1}>{lesson?.title_fr}</Text>
            <View style={styles.backBtn} />
          </View>
          <Text style={styles.errorText}>
            {contentType === 'words'
              ? 'Contenu non disponible. Vérifiez votre connexion et relancez l\'app.'
              : 'Contenu introuvable.'}
          </Text>
        </SafeAreaView>
      );
    }
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
      {total > 0 && (
        <>
          <View style={styles.dotsRow}>
            {items.map((_, i) => (
              <View key={i} style={[styles.dot, i <= currentIndex && styles.dotFilled]} />
            ))}
          </View>
          <Text style={styles.counter}>{currentIndex + 1} / {total}</Text>
        </>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {contentType === 'letters' ? (
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
        ) : contentType === 'diacritics' ? (
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
            {lesson && lesson.sort_order >= 2 && diacritics && diacritics.length > 0 && (
              <CompareDiacriticsSection lessonSortOrder={lesson.sort_order} />
            )}
          </>
        ) : contentType === 'sentences' ? (
          // ── Module 4 : phrases et dialogues ──────────────────
          <SentencePresentationContent item={sentencePresentationItems[currentIndex] ?? null} />
        ) : (
          // ── Module 3 : mots ──────────────────────────────────
          <WordPresentationContent item={wordPresentationItems[currentIndex] ?? null} />
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextLabel}>
            {isLast ? 'Commencer les exercices →' : 'Suivant →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Rendu d'un item de présentation mots ─────────────────────

function WordPresentationContent({ item }: { item: WordPresentationItem | null }) {
  if (!item) return null;

  if (item.kind === 'solar_intro') {
    return (
      <View style={styles.solarIntroBox}>
        <Text style={styles.solarIntroTitle}>L'article en arabe : الـ</Text>
        <Text style={styles.solarIntroText}>
          En arabe, l'article "le / la" s'écrit الـ (al-). Mais sa prononciation change selon la lettre qui suit.
        </Text>
        <View style={styles.solarRow}>
          <View style={styles.solarCard}>
            <Text style={styles.solarAr}>الْقَمَر</Text>
            <Text style={styles.solarLabel}>Lettre lunaire</Text>
            <Text style={styles.solarDesc}>Le ل se prononce{'\n'}al-qamar</Text>
          </View>
          <View style={[styles.solarCard, styles.solarCardSun]}>
            <Text style={styles.solarAr}>الشَّمْس</Text>
            <Text style={styles.solarLabel}>Lettre solaire</Text>
            <Text style={styles.solarDesc}>Le ل s'assimile{'\n'}ash-shams</Text>
          </View>
        </View>
        <View style={styles.pedagogyBox}>
          <Text style={styles.pedagogyText}>
            💡 Les lettres solaires "absorbent" le ل de l'article. Les lettres lunaires le laissent sonner clairement.
          </Text>
        </View>
      </View>
    );
  }

  if (item.kind === 'root_family') {
    return (
      <RootFamilyDisplay
        root={item.root}
        words={item.words}
      />
    );
  }

  // kind === 'word'
  return (
    <WordCard
      word={item.word}
      root={item.root}
      mode="full"
    />
  );
}

// ── Rendu d'un item de présentation sentences ─────────────────

function SentencePresentationContent({ item }: { item: SentencePresentationItem | null }) {
  if (!item) return null;

  if (item.kind === 'sentence') {
    return <SentenceCard sentence={item.sentence} mode="full" />;
  }

  if (item.kind === 'dialogue') {
    return <DialogueDisplay dialogue={item.dialogue} />;
  }

  if (item.kind === 'suffix_table') {
    return (
      <View style={styles.pedagogyBox}>
        <Text style={styles.pedagogyText}>
          Les suffixes possessifs s'attachent au nom :
        </Text>
        {[
          { suffix: '-ي',  label: '(moi)',   example: 'كِتَابِي',   meaning: 'mon livre' },
          { suffix: '-كَ', label: '(toi m)', example: 'كِتَابُكَ',  meaning: 'ton livre' },
          { suffix: '-هُ', label: '(lui)',   example: 'كِتَابُهُ',  meaning: 'son livre' },
          { suffix: '-نَا',label: '(nous)',  example: 'كِتَابُنَا', meaning: 'notre livre' },
        ].map(row => (
          <View key={row.suffix} style={styles.suffixRow}>
            <Text style={styles.suffixCode}>{row.suffix}</Text>
            <Text style={styles.suffixLabel}>{row.label}</Text>
            <Text style={styles.suffixExample}>{row.example}</Text>
            <Text style={styles.suffixMeaning}>{row.meaning}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (item.kind === 'nominal_rule') {
    return (
      <View style={styles.pedagogyBox}>
        <Text style={styles.pedagogyText}>
          {'La phrase nominale :\n\nSujet défini (avec الـ) + adjectif indéfini\n= "X est [adj]"\n\n'}
          <Text style={{ fontFamily: 'Amiri', fontSize: 20 }}>الْبَيْتُ كَبِيرٌ</Text>
          {'\n→ La maison est grande.\n\n'}
          {'L\'adjectif s\'accorde en genre :\n'}
          <Text style={{ fontFamily: 'Amiri', fontSize: 18 }}>جَمِيل</Text>
          {' (m) → '}
          <Text style={{ fontFamily: 'Amiri', fontSize: 18 }}>جَمِيلَة</Text>
          {' (f)'}
        </Text>
      </View>
    );
  }

  return null;
}

// ── CompareDiacriticsSection (inchangé) ──────────────────────

function CompareDiacriticsSection({ lessonSortOrder }: { lessonSortOrder: number }) {
  const compareSortOrders: number[] = [];
  if (lessonSortOrder === 2) {
    compareSortOrders.push(1, 3);
  } else if (lessonSortOrder === 3) {
    compareSortOrders.push(1, 3, 2);
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
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Layout.screenPaddingH,
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

  compareSection: { gap: Spacing.sm },
  compareSectionTitle: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Solar/Lunar intro
  solarIntroBox: { gap: Spacing.xl },
  solarIntroTitle: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  solarIntroText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  solarRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  solarCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  solarCardSun: {
    borderColor: '#D4A843',
    backgroundColor: '#FFF8E1',
  },
  solarAr: {
    fontSize: 28,
    fontFamily: 'Amiri',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  solarLabel: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  solarDesc: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  suffixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2D9',
  },
  suffixCode: {
    fontFamily: 'Amiri',
    fontSize: 20,
    color: Colors.primary,
    width: 40,
    textAlign: 'right',
  },
  suffixLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    width: 56,
  },
  suffixExample: {
    fontFamily: 'Amiri',
    fontSize: 18,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  suffixMeaning: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
    fontStyle: 'italic',
    width: 80,
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
