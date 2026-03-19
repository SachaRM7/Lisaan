// src/components/arabic/DiacriticCard.tsx

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Radius, Shadows, FontSizes } from '../../constants/theme';
import ArabicText from './ArabicText';
import type { Diacritic } from '../../hooks/useDiacritics';

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
  // Lettre de base + diacritique : on prend le premier example_letters
  // qui commence par la lettre de base, sinon le premier disponible
  const displaySyllable =
    diacritic.example_letters.find((ex) => ex.startsWith(baseLetter)) ??
    diacritic.example_letters[0] ??
    `${baseLetter}${diacritic.symbol}`;

  // ── Mode COMPACT ────────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <View style={[styles.card, styles.cardCompact]}>
        <ArabicText size="large" showTransliteration={false}>
          {displaySyllable}
        </ArabicText>
        <Text style={styles.nameFr}>{diacritic.name_fr}</Text>
        <Text style={styles.soundEffect} numberOfLines={1}>
          son &ldquo;{diacritic.transliteration}&rdquo;
        </Text>
      </View>
    );
  }

  // ── Mode FULL ───────────────────────────────────────────────
  return (
    <View style={styles.card}>
      {/* Hero : lettre + diacritique */}
      <View style={styles.heroContainer}>
        <ArabicText
          size={fontSize}
          transliteration={showTransliteration !== false ? (diacritic.transliteration ?? undefined) : undefined}
          showTransliteration={showTransliteration}
        >
          {displaySyllable}
        </ArabicText>
      </View>

      {/* Nom arabe + français */}
      <View style={styles.nameRow}>
        <ArabicText size="small" showTransliteration={false}>
          {diacritic.name_ar}
        </ArabicText>
        <Text style={styles.nameSeparator}> — </Text>
        <Text style={styles.nameFr}>{diacritic.name_fr}</Text>
      </View>

      {/* Son */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Son :</Text>
        <Text style={styles.infoValue}>{diacritic.sound_effect}</Text>
      </View>

      {/* Description visuelle */}
      {diacritic.visual_description ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Position :</Text>
          <Text style={styles.infoValue}>{diacritic.visual_description}</Text>
        </View>
      ) : null}

      {/* Section exemples */}
      {diacritic.example_letters.length > 0 ? (
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>Sur d&apos;autres lettres :</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.examplesScroll}
          >
            {diacritic.example_letters.map((syllable, index) => (
              <View key={index} style={styles.syllableCell}>
                <ArabicText
                  size="medium"
                  showTransliteration={false}
                >
                  {syllable}
                </ArabicText>
                {showTransliteration !== false && diacritic.transliteration ? (
                  <Text style={styles.syllableTranslit}>
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

/**
 * Génère une translittération approximative pour chaque syllabe exemple.
 * Pour les voyelles courtes : lettre de base + voyelle.
 */
function getSyllableTranslit(syllable: string, index: number, baseTranslit: string): string {
  const LETTER_TRANSLITS = ['ba', 'ta', 'sa', 'na', 'ka', 'ma'];
  const base = LETTER_TRANSLITS[index];
  if (!base) return syllable;
  // Remplacer le 'a' de la translittération de base par la bonne voyelle
  const consonant = base[0];
  return `${consonant}${baseTranslit}`;
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
  cardCompact: {
    padding: Spacing.lg,
    minWidth: 110,
    gap: Spacing.xs,
  },

  heroContainer: {
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  nameSeparator: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  nameFr: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
    alignSelf: 'stretch',
    gap: Spacing.xs,
  },
  infoLabel: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSizes.caption,
    color: Colors.textPrimary,
    flex: 1,
  },

  examplesSection: {
    alignSelf: 'stretch',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  examplesTitle: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  examplesScroll: {
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  syllableCell: {
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    minWidth: 56,
    gap: 2,
  },
  syllableTranslit: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontFamily: 'Inter',
    textAlign: 'center',
  },

  soundEffect: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});
