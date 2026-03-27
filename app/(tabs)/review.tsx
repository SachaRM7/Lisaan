// app/(tabs)/review.tsx
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDueCards, useSRSCards } from '../../src/hooks/useSRSCards';
import { track } from '../../src/analytics/posthog';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Button } from '../../src/components/ui';

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
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();
  const { data: dueCards = [] } = useDueCards();
  const { data: allCards = [] } = useSRSCards();

  const mastered = allCards.filter((c) => c.interval_days > 7);
  const learning = allCards.filter((c) => c.interval_days > 0 && c.interval_days <= 7);
  const newCards = allCards.filter((c) => c.repetitions === 0);

  const nextCard = allCards
    .filter((c) => new Date(c.next_review_at) > new Date())
    .sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime())[0];

  const dueLetters = dueCards.filter((c) => c.item_type === 'letter').length;
  const dueDiacritics = dueCards.filter((c) => c.item_type === 'diacritic').length;
  const dueWords = dueCards.filter((c) => c.item_type === 'word').length;

  const headerStyle = {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
  };

  const titleStyle = {
    fontFamily: typography.family.uiBold,
    fontSize: typography.size.h1,
    color: colors.text.primary,
  };

  // ── État 1 : aucune carte ───────────────────────────────
  if (allCards.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={headerStyle}>
          <Text style={titleStyle}>Réviser</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.base }}>
          <Text style={{ fontSize: 56 }}>📚</Text>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary, textAlign: 'center' }}>
            Rien à réviser pour l'instant
          </Text>
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center', lineHeight: 24 }}>
            Termine ta première leçon pour débloquer les révisions.
          </Text>
          <Button
            label="Aller apprendre →"
            variant="primary"
            onPress={() => router.replace('/(tabs)/learn')}
            style={{ width: '100%', marginTop: spacing.sm }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── État 3 : tout est à jour ────────────────────────────
  if (dueCards.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={headerStyle}>
          <Text style={titleStyle}>Réviser</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, gap: spacing.xl }}>
          <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
            <Text style={{ fontSize: 56 }}>✅</Text>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary }}>
              Tu es à jour !
            </Text>
            {nextCard && (
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center', lineHeight: 24 }}>
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
  const dueDetail = [
    dueLetters > 0 ? `Lettres : ${dueLetters}` : '',
    dueDiacritics > 0 ? `Harakats : ${dueDiacritics}` : '',
    dueWords > 0 ? `Mots : ${dueWords}` : '',
  ].filter(Boolean).join('  ·  ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      <View style={headerStyle}>
        <Text style={titleStyle}>Réviser</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, gap: spacing.xl }}>
        {/* Compteur hero */}
        <View style={{
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.xl,
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          gap: spacing.xs,
          borderWidth: 1,
          borderColor: colors.border.subtle,
        }}>
          <Text style={{ fontSize: 40 }}>🔄</Text>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary }}>
            {dueCards.length} carte{dueCards.length > 1 ? 's' : ''} à réviser
          </Text>
          {dueDetail ? (
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
              {dueDetail}
            </Text>
          ) : null}
        </View>

        {/* CTA */}
        <Button
          label="Commencer la révision →"
          variant="primary"
          onPress={() => {
            track('srs_session_started', { cards_due: dueCards.length });
            router.push('/review-session' as never);
          }}
        />

        <StatsSection mastered={mastered.length} learning={learning.length} newCount={newCards.length} total={allCards.length} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatsSection({ mastered, learning, newCount, total }: {
  mastered: number; learning: number; newCount: number; total: number;
}) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ textAlign: 'center', fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
        Statistiques
      </Text>
      <View style={{
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        padding: spacing.base,
        gap: spacing.sm,
        ...shadows.subtle,
      }}>
        <StatLine label="Total de cartes" value={total} />
        <StatLine label="Maîtrisées (>7j)" value={mastered} color={colors.brand.primary} />
        <StatLine label="En apprentissage" value={learning} color={colors.accent.gold} />
        <StatLine label="Nouvelles" value={newCount} color={colors.text.secondary} />
      </View>
    </View>
  );
}

function StatLine({ label, value, color }: { label: string; value: number; color?: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary }}>{label}</Text>
      <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: color ?? colors.text.primary }}>{value}</Text>
    </View>
  );
}
