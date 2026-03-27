// src/components/arabic/LetterCard.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import ArabicText from './ArabicText';
import { AudioButton } from '../AudioButton';
import { useAudio } from '../../hooks/useAudio';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { play, shouldAutoPlay } = useAudio({
    audioUrl: letter.audio_url,
    fallbackText: letter.name_fr,
    fallbackLanguage: 'fr',
  });

  useEffect(() => {
    if (shouldAutoPlay) { play(); }
  }, []);

  const cardBase = {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.subtle,
  };

  // ── Mode QUIZ ──────────────────────────────────────────────
  if (mode === 'quiz') {
    const form = highlightedForm ?? 'isolated';
    const formValue = getForm(letter, form);
    return (
      <Pressable
        style={[
          cardBase,
          {
            // Zone Hero : carré adouci avec fond sable
            backgroundColor: colors.background.group,
            borderRadius: borderRadius.xl,
            padding: spacing.hero,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
        onPress={onPress}
      >
        <ArabicText size="xlarge">{formValue}</ArabicText>
      </Pressable>
    );
  }

  // ── Mode COMPACT ───────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <Pressable
        style={[cardBase, { padding: spacing.base, alignItems: 'center' }]}
        onPress={onPress}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <ArabicText size="medium">{letter.form_isolated}</ArabicText>
          <View style={{ gap: 2 }}>
            <Text style={{
              fontFamily: typography.family.uiBold,
              fontSize: typography.size.body,
              color: colors.text.primary,
            }}>
              {letter.name_fr}
            </Text>
            <Text style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.tiny,
              color: colors.text.secondary,
            }}>
              {letter.ipa}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // ── Mode FULL (défaut) ─────────────────────────────────────
  return (
    <Pressable
      style={[cardBase, { padding: spacing.lg, alignItems: 'center' }]}
      onPress={onPress}
    >
      {/* Forme isolée — Hero Arabe */}
      <View style={[
        styles.heroContainer,
        {
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        highlightedForm === 'isolated' && {
          borderWidth: 2,
          borderColor: colors.brand.primary,
        },
      ]}>
        <ArabicText size="xlarge">{letter.form_isolated}</ArabicText>
        <AudioButton
          audioUrl={letter.audio_url}
          fallbackText={letter.name_fr}
          fallbackLanguage="fr"
          size={28}
          style={{ marginTop: spacing.xs }}
        />
      </View>

      {/* 3 autres formes — ordre RTL : Finale → Médiane → Initiale */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        {SECONDARY_FORMS.map(({ key, label }) => {
          const formKey = key.replace('form_', '') as 'final' | 'medial' | 'initial';
          const isHighlighted = highlightedForm === formKey;
          return (
            <View
              key={key}
              style={[
                {
                  alignItems: 'center',
                  borderRadius: borderRadius.sm,
                  padding: spacing.xs,
                  minWidth: 64,
                  backgroundColor: isHighlighted ? colors.brand.light : 'transparent',
                },
              ]}
            >
              <ArabicText size="medium">{letter[key]}</ArabicText>
              <Text style={{
                fontFamily: typography.family.ui,
                fontSize: typography.size.tiny,
                color: colors.text.secondary,
                marginTop: spacing.micro,
              }}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Nom + translittération */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.micro }}>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.body,
          color: colors.text.primary,
        }}>
          {letter.name_fr}
        </Text>
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.body,
          color: colors.text.secondary,
        }}>
          {' '}({letter.transliteration})
        </Text>
      </View>

      {/* IPA + articulation */}
      <Text style={{
        fontFamily: typography.family.ui,
        fontSize: typography.size.small,
        color: colors.text.secondary,
        marginBottom: spacing.base,
        textAlign: 'center',
      }}>
        {letter.ipa} — {letter.articulation_fr}
      </Text>

      {/* Connexions */}
      <View style={{ gap: spacing.micro, alignSelf: 'stretch' }}>
        {letter.connects_left && (
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
            ● Se connecte à gauche
          </Text>
        )}
        {letter.connects_right && (
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
            ● Se connecte à droite
          </Text>
        )}
        {!letter.connects_left && !letter.connects_right && (
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
            ● Ne se connecte pas
          </Text>
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
  heroContainer: {
    alignItems: 'center',
  },
});
