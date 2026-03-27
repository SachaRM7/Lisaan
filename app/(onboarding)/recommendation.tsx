// app/(onboarding)/recommendation.tsx
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../src/stores/useOnboardingStore';
import type { Variant, OnboardingAnswers } from '../../src/types/onboarding';
import { syncOnboardingToSupabase } from '../../src/engines/onboarding-sync';
import { useTheme } from '../../src/contexts/ThemeContext';
import { track } from '../../src/analytics/posthog';
import { Button } from '../../src/components/ui';

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
  const { colors, typography, spacing, borderRadius } = useTheme();
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
    <View style={{
      backgroundColor: isRecommended ? colors.brand.light : colors.background.card,
      borderRadius: borderRadius.md,
      padding: spacing.base,
      borderWidth: 1.5,
      borderColor: isRecommended ? colors.brand.primary : colors.border.subtle,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
          <Text style={{
            fontFamily: typography.family.uiMedium,
            fontSize: typography.size.small,
            color: isRecommended ? colors.brand.primary : colors.text.primary,
          }}>
            {VARIANT_LABELS[variant]}
          </Text>
          {isRecommended && (
            <View style={{ backgroundColor: colors.brand.primary, borderRadius: borderRadius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.tiny, color: colors.text.inverse }}>Recommandé</Text>
            </View>
          )}
          {isUnavailable && !isRecommended && (
            <View style={{ backgroundColor: colors.accent.gold, borderRadius: borderRadius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
              <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.tiny, color: colors.text.inverse }}>Bientôt</Text>
            </View>
          )}
        </View>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.small,
          color: isRecommended ? colors.brand.primary : colors.text.secondary,
        }}>
          {Math.round(score * 100)}%
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.background.group, borderRadius: borderRadius.pill, overflow: 'hidden' }}>
        <Animated.View
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={{ height: '100%', backgroundColor: isRecommended ? colors.brand.primary : colors.text.secondary, borderRadius: borderRadius.pill, width: widthInterpolated as any }}
        />
      </View>
    </View>
  );
}

export default function Recommendation() {
  const { colors, typography, spacing, borderRadius } = useTheme();
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

  if (!recommendation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base }}>
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary }}>
            Complète d'abord les 5 questions.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(onboarding)/step1')}>
            <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.brand.primary }}>
              Recommencer
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { scores, recommended, message_fr, available } = recommendation;

  const sortedVariants = (Object.entries(scores) as Array<[Variant, number]>)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  async function handleStart() {
    await completeOnboarding();

    track('onboarding_completed', {
      variant_recommended: recommended,
      variant_chosen: available ? recommended : 'msa',
      level: arabicLevel,
      daily_goal: dailyTime,
    });

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
      }).catch(() => {/* silencieux */});
    }

    router.replace('/(tabs)/learn');
  }

  const ctaLabel = available
    ? `Commencer avec ${VARIANT_LABELS[recommended]}`
    : 'Commencer par le MSA';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>

        <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary, marginBottom: spacing.sm }}>
          Ton parcours idéal
        </Text>
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, marginBottom: spacing.xxxl }}>
          Basé sur tes réponses, voici notre recommandation
        </Text>

        {/* Barres */}
        <View style={{ gap: spacing.base, marginBottom: spacing.xl }}>
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

        {/* Banner non disponible */}
        {!available && (
          <View style={{
            backgroundColor: colors.brand.light,
            borderRadius: borderRadius.md,
            padding: spacing.base,
            marginBottom: spacing.base,
            borderLeftWidth: 4,
            borderLeftColor: colors.accent.gold,
          }}>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.primary, lineHeight: 20 }}>
              Le module {VARIANT_LABELS[recommended]} sera ajouté prochainement.{'\n'}
              On commence par le MSA — les fondamentaux sont les mêmes.
            </Text>
          </View>
        )}

        {/* Message personnalisé */}
        <View style={{
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.lg,
          padding: spacing.xl,
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border.subtle,
        }}>
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary, lineHeight: 24 }}>
            {message_fr}
          </Text>
        </View>

        {/* Réassurance */}
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, fontStyle: 'italic', lineHeight: 20, textAlign: 'center', paddingHorizontal: spacing.sm }}>
          {'\u{1F4A1}'} L'alphabet et les sons sont les mêmes pour toutes les variantes. Tu n'apprendras ça qu'une seule fois.
        </Text>

      </ScrollView>

      {/* Footer */}
      <View style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
        backgroundColor: colors.background.main,
      }}>
        <Button label={ctaLabel} variant="primary" onPress={handleStart} />
      </View>
    </SafeAreaView>
  );
}
