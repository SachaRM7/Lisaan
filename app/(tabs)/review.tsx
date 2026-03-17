// app/(tabs)/review.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDueCards, useSRSCards } from '../../src/hooks/useSRSCards';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../../src/constants/theme';

function formatNextReview(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return 'maintenant';
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.round(diff / 3_600_000);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}j`;
}

export default function ReviewScreen() {
  const router = useRouter();
  const { data: dueCards = [] } = useDueCards();
  const { data: allCards = [] } = useSRSCards();

  const mastered = allCards.filter((c) => c.interval_days > 7);
  const learning = allCards.filter((c) => c.interval_days > 0 && c.interval_days <= 7);
  const newCards = allCards.filter((c) => c.repetitions === 0);

  // Prochaine carte non-due
  const nextCard = allCards
    .filter((c) => new Date(c.next_review_at) > new Date())
    .sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime())[0];

  const dueLetters = dueCards.filter((c) => c.item_type === 'letter').length;
  const dueWords = dueCards.filter((c) => c.item_type === 'word').length;

  // ── État 1 : aucune carte ───────────────────────────────
  if (allCards.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Réviser</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>Rien à réviser pour l'instant</Text>
          <Text style={styles.emptySubtitle}>
            Termine ta première leçon pour débloquer les révisions.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.replace('/(tabs)/learn')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaLabel}>Aller apprendre →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── État 3 : tout est à jour ────────────────────────────
  if (dueCards.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Réviser</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.upToDateContainer}>
            <Text style={styles.upToDateIcon}>✅</Text>
            <Text style={styles.upToDateTitle}>Tu es à jour !</Text>
            {nextCard && (
              <Text style={styles.upToDateSubtitle}>
                Prochaine révision dans {formatNextReview(nextCard.next_review_at)}.{'\n'}
                En attendant, continue à apprendre de nouvelles lettres.
              </Text>
            )}
          </View>
          <StatsSection mastered={mastered.length} learning={learning.length} newCount={newCards.length} total={allCards.length} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── État 2 : cartes dues ────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Réviser</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Compteur */}
        <View style={styles.dueBox}>
          <Text style={styles.dueIcon}>🔄</Text>
          <Text style={styles.dueCount}>{dueCards.length} carte{dueCards.length > 1 ? 's' : ''} à réviser</Text>
          <Text style={styles.dueDetail}>
            {dueLetters > 0 ? `Lettres : ${dueLetters}` : ''}
            {dueLetters > 0 && dueWords > 0 ? '  ·  ' : ''}
            {dueWords > 0 ? `Mots : ${dueWords}` : ''}
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => router.push('/review-session' as never)}
          activeOpacity={0.85}
        >
          <Text style={styles.startLabel}>Commencer la révision →</Text>
        </TouchableOpacity>

        <StatsSection mastered={mastered.length} learning={learning.length} newCount={newCards.length} total={allCards.length} />

        {nextCard && dueCards.length === 0 && (
          <Text style={styles.nextReviewText}>
            Prochaine révision dans : {formatNextReview(nextCard.next_review_at)}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatsSection({ mastered, learning, newCount, total }: {
  mastered: number; learning: number; newCount: number; total: number;
}) {
  return (
    <View style={styles.statsSection}>
      <Text style={styles.statsDivider}>── Statistiques ──</Text>
      <View style={styles.statsRow}>
        <StatLine label="Total de cartes" value={total} />
        <StatLine label="Maîtrisées (>7j)" value={mastered} color={Colors.primary} />
        <StatLine label="En apprentissage" value={learning} color={Colors.warning} />
        <StatLine label="Nouvelles" value={newCount} color={Colors.textSecondary} />
      </View>
    </View>
  );
}

function StatLine({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.statLine}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSizes.title, fontWeight: '700', color: Colors.textPrimary },
  scroll: { paddingHorizontal: Layout.screenPaddingH, paddingVertical: Spacing['2xl'], gap: Spacing.xl },

  // État 1 — vide
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Layout.screenPaddingH, gap: Spacing.lg },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FontSizes.heading, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSizes.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  // État 3 — à jour
  upToDateContainer: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing['2xl'] },
  upToDateIcon: { fontSize: 56 },
  upToDateTitle: { fontSize: FontSizes.heading, fontWeight: '700', color: Colors.textPrimary },
  upToDateSubtitle: { fontSize: FontSizes.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },

  // État 2 — cartes dues
  dueBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dueIcon: { fontSize: 40 },
  dueCount: { fontSize: FontSizes.heading, fontWeight: '700', color: Colors.textPrimary },
  dueDetail: { fontSize: FontSizes.caption, color: Colors.textSecondary },

  startBtn: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLabel: { fontSize: FontSizes.body, fontWeight: '700', color: Colors.textOnPrimary },

  ctaBtn: {
    height: Layout.buttonHeight,
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  ctaLabel: { fontSize: FontSizes.body, fontWeight: '700', color: Colors.textOnPrimary },

  // Stats
  statsSection: { gap: Spacing.md },
  statsDivider: { textAlign: 'center', fontSize: FontSizes.caption, color: Colors.textMuted },
  statsRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  statLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: FontSizes.body, color: Colors.textSecondary },
  statValue: { fontSize: FontSizes.body, fontWeight: '700', color: Colors.textPrimary },

  nextReviewText: { textAlign: 'center', fontSize: FontSizes.caption, color: Colors.textMuted },
});
