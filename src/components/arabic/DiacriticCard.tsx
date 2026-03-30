// src/components/arabic/DiacriticCard.tsx

import { View, Text, ScrollView } from 'react-native';
import ArabicText from './ArabicText';
import type { Diacritic } from '../../hooks/useDiacritics';
import { useTheme } from '../../contexts/ThemeContext';

interface DiacriticCardProps {
  diacritic: Diacritic;
  mode: 'compact' | 'full';
  baseLetter?: string;
  showTransliteration?: boolean;
  fontSize?: 'medium' | 'large' | 'xlarge';
}

const DEFAULT_BASE_LETTER = 'ب';

export default function DiacriticCard({
  diacritic,
  mode,
  baseLetter = DEFAULT_BASE_LETTER,
  showTransliteration,
  fontSize = 'xlarge',
}: DiacriticCardProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const displaySyllable =
    diacritic.example_letters.find((ex) => ex.startsWith(baseLetter)) ??
    diacritic.example_letters[0] ??
    `${baseLetter}${diacritic.symbol}`;

  const cardBase = {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.subtle,
    alignItems: 'center' as const,
  };

  // ── Mode COMPACT ────────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <View style={[cardBase, { padding: spacing.base, minWidth: 110, gap: spacing.xs }]}>
        <ArabicText size="large" showTransliteration={false} forceStaticDisplay>
          {displaySyllable}
        </ArabicText>
        <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.primary }}>
          {diacritic.name_fr}
        </Text>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, textAlign: 'center' }} numberOfLines={1}>
          son &ldquo;{diacritic.transliteration}&rdquo;
        </Text>
      </View>
    );
  }

  // ── Mode FULL ───────────────────────────────────────────────
  return (
    <View style={[cardBase, { padding: spacing.lg }]}>
      {/* Hero : lettre + diacritique — carré adouci fond sable */}
      <View style={{
        backgroundColor: colors.background.group,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        alignItems: 'center',
      }}>
        <ArabicText
          size={fontSize}
          transliteration={showTransliteration !== false ? (diacritic.transliteration ?? undefined) : undefined}
          showTransliteration={showTransliteration}
          forceStaticDisplay
        >
          {displaySyllable}
        </ArabicText>
      </View>

      {/* Nom arabe + français */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginBottom: spacing.sm }}>
        <ArabicText size="small" showTransliteration={false}>
          {diacritic.name_ar}
        </ArabicText>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary }}> — </Text>
        <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.primary, textAlign: 'center' }}>
          {diacritic.name_fr}
        </Text>
      </View>

      {/* Son */}
      <View style={{ flexDirection: 'row', alignSelf: 'stretch', gap: spacing.xs, marginBottom: spacing.xs }}>
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.secondary }}>Son :</Text>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.primary, flex: 1 }}>
          {diacritic.sound_effect}
        </Text>
      </View>

      {/* Description visuelle */}
      {diacritic.visual_description ? (
        <View style={{ flexDirection: 'row', alignSelf: 'stretch', gap: spacing.xs, marginBottom: spacing.xs }}>
          <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.secondary }}>Position :</Text>
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.primary, flex: 1 }}>
            {diacritic.visual_description}
          </Text>
        </View>
      ) : null}

      {/* Section exemples */}
      {diacritic.example_letters.length > 0 ? (
        <View style={{ alignSelf: 'stretch', marginTop: spacing.base, gap: spacing.xs }}>
          <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.secondary, marginBottom: spacing.micro }}>
            Sur d&apos;autres lettres :
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }}
          >
            {diacritic.example_letters.map((syllable, index) => (
              <View
                key={index}
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.background.group,
                  borderRadius: borderRadius.sm,
                  padding: spacing.xs,
                  minWidth: 56,
                  gap: 2,
                }}
              >
                <ArabicText size="medium" showTransliteration={false}>
                  {syllable}
                </ArabicText>
                {showTransliteration !== false && diacritic.transliteration ? (
                  <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary, textAlign: 'center' }}>
                    {getSyllableTranslit(syllable, index, diacritic.transliteration)}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function getSyllableTranslit(syllable: string, index: number, baseTranslit: string): string {
  const LETTER_TRANSLITS = ['ba', 'ta', 'sa', 'na', 'ka', 'ma'];
  const base = LETTER_TRANSLITS[index];
  if (!base) return syllable;
  const consonant = base[0];
  return `${consonant}${baseTranslit}`;
}
