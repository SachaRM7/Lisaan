// src/components/lesson/SectionPlayer.tsx

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

import type { LessonSection, LessonSections, SectionProgress } from '../../types/section';
import type { ExerciseResult } from '../../types/exercise';
import type { UserSettings } from '../../types';

import { ExerciseRenderer } from '../exercises/ExerciseRenderer';
import LetterCard from '../arabic/LetterCard';
import DiacriticCard from '../arabic/DiacriticCard';
import SyllableDisplay from '../arabic/SyllableDisplay';
import WordCard from '../arabic/WordCard';
import SentenceCard from '../arabic/SentenceCard';
import DialogueDisplay from '../arabic/DialogueDisplay';
import { useDiacriticsForLesson } from '../../hooks/useDiacritics';

import { Colors, Spacing, Radius, Layout, FontSizes } from '../../constants/theme';
import type { Letter } from '../../hooks/useLetters';
import type { Diacritic } from '../../hooks/useDiacritics';
import type { Word } from '../../hooks/useWords';
import type { Root } from '../../hooks/useRoots';
import type { Sentence } from '../../hooks/useSentences';
import type { Dialogue, DialogueTurn, DialogueWithTurns } from '../../hooks/useDialogues';

// ── Types ─────────────────────────────────────────────────────

type WordPresentationItem =
  | { kind: 'word'; word: Word; root?: Root | null }
  | { kind: 'solar_intro' };

type SentencePresentationItem =
  | { kind: 'suffix_table' }
  | { kind: 'nominal_rule' }
  | { kind: 'sentence'; sentence: Sentence }
  | { kind: 'dialogue'; dialogue: DialogueWithTurns };

interface ContentData {
  letters?: Letter[];
  diacritics?: Diacritic[];
  words?: Word[];
  roots?: Root[];
  sentences?: Sentence[];
  dialogues?: (Dialogue & { turns: DialogueTurn[] })[];
  /** Pour savoir s'il faut afficher solar_intro */
  wordConfigType?: string;
  /** Pour savoir s'il faut afficher suffix_table ou nominal_rule */
  sentenceConfigType?: string;
  /** Pour CompareDiacriticsSection */
  lessonSortOrder?: number;
}

interface SectionPlayerProps {
  section: LessonSection;
  contentType: LessonSections['contentType'];
  initialProgress: SectionProgress;
  contentData: ContentData;
  settings: UserSettings;
  onProgressUpdate: (progress: SectionProgress) => void;
  onSectionComplete: (progress: SectionProgress) => void;
  /** Callback bouton retour (sauvegarde session) */
  onBack?: () => void;
  /** Mode replay : 'teaching_only' = que la lecture, 'exercises_only' = que les exercices */
  replayMode?: 'teaching_only' | 'exercises_only';
}

// ── Composant principal ───────────────────────────────────────

