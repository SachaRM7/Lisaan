import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, Radius, Shadows, Layout } from '../../src/constants/theme';
import { useUserStore, useProgressStore } from '../../src/stores';
import { INTERVAL_LABELS } from '../../src/engines/srs';

export default function ReviewScreen() {
  const streak = useUserStore((s) => s.user?.streak_current ?? 0);
  const { cardsDue, mastery } = useProgressStore();
  const [isFlipped, setIsFlipped] = useState(false);

  // Placeholder data — will be replaced with real SRS query
  const currentCard = {
    arabic_vocalized: 'كِتَاب',
    transliteration: 'kitāb',
    translation: 'livre',
    cardNumber: 3,
    totalCards: 18,
    newCards: 7,
  };

  const intervalLabel = INTERVAL_LABELS['fr'] ?? (() => '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Révision</Text>
          <View style={styles.streakBadge}>
            <Ionicons name="flame-outline" size={16} color={Colors.primary} />
            <Text style={styles.streakText}>{streak} jours</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.primary }]}>
              {currentCard.totalCards}
            </Text>
            <Text style={styles.statLabel}>À revoir</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.gold }]}>
              {currentCard.newCards}
            </Text>
            <Text style={styles.statLabel}>Nouvelles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.primary }]}>
              {mastery || 92}%
            </Text>
            <Text style={styles.statLabel}>Maîtrise</Text>
          </View>
        </View>

        {/* Card counter */}
        <Text style={styles.cardCounter}>
          Carte {currentCard.cardNumber} sur {currentCard.totalCards}
        </Text>

        {/* Flashcard */}
        <Pressable
          style={styles.flashcard}
          onPress={() => setIsFlipped(!isFlipped)}
        >
          {!isFlipped ? (
            <>
              <Text style={styles.arabicText}>{currentCard.arabic_vocalized}</Text>
              <View style={styles.flipHint}>
                <Ionicons name="refresh-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.flipHintText}>Touche pour retourner</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.arabicTextSmall}>{currentCard.arabic_vocalized}</Text>
              <Text style={styles.transliteration}>{currentCard.transliteration}</Text>
              <View style={styles.divider} />
              <Text style={styles.translation}>{currentCard.translation}</Text>
            </>
          )}
        </Pressable>

        {/* SRS Buttons — only visible when flipped */}
        {isFlipped && (
          <View style={styles.srsButtons}>
            <Pressable style={[styles.srsButton, styles.srsFailed]}>
              <Text style={[styles.srsButtonLabel, { color: Colors.srsFailed }]}>Raté</Text>
              <Text style={[styles.srsButtonInterval, { color: Colors.srsFailed }]}>
                {intervalLabel(0.0069)}
              </Text>
            </Pressable>
            <Pressable style={[styles.srsButton, styles.srsDifficult]}>
              <Text style={[styles.srsButtonLabel, { color: Colors.srsDifficult }]}>Difficile</Text>
              <Text style={[styles.srsButtonInterval, { color: Colors.srsDifficult }]}>
                {intervalLabel(0.0042)}
              </Text>
            </Pressable>
            <Pressable style={[styles.srsButton, styles.srsCorrect]}>
              <Text style={[styles.srsButtonLabel, { color: Colors.srsCorrect }]}>Correct</Text>
              <Text style={[styles.srsButtonInterval, { color: Colors.srsCorrect }]}>
                {intervalLabel(1)}
              </Text>
            </Pressable>
            <Pressable style={[styles.srsButton, styles.srsEasy]}>
              <Text style={[styles.srsButtonLabel, { color: Colors.srsEasy }]}>Facile</Text>
              <Text style={[styles.srsButtonInterval, { color: Colors.srsEasy }]}>
                {intervalLabel(3)}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Layout.screenPaddingH,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  streakText: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.card,
  },
  statNumber: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  cardCounter: {
    fontSize: FontSizes.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  flashcard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    ...Shadows.card,
  },
  arabicText: {
    fontSize: 56,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 80,
  },
  arabicTextSmall: {
    fontSize: 40,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 56,
  },
  transliteration: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  translation: {
    fontSize: FontSizes.heading,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing['2xl'],
  },
  flipHintText: {
    fontSize: FontSizes.caption,
    color: Colors.textMuted,
  },
  srsButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing['2xl'],
  },
  srsButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  srsFailed: {
    borderColor: Colors.srsFailed,
    backgroundColor: Colors.errorLight,
  },
  srsDifficult: {
    borderColor: Colors.srsDifficult,
    backgroundColor: Colors.warningLight,
  },
  srsCorrect: {
    borderColor: Colors.srsCorrect,
    backgroundColor: Colors.successLight,
  },
  srsEasy: {
    borderColor: Colors.srsEasy,
    backgroundColor: Colors.successLight,
  },
  srsButtonLabel: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
  },
  srsButtonInterval: {
    fontSize: FontSizes.small,
    marginTop: 2,
  },
});
