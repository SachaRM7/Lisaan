// src/components/lesson/SectionPlayer.tsx

import { useState, useMemo } from 'react';
import {
  View,
  Text,
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
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui';

import type { Letter } from '../../hooks/useLetters';
import type { Diacritic } from '../../hooks/useDiacritics';
import type { Word } from '../../hooks/useWords';
import type { Root } from '../../hooks/useRoots';
import type { Sentence } from '../../hooks/useSentences';
import type { Dialogue, DialogueTurn, DialogueWithTurns } from '../../hooks/useDialogues';
import type { GrammarRule, ConjugationEntry } from '../../types/grammar';

// ── Types ─────────────────────────────────────────────────────

type WordPresentationItem =
  | { kind: 'word'; word: Word; root?: Root | null }
  | { kind: 'solar_intro' };

type SentencePresentationItem =
  | { kind: 'suffix_table' }
  | { kind: 'nominal_rule' }
  | { kind: 'sentence'; sentence: Sentence }
  | { kind: 'dialogue'; dialogue: DialogueWithTurns };

type ConjugationTeachingItem = {
  wordId: string;
  entries: ConjugationEntry[];
};

interface ContentData {
  letters?: Letter[];
  diacritics?: Diacritic[];
  words?: Word[];
  roots?: Root[];
  sentences?: Sentence[];
  dialogues?: (Dialogue & { turns: DialogueTurn[] })[];
  grammarRules?: GrammarRule[];
  conjugationEntries?: ConjugationEntry[];
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
  const { colors, typography, spacing, borderRadius } = useTheme();
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
    if (contentType === 'grammar') {
      return buildGrammarItems(section.teachingItemIds, contentData.grammarRules ?? []);
    }
    if (contentType === 'conjugation') {
      return buildConjugationItems(section.teachingItemIds, contentData.conjugationEntries ?? []);
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
        onSectionComplete({
          sectionId: section.id,
          teachingCompleted: true,
          nextExerciseIndex: initialProgress.nextExerciseIndex,
          exerciseResults: initialProgress.exerciseResults,
          status: initialProgress.status,
        });
      } else {
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.base,
        }}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, justifyContent: 'center' }} hitSlop={12}>
              <Text style={{ fontSize: 22, color: colors.text.secondary }}>×</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 36, height: 36 }} />}
          <Text style={{
            fontFamily: typography.family.uiMedium,
            fontSize: typography.size.small,
            color: colors.text.primary,
            flex: 1,
            textAlign: 'center',
            marginHorizontal: spacing.xs,
          }}>
            {section.title_fr}
          </Text>
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary }}>
            {teachingIndex + 1} / {totalTeaching}
          </Text>
        </View>

        {/* Dots */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: spacing.xs,
          paddingVertical: spacing.base,
          paddingHorizontal: spacing.lg,
        }}>
          {teachingItems.map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i <= teachingIndex ? colors.brand.primary : colors.border.medium,
              }}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
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
          {contentType === 'grammar' && (
            <GrammarRuleContent rule={item as GrammarRule | null} />
          )}
          {contentType === 'conjugation' && (
            <ConjugationContent item={item as ConjugationTeachingItem | null} />
          )}
        </ScrollView>

        {/* Footer */}
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border.subtle, backgroundColor: colors.background.main }}>
          <Button
            label={isLastTeaching
              ? (replayMode === 'teaching_only' ? 'Terminer ✓' : 'Commencer les exercices →')
              : 'Suivant →'}
            variant="primary"
            onPress={handleTeachingNext}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Rendu phase exercices ────────────────────────────────────

  const currentExercise = section.exercises[exerciseIndex];
  const exerciseProgress = exerciseIndex / section.exercises.length;

  if (!currentExercise) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      {/* Header exercices */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.base,
      }}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, justifyContent: 'center' }} hitSlop={12}>
            <Text style={{ fontSize: 22, color: colors.text.secondary }}>×</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 36, height: 36 }} />}
        <Text style={{
          fontFamily: typography.family.uiMedium,
          fontSize: typography.size.small,
          color: colors.text.primary,
          flex: 1,
          textAlign: 'center',
          marginHorizontal: spacing.xs,
        }}>
          {section.title_fr}
        </Text>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary }}>
          {exerciseIndex + 1} / {section.exercises.length}
        </Text>
      </View>

      {/* Barre de progression ultra-fine */}
      <View style={{ height: 4, backgroundColor: colors.background.group }}>
        <View style={{ height: 4, backgroundColor: colors.brand.primary, width: `${exerciseProgress * 100}%` as any }} />
      </View>

      <ExerciseRenderer
        key={currentExercise.id}
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