export function SectionPlayer({
  section,
  contentType,
  initialProgress,
  contentData,
  settings,
  onProgressUpdate,
  onSectionComplete,
  onBack,
  replayMode,
}: SectionPlayerProps) {
  const hasTeaching = section.teachingItemIds.length > 0;

  const initialPhase = useMemo<'teaching' | 'exercises'>(() => {
    if (replayMode === 'exercises_only') return 'exercises';
    if (replayMode === 'teaching_only') return 'teaching';
    if (initialProgress.teachingCompleted || !hasTeaching) return 'exercises';
    return 'teaching';
  }, []);

  const [phase, setPhase] = useState<'teaching' | 'exercises'>(initialPhase);
  const [teachingIndex, setTeachingIndex] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(
    replayMode === 'exercises_only' ? 0 : initialProgress.nextExerciseIndex,
  );
  const [results, setResults] = useState<ExerciseResult[]>(
    replayMode === 'exercises_only' ? [] : initialProgress.exerciseResults,
  );

  // ── Items de teaching ───────────────────────────────────────

  const teachingItems = useMemo(() => {
    if (contentType === 'letters') {
      return buildLetterItems(section.teachingItemIds, contentData.letters ?? []);
    }
    if (contentType === 'diacritics') {
      return buildDiacriticItems(section.teachingItemIds, contentData.diacritics ?? []);
    }
    if (contentType === 'words') {
      return buildWordItems(
        section.teachingItemIds,
        contentData.words ?? [],
        contentData.wordConfigType,
        section.index === 0,
      );
    }
    if (contentType === 'sentences') {
      return buildSentenceItems(
        section.teachingItemIds,
        contentData.sentences ?? [],
        contentData.dialogues ?? [],
        contentData.sentenceConfigType,
        section.index === 0,
      );
    }
    return [];
  }, [section, contentType, contentData]);

  const totalTeaching = teachingItems.length;
  const isLastTeaching = teachingIndex === totalTeaching - 1;

  // ── Handlers ────────────────────────────────────────────────

  function handleTeachingNext() {
    if (!isLastTeaching) {
      setTeachingIndex(teachingIndex + 1);
    } else {
      if (replayMode === 'teaching_only') {
        // Mode relecture : pas d'exercices, on termine directement
        onSectionComplete({
          sectionId: section.id,
          teachingCompleted: true,
          nextExerciseIndex: initialProgress.nextExerciseIndex,
          exerciseResults: initialProgress.exerciseResults,
          status: initialProgress.status,
        });
      } else {
        // Passage aux exercices
        const progress: SectionProgress = {
          sectionId: section.id,
          teachingCompleted: true,
          nextExerciseIndex: 0,
          exerciseResults: [],
          status: 'exercises',
        };
        onProgressUpdate(progress);
        setPhase('exercises');
      }
    }
  }

  function handleExerciseComplete(result: ExerciseResult) {
    const newResults = [...results, result];
    const newIndex = exerciseIndex + 1;
    setResults(newResults);
    setExerciseIndex(newIndex);

    const isLastExercise = newIndex >= section.exercises.length;

    const updatedProgress: SectionProgress = {
      sectionId: section.id,
      teachingCompleted: true,
      nextExerciseIndex: newIndex,
      exerciseResults: newResults,
      status: isLastExercise ? 'completed' : 'exercises',
    };

    if (isLastExercise) {
      onSectionComplete(updatedProgress);
    } else {
      onProgressUpdate(updatedProgress);
    }
  }

  // ── Rendu phase teaching ─────────────────────────────────────

  if (phase === 'teaching') {
    const item = teachingItems[teachingIndex];

    return (
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          ) : <View style={styles.backBtn} />}
          <Text style={styles.sectionTitle}>{section.title_fr}</Text>
          <Text style={styles.counter}>{teachingIndex + 1} / {totalTeaching}</Text>
        </View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {teachingItems.map((_, i) => (
            <View key={i} style={[styles.dot, i <= teachingIndex && styles.dotFilled]} />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {contentType === 'letters' && (
            <LetterTeachingContent
              item={item as Letter | null}
              lessonSortOrder={contentData.lessonSortOrder}
            />
          )}
          {contentType === 'diacritics' && (
            <DiacriticTeachingContent
              item={item as Diacritic | null}
              lessonSortOrder={contentData.lessonSortOrder}
            />
          )}
          {contentType === 'words' && (
            <WordPresentationContent item={item as WordPresentationItem | null} />
          )}
          {contentType === 'sentences' && (
            <SentencePresentationContent item={item as SentencePresentationItem | null} />
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleTeachingNext} activeOpacity={0.8}>
            <Text style={styles.nextLabel}>
              {isLastTeaching
                ? (replayMode === 'teaching_only' ? 'Terminer ✓' : 'Commencer les exercices →')
                : 'Suivant →'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Rendu phase exercices ────────────────────────────────────

  const currentExercise = section.exercises[exerciseIndex];
  const exerciseProgress = exerciseIndex / section.exercises.length;

  if (!currentExercise) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header exercices */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        ) : <View style={styles.backBtn} />}
        <Text style={styles.sectionTitle}>{section.title_fr}</Text>
        <Text style={styles.counter}>
          Exercice {exerciseIndex + 1} / {section.exercises.length}
        </Text>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${exerciseProgress * 100}%` }]} />
      </View>

      <ExerciseRenderer
        config={currentExercise}
        onComplete={handleExerciseComplete}
      />
    </SafeAreaView>
  );
}

// ── Helpers de construction des items de teaching ─────────────

function buildLetterItems(ids: string[], letters: Letter[]): Letter[] {
  const map = new Map(letters.map(l => [l.id, l]));
  return ids.map(id => map.get(id)).filter(Boolean) as Letter[];
}

function buildDiacriticItems(ids: string[], diacritics: Diacritic[]): Diacritic[] {
  const map = new Map(diacritics.map(d => [d.id, d]));
  return ids.map(id => map.get(id)).filter(Boolean) as Diacritic[];
}

function buildWordItems(
  ids: string[],
  words: Word[],
  wordConfigType: string | undefined,
  isFirstSection: boolean,
): WordPresentationItem[] {
  const map = new Map(words.map(w => [w.id, w]));
  const orderedWords = ids.map(id => map.get(id)).filter(Boolean) as Word[];
  const items: WordPresentationItem[] = orderedWords.map(w => ({ kind: 'word', word: w, root: null }));

  if (wordConfigType === 'solar_lunar' && isFirstSection) {
    return [{ kind: 'solar_intro' }, ...items];
  }
  return items;
}

function buildSentenceItems(
  ids: string[],
  sentences: Sentence[],
  dialogues: (Dialogue & { turns: DialogueTurn[] })[],
  sentenceConfigType: string | undefined,
  isFirstSection: boolean,
): SentencePresentationItem[] {
  const items: SentencePresentationItem[] = [];

  if (isFirstSection) {
    if (sentenceConfigType === 'possessive') items.push({ kind: 'suffix_table' });
    if (sentenceConfigType === 'nominal') items.push({ kind: 'nominal_rule' });
  }

  if (sentenceConfigType === 'dialogue') {
    // Trouver le dialogue dont les turns matchent les ids
    const dialogue = dialogues.find(d =>
      d.turns.some(t => ids.includes(t.id))
    );
    if (dialogue) {
      items.push({ kind: 'dialogue', dialogue: dialogue as DialogueWithTurns });
    }
  } else {
    const map = new Map(sentences.map(s => [s.id, s]));
    const orderedSentences = ids.map(id => map.get(id)).filter(Boolean) as Sentence[];
    orderedSentences.forEach(s => items.push({ kind: 'sentence', sentence: s }));
  }

  return items;
}

// ── Sous-composants de teaching ───────────────────────────────

function LetterTeachingContent({
  item,
  lessonSortOrder,
}: { item: Letter | null; lessonSortOrder?: number }) {
  if (!item) return null;
  return (
    <>
      <LetterCard letter={item} mode="full" />
      {item.pedagogy_notes ? (
        <View style={styles.pedagogyBox}>
          <Text style={styles.pedagogyText}>{item.pedagogy_notes}</Text>
        </View>
      ) : null}
    </>
  );
}

function DiacriticTeachingContent({
  item,
  lessonSortOrder,
}: { item: Diacritic | null; lessonSortOrder?: number }) {
  if (!item) return null;
  return (
    <>
      <DiacriticCard diacritic={item} mode="full" fontSize="xlarge" />
      {item.pedagogy_notes ? (
        <View style={styles.pedagogyBox}>
          <Text style={styles.pedagogyText}>{item.pedagogy_notes}</Text>
        </View>
      ) : null}
      <SyllableDisplay
        mode="single_diacritic"
        diacritics={[item]}
        letterForms={(item as any).example_letters}
      />
      {lessonSortOrder !== undefined && lessonSortOrder >= 2 && (
        <CompareDiacriticsSection lessonSortOrder={lessonSortOrder} />
      )}
    </>
  );
}

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

  // kind === 'word'
  return (
    <WordCard word={item.word} root={item.root} mode="full" />
  );
}

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
          { suffix: '-نَا', label: '(nous)', example: 'كِتَابُنَا', meaning: 'notre livre' },
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

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

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
  sectionTitle: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.xs,
  },
  counter: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
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

  scroll: { paddingHorizontal: Layout.screenPaddingH, paddingBottom: Spacing['2xl'], gap: Spacing.xl },

  footer: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  nextBtn: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { fontSize: FontSizes.body, fontWeight: '700', color: Colors.textOnPrimary },

  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.border,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.primary,
  },

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
});
