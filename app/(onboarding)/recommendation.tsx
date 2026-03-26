// app/(onboarding)/recommendation.tsx
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../src/stores/useOnboardingStore';
import type { Variant, OnboardingAnswers } from '../../src/types/onboarding';
import { syncOnboardingToSupabase } from '../../src/engines/onboarding-sync';
import { Colors, Spacing, Radius, Layout, FontSizes } from '../../src/constants/theme';
import { track } from '../../src/analytics/posthog';

const VARIANT_LABELS: Record<Variant, string> = {
  msa:       'Arabe standard (MSA)',
  darija:    'Marocain (Darija)',
  egyptian:  'Égyptien',
  levantine: 'Levantin',
  khaliji:   'Golfe (Khaliji)',
  quranic:   'Arabe coranique',
};

function VariantBar({
  variant,
  score,
  isRecommended,
  isUnavailable,
}: {
  variant: Variant;
  score: number;
  isRecommended: boolean;
  isUnavailable: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: score,
      duration: 700,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const widthInterpolated = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.barRow, isRecommended && styles.barRowHighlighted]}>
      <View style={styles.barHeader}>
        <View style={styles.barLabelRow}>
          <Text style={[styles.barLabel, isRecommended && styles.barLabelRecommended]}>
            {VARIANT_LABELS[variant]}
          </Text>
          {isRecommended && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Recommandé</Text>
            </View>
          )}
          {isUnavailable && !isRecommended && (
            <View style={styles.badgeSoon}>
              <Text style={styles.badgeSoonText}>Bientôt</Text>
            </View>
          )}
        </View>
        <Text style={[styles.barPct, isRecommended && styles.barPctRecommended]}>
          {Math.round(score * 100)}%
        </Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={[styles.barFill, isRecommended && styles.barFillRecommended, { width: widthInterpolated as any }]}
        />
      </View>
    </View>
  );
}

export default function Recommendation() {
  const router = useRouter();
  const {
    recommendation,
    completeOnboarding,
    motivations,
    arabicLevel,
    primaryGoal,
    dialectContact,
    dailyTime,
  } = useOnboardingStore();

  // Sécurité : si on arrive ici sans recommandation (navigation directe), rediriger
  if (!recommendation) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Complète d'abord les 5 questions.</Text>
          <TouchableOpacity onPress={() => router.replace('/(onboarding)/step1')}>
            <Text style={styles.linkText}>Recommencer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { scores, recommended, message_fr, available } = recommendation;

  // Trier les variantes par score décroissant, filtrer celles à 0
  const sortedVariants = (Object.entries(scores) as Array<[Variant, number]>)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  async function handleStart() {
    // Marquer l'onboarding comme complété localement
    await completeOnboarding();

    track('onboarding_completed', {
      variant_recommended: recommended,
      variant_chosen: available ? recommended : 'msa',
      level: arabicLevel,
      daily_goal: dailyTime,
    });

    // Fire-and-forget : ne bloque pas la navigation si le réseau est down
    if (arabicLevel && primaryGoal && dialectContact && dailyTime) {
      const answers: OnboardingAnswers = {
        motivations,
        arabic_level: arabicLevel,
        primary_goal: primaryGoal,
        dialect_contact: dialectContact,
        daily_time: dailyTime,
      };
      syncOnboardingToSupabase({
        answers,
        recommendedVariant: recommended,
        chosenVariant: available ? recommended : 'msa',
      }).catch(() => {/* silencieux — sync au prochain lancement */});
    }

    router.replace('/(tabs)/learn');
  }

  const ctaLabel = available
    ? `Commencer avec ${VARIANT_LABELS[recommended]}`
    : 'Commencer par le MSA';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Titre */}
        <Text style={styles.title}>Ton parcours idéal</Text>
        <Text style={styles.titleSub}>Basé sur tes réponses, voici notre recommandation</Text>

        {/* Barres de pertinence */}
        <View style={styles.barsSection}>
          {sortedVariants.map(([variant, score]) => (
            <VariantBar
              key={variant}
              variant={variant}
              score={score}
              isRecommended={variant === recommended}
              isUnavailable={variant !== 'msa'}
            />
          ))}
        </View>

        {/* Badge "Bientôt disponible" si variante non dispo */}
        {!available && (
          <View style={styles.unavailableBanner}>
            <Text style={styles.unavailableText}>
              Le module {VARIANT_LABELS[recommended]} sera ajouté prochainement.{'\n'}
              On commence par le MSA — les fondamentaux sont les mêmes.
            </Text>
          </View>
        )}

        {/* Message personnalisé */}
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{message_fr}</Text>
        </View>

        {/* Message de réassurance */}
        <Text style={styles.reassurance}>
          {'\u{1F4A1}'} L'alphabet et les sons sont les mêmes pour toutes les variantes. Tu n'apprendras ça qu'une seule fois.
        </Text>

      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctaPrimary} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.ctaPrimaryLabel}>{ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  errorText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  linkText: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['3xl'],
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  titleSub: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginBottom: Spacing['3xl'],
  },

  // Barres
  barsSection: {
    gap: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  barRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barRowHighlighted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  barLabel: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  barLabelRecommended: {
    color: Colors.primary,
  },
  barPct: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  barPctRecommended: {
    color: Colors.primary,
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.textSecondary,
    borderRadius: Radius.full,
  },
  barFillRecommended: {
    backgroundColor: Colors.primary,
  },

  // Badges
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: FontSizes.small,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  badgeSoon: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeSoonText: {
    fontSize: FontSizes.small,
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },

  // Message perso
  unavailableBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  unavailableText: {
    fontSize: FontSizes.caption,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  messageBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: FontSizes.body,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  reassurance: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },

  // Footer
  footer: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
    gap: Spacing.md,
  },
  ctaPrimary: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryLabel: {
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
});
