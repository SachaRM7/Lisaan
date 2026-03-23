// src/components/arabic/LetterCard.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, Radius, Shadows, FontSizes } from '../../constants/theme';
import ArabicText from './ArabicText';
import { AudioButton } from '../AudioButton';
import { useAudio } from '../../hooks/useAudio';

interface LetterCardProps {
  letter: {
    name_ar: string;
    name_fr: string;
    transliteration: string;
    ipa: string;
    form_isolated: string;
    form_initial: string;
    form_medial: string;
    form_final: string;
    connects_left: boolean;
    connects_right: boolean;
    articulation_fr: string;
    audio_url?: string | null;
  };
  mode?: 'full' | 'compact' | 'quiz';
  highlightedForm?: 'isolated' | 'initial' | 'medial' | 'final';
  onPress?: () => void;
}

// Ordre d'affichage RTL : Finale → Médiane → Initiale
const SECONDARY_FORMS = [
  { key: 'form_final',   label: 'Finale' },
  { key: 'form_medial',  label: 'Médiane' },
  { key: 'form_initial', label: 'Initiale' },
] as const;

export default function LetterCard({
  letter,
  mode = 'full',
  highlightedForm,
  onPress,
}: LetterCardProps) {
  const { play, shouldAutoPlay } = useAudio({
    audioUrl: letter.audio_url,
    fallbackText: letter.name_fr,
    fallbackLanguage: 'fr',
  });

  useEffect(() => {
    if (shouldAutoPlay) { play(); }
  }, []);

  // ── Mode QUIZ ──────────────────────────────────────────────
  if (mode === 'quiz') {
    const form = highlightedForm ?? 'isolated';
    const formValue = getForm(letter, form);
    return (
      <Pressable style={[styles.card, styles.cardQuiz]} onPress={onPress}>
        <ArabicText size="xlarge">{formValue}</ArabicText>
      </Pressable>
    );
  }

  // ── Mode COMPACT ───────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <Pressable style={[styles.card, styles.cardCompact]} onPress={onPress}>
        <View style={styles.compactRow}>
          <ArabicText size="medium">{letter.form_isolated}</ArabicText>
          <View style={styles.compactInfo}>
            <Text style={styles.nameFr}>{letter.name_fr}</Text>
            <Text style={styles.ipa}>{letter.ipa}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // ── Mode FULL (défaut) ─────────────────────────────────────
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Forme isolée — hero */}
      <View style={[
        styles.heroContainer,
        highlightedForm === 'isolated' && styles.formHighlighted,
      ]}>
        <ArabicText size="xlarge">{letter.form_isolated}</ArabicText>
        <AudioButton
          audioUrl={letter.audio_url}
          fallbackText={letter.name_fr}
          fallbackLanguage="fr"
          size={28}
          style={styles.audioBtn}
        />
      </View>

      {/* 3 autres formes — ordre RTL : Finale → Médiane → Initiale */}
      <View style={styles.formsRow}>
        {SECONDARY_FORMS.map(({ key, label }) => {
          const formKey = key.replace('form_', '') as 'final' | 'medial' | 'initial';
          const isHighlighted = highlightedForm === formKey;
          return (
            <View
              key={key}
              style={[styles.formCell, isHighlighted && styles.formHighlighted]}
            >
              <ArabicText size="medium">{letter[key]}</ArabicText>
              <Text style={styles.formLabel}>{label}</Text>
            </View>
          );
        })}
      </View>

      {/* Nom + translittération */}
      <View style={styles.nameRow}>
        <Text style={styles.nameFr}>{letter.name_fr}</Text>
        <Text style={styles.translitParen}> ({letter.transliteration})</Text>
      </View>

      {/* IPA + articulation */}
      <Text style={styles.articulation}>
        {letter.ipa} — {letter.articulation_fr}
      </Text>

      {/* Connexions */}
      <View style={styles.connectionsRow}>
        {letter.connects_left && (
          <View style={styles.connectionBadge}>
            <Text style={styles.connectionText}>● Se connecte à gauche</Text>
          </View>
        )}
        {letter.connects_right && (
          <View style={styles.connectionBadge}>
            <Text style={styles.connectionText}>● Se connecte à droite</Text>
          </View>
        )}
        {!letter.connects_left && !letter.connects_right && (
          <View style={styles.connectionBadge}>
            <Text style={styles.connectionText}>● Ne se connecte pas</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function getForm(
  letter: LetterCardProps['letter'],
  form: 'isolated' | 'initial' | 'medial' | 'final',
): string {
  switch (form) {
    case 'isolated': return letter.form_isolated;
    case 'initial':  return letter.form_initial;
    case 'medial':   return letter.form_medial;
    case 'final':    return letter.form_final;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E8E2D9',
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.card,
  },
  cardQuiz: {
    padding: Spacing['3xl'],
    minWidth: 120,
  },
  cardCompact: {
    padding: Spacing.lg,
  },

  // Hero (forme isolée)
  heroContainer: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  audioBtn: {
    marginTop: Spacing.sm,
  },

  // 3 formes secondaires
  formsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  formCell: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    minWidth: 64,
  },
  formHighlighted: {
    backgroundColor: Colors.primaryLight,
  },
  formLabel: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Nom
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  nameFr: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  translitParen: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },

  // IPA
  articulation: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  ipa: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
  },

  // Connexions
  connectionsRow: {
    gap: Spacing.xs,
    alignSelf: 'stretch',
  },
  connectionBadge: {
    paddingVertical: 2,
  },
  connectionText: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
  },

  // Compact
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  compactInfo: {
    gap: 2,
  },
});