function buildGrammarItems(ids: string[], rules: GrammarRule[]): GrammarRule[] {
  const map = new Map(rules.map(r => [r.id, r]));
  return ids.map(id => map.get(id)).filter(Boolean) as GrammarRule[];
}

function buildConjugationItems(wordIds: string[], entries: ConjugationEntry[]): ConjugationTeachingItem[] {
  return wordIds
    .map(wordId => ({ wordId, entries: entries.filter(e => e.word_id === wordId) }))
    .filter(item => item.entries.length > 0);
}

// ── Sous-composants de teaching ───────────────────────────────

function LetterTeachingContent({
  item,
  lessonSortOrder,
}: { item: Letter | null; lessonSortOrder?: number }) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  if (!item) return null;
  return (
    <>
      <LetterCard letter={item} mode="full" />
      {item.pedagogy_notes ? (
        <PedagogyBox>{item.pedagogy_notes}</PedagogyBox>
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
        <PedagogyBox>{item.pedagogy_notes}</PedagogyBox>
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
  const { colors, typography, spacing, borderRadius } = useTheme();
  if (!item) return null;

  if (item.kind === 'solar_intro') {
    const arabicLH = Math.round(28 * 1.9);
    return (
      <View style={{ gap: spacing.lg }}>
        <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary, textAlign: 'center' }}>
          L'article en arabe : الـ
        </Text>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, lineHeight: 24, textAlign: 'center' }}>
          En arabe, l'article "le / la" s'écrit الـ (al-). Mais sa prononciation change selon la lettre qui suit.
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{
            flex: 1,
            backgroundColor: colors.background.group,
            borderRadius: borderRadius.md,
            padding: spacing.base,
            alignItems: 'center',
            gap: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border.medium,
          }}>
            <Text style={{ fontFamily: typography.family.arabic, fontSize: 28, lineHeight: arabicLH, color: colors.text.heroArabic, textAlign: 'center' }}>الْقَمَر</Text>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center' }}>Lettre lunaire</Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center', fontStyle: 'italic' }}>
              Le ل se prononce{'\n'}al-qamar
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: colors.background.group,
            borderRadius: borderRadius.md,
            padding: spacing.base,
            alignItems: 'center',
            gap: spacing.sm,
            borderWidth: 1,
            borderColor: colors.accent.gold,
          }}>
            <Text style={{ fontFamily: typography.family.arabic, fontSize: 28, lineHeight: arabicLH, color: colors.text.heroArabic, textAlign: 'center' }}>الشَّمْس</Text>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center' }}>Lettre solaire</Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center', fontStyle: 'italic' }}>
              Le ل s'assimile{'\n'}ash-shams
            </Text>
          </View>
        </View>
        <PedagogyBox>
          💡 Les lettres solaires "absorbent" le ل de l'article. Les lettres lunaires le laissent sonner clairement.
        </PedagogyBox>
      </View>
    );
  }

  return (
    <WordCard word={item.word} root={item.root} mode="full" />
  );
}

