// src/components/review/ExamResultScreen.tsx

import { View, Text, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import type { ExamQuestionResult } from '../../types/review';
import ArabicText from '../arabic/ArabicText';

interface ExamResultScreenProps {
  results: ExamQuestionResult[];
  onContinue: () => void;
}

export function ExamResultScreen({ results, onContinue }: ExamResultScreenProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const total = results.length;
  const correct = results.filter(r => r.is_correct).length;
  const errors = results.filter(r => !r.is_correct);
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = percentage === 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xxxl,
          paddingBottom: spacing.xl,
          gap: spacing.xl,
          alignItems: 'center',
        }}
      >
        {/* Note hero */}
        <View style={{
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.xl,
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          width: '100%',
          borderWidth: 1,
          borderColor: colors.border.subtle,
          gap: spacing.sm,
        }}>
          {isPerfect && (
            <Text style={{ fontSize: 48 }}>🏅</Text>
          )}
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: 48, color: colors.brand.primary, lineHeight: 56 }}>
            {correct}/{total}
          </Text>
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary }}>
            {percentage}%
          </Text>
          {/* ProgressBar */}
          <View style={{ width: '100%', height: 8, backgroundColor: colors.background.card, borderRadius: 4, overflow: 'hidden', marginTop: spacing.xs }}>
            <View style={{
              height: 8,
              width: `${percentage}%`,
              backgroundColor: isPerfect ? colors.accent.gold : colors.brand.primary,
              borderRadius: 4,
            }} />
          </View>
          {isPerfect ? (
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.accent.gold }}>
              Parfait !
            </Text>
          ) : (
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center' }}>
              {errors.length} erreur{errors.length > 1 ? 's' : ''} à corriger
            </Text>
          )}
        </View>

        {/* Corrections */}
        {errors.length > 0 && (
          <View style={{ width: '100%', gap: spacing.sm }}>
            <Text style={{
              fontFamily: typography.family.uiBold,
              fontSize: typography.size.tiny,
              color: colors.text.secondary,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              Corrections
            </Text>
            {errors.map((err, i) => (
              <View key={i} style={{
                backgroundColor: colors.background.card,
                borderRadius: borderRadius.md,
                padding: spacing.base,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                gap: spacing.xs,
                ...shadows.subtle,
              }}>
                {/* Prompt */}
                {/[\u0600-\u06FF]/.test(err.prompt_text) ? (
                  <ArabicText size="large">{err.prompt_text}</ArabicText>
                ) : (
                  <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.primary }}>
                    {err.prompt_text}
                  </Text>
                )}
                <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.status.error }}>
                  Ta réponse : {err.user_answer || '—'}
                </Text>
                <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.status.success }}>
                  Bonne réponse : {err.correct_answer}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bouton Continuer */}
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            width: '100%',
            height: 56,
            borderRadius: borderRadius.pill,
            backgroundColor: pressed ? colors.brand.dark : colors.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...(shadows.prominent as object),
          })}
        >
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.inverse }}>
            Continuer →
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