function SentencePresentationContent({ item }: { item: SentencePresentationItem | null }) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  if (!item) return null;

  if (item.kind === 'sentence') {
    return <SentenceCard sentence={item.sentence} mode="full" />;
  }

  if (item.kind === 'dialogue') {
    return <DialogueDisplay dialogue={item.dialogue} />;
  }

  if (item.kind === 'suffix_table') {
    const arabicLH = Math.round(20 * 1.9);
    return (
      <View style={{ backgroundColor: colors.background.card, borderRadius: borderRadius.md, padding: spacing.base, borderLeftWidth: 3, borderLeftColor: colors.brand.primary, gap: spacing.xs }}>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary, lineHeight: 24, marginBottom: spacing.xs }}>
          Les suffixes possessifs s'attachent au nom :
        </Text>
        {[
          { suffix: '-ي',  label: '(moi)',   example: 'كِتَابِي',   meaning: 'mon livre' },
          { suffix: '-كَ', label: '(toi m)', example: 'كِتَابُكَ',  meaning: 'ton livre' },
          { suffix: '-هُ', label: '(lui)',   example: 'كِتَابُهُ',  meaning: 'son livre' },
          { suffix: '-نَا', label: '(nous)', example: 'كِتَابُنَا', meaning: 'notre livre' },
        ].map(row => (
          <View key={row.suffix} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border.subtle }}>
            <Text style={{ fontFamily: typography.family.arabic, fontSize: 20, lineHeight: arabicLH, color: colors.brand.primary, width: 40, textAlign: 'right' }}>{row.suffix}</Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, width: 56 }}>{row.label}</Text>
            <Text style={{ fontFamily: typography.family.arabic, fontSize: 18, lineHeight: Math.round(18 * 1.9), color: colors.text.heroArabic, flex: 1, textAlign: 'right' }}>{row.example}</Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, fontStyle: 'italic', width: 80 }}>{row.meaning}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (item.kind === 'nominal_rule') {
    const arabicLH20 = Math.round(20 * 1.9);
    const arabicLH18 = Math.round(18 * 1.9);
    return (
      <View style={{ backgroundColor: colors.background.card, borderRadius: borderRadius.md, padding: spacing.base, borderLeftWidth: 3, borderLeftColor: colors.brand.primary }}>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary, lineHeight: 24 }}>
          {'La phrase nominale :\n\nSujet défini (avec الـ) + adjectif indéfini\n= "X est [adj]"\n\n'}
          <Text style={{ fontFamily: typography.family.arabic, fontSize: 20, lineHeight: arabicLH20 }}>الْبَيْتُ كَبِيرٌ</Text>
          {'\n→ La maison est grande.\n\n'}
          {'L\'adjectif s\'accorde en genre :\n'}
          <Text style={{ fontFamily: typography.family.arabic, fontSize: 18, lineHeight: arabicLH18 }}>جَمِيل</Text>
          {' (m) → '}
          <Text style={{ fontFamily: typography.family.arabic, fontSize: 18, lineHeight: arabicLH18 }}>جَمِيلَة</Text>
          {' (f)'}
        </Text>
      </View>
    );
  }

  return null;
}

function GrammarRuleContent({ rule }: { rule: GrammarRule | null }) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  if (!rule) return null;
  const arabicLH36 = Math.round(36 * 1.9);
  const arabicLH22 = Math.round(22 * 1.9);
  return (
    <View style={{ gap: spacing.base }}>
      <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary, textAlign: 'center' }}>
        {rule.title_fr}
      </Text>
      {rule.title_ar ? (
        <Text style={{ fontFamily: typography.family.arabic, fontSize: 22, lineHeight: arabicLH22, color: colors.text.secondary, textAlign: 'center' }}>
          {rule.title_ar}
        </Text>
      ) : null}
      <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, lineHeight: 24, textAlign: 'center' }}>
        {rule.concept_fr}
      </Text>
      {rule.formula ? (
        <View style={{ backgroundColor: colors.brand.light, borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, alignSelf: 'center' }}>
          <Text style={{ fontFamily: typography.family.arabic, fontSize: 22, lineHeight: arabicLH22, color: colors.brand.primary, textAlign: 'center' }}>
            {rule.formula}
          </Text>
        </View>
      ) : null}
      <View style={{
        backgroundColor: colors.background.group,
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border.subtle,
      }}>
        <Text style={{ fontFamily: typography.family.arabic, fontSize: 36, lineHeight: arabicLH36, color: colors.text.heroArabic, textAlign: 'center' }}>
          {rule.example_ar_vocalized}
        </Text>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, fontStyle: 'italic', textAlign: 'center' }}>
          {rule.example_transliteration}
        </Text>
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.primary, textAlign: 'center' }}>
          « {rule.example_translation_fr} »
        </Text>
      </View>
      {rule.pedagogy_notes ? (
        <PedagogyBox>💡 {rule.pedagogy_notes}</PedagogyBox>
      ) : null}
    </View>
  );
}

function ConjugationContent({ item }: { item: ConjugationTeachingItem | null }) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  if (!item || item.entries.length === 0) return null;
  const firstEntry = item.entries[0];
  const arabicLH48 = Math.round(48 * 1.9);
  const arabicLH22 = Math.round(22 * 1.9);
  const arabicLH16 = Math.round(16 * 1.9);
  return (
    <View style={{ gap: spacing.base, alignItems: 'center' }}>
      <Text style={{ fontFamily: typography.family.arabic, fontSize: 48, lineHeight: arabicLH48, color: colors.brand.primary, textAlign: 'center' }}>
        {firstEntry.conjugated_ar_vocalized}
      </Text>
      <Text style={{
        fontFamily: typography.family.uiBold,
        fontSize: typography.size.small,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        Conjugaison au passé
      </Text>
      <View style={{ width: '100%', gap: 2 }}>
        {item.entries.map(entry => (
          <View key={entry.id} style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            backgroundColor: colors.background.group,
            borderRadius: borderRadius.sm,
            gap: spacing.sm,
          }}>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, width: 36 }}>
              {entry.pronoun_fr}
            </Text>
            <Text style={{ fontFamily: typography.family.arabic, fontSize: 16, lineHeight: arabicLH16, color: colors.text.secondary, width: 48, textAlign: 'right' }}>
              {entry.pronoun_ar}
            </Text>
            <Text style={{ fontFamily: typography.family.arabic, fontSize: 22, lineHeight: arabicLH22, color: colors.text.heroArabic, flex: 1, textAlign: 'right' }}>
              {entry.conjugated_ar_vocalized}
            </Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, fontStyle: 'italic', width: 90, textAlign: 'right' }}>
              {entry.conjugated_transliteration}
            </Text>
          </View>
        ))}
      </View>
      {firstEntry.example_sentence_ar_vocalized ? (
        <View style={{
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.xl,
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          gap: spacing.sm,
          width: '100%',
          borderWidth: 1,
          borderColor: colors.border.subtle,
        }}>
          <Text style={{ fontFamily: typography.family.arabic, fontSize: 36, lineHeight: Math.round(36 * 1.9), color: colors.text.heroArabic, textAlign: 'center' }}>
            {firstEntry.example_sentence_ar_vocalized}
          </Text>
          {firstEntry.example_sentence_translation_fr ? (
            <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.primary, textAlign: 'center' }}>
              « {firstEntry.example_sentence_translation_fr} »
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function CompareDiacriticsSection({ lessonSortOrder }: { lessonSortOrder: number }) {
  const { colors, typography, spacing } = useTheme();
  const compareSortOrders: number[] = [];
  if (lessonSortOrder === 2) {
    compareSortOrders.push(1, 3);
  } else if (lessonSortOrder === 3) {
    compareSortOrders.push(1, 3, 2);
  }
  const { data: compareDiacritics } = useDiacriticsForLesson(compareSortOrders);
  if (!compareDiacritics || compareDiacritics.length < 2) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.secondary }}>
        Comparaison :
      </Text>
      <SyllableDisplay
        mode="compare_diacritics"
        diacritics={compareDiacritics}
        letterForms={['ب', 'ت', 'س', 'ن']}
      />
    </View>
  );
}

// ── Composant partagé ─────────────────────────────────────────

function PedagogyBox({ children }: { children: React.ReactNode }) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  return (
    <View style={{
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.md,
      padding: spacing.base,
      borderLeftWidth: 3,
      borderLeftColor: colors.brand.primary,
    }}>
      <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary, lineHeight: 24 }}>
        {children}
      </Text>
    </View>
  );
}
