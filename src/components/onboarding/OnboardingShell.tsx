// src/components/onboarding/OnboardingShell.tsx
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui';

interface OnboardingShellProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  children: React.ReactNode;
}

export default function OnboardingShell({
  step,
  totalSteps = 5,
  title,
  subtitle,
  onNext,
  nextDisabled = false,
  nextLabel = 'Suivant',
  children,
}: OnboardingShellProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const progress = step / totalSteps;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.base,
        paddingBottom: spacing.sm,
      }}>
        {step > 1 ? (
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, justifyContent: 'center' }} hitSlop={12}>
            <Text style={{ fontSize: 22, color: colors.text.secondary }}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36, height: 36 }} />
        )}
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.text.secondary }}>
          {step} / {totalSteps}
        </Text>
        <View style={{ width: 36, height: 36 }} />
      </View>

      {/* Barre de progression */}
      <View style={{ height: 4, backgroundColor: colors.background.group, marginHorizontal: spacing.lg, borderRadius: borderRadius.pill, overflow: 'hidden' }}>
        <View style={{ height: '100%', backgroundColor: colors.brand.primary, borderRadius: borderRadius.pill, width: `${progress * 100}%` as any }} />
      </View>

      {/* Contenu scrollable */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary, marginBottom: spacing.sm }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, marginBottom: spacing.xl }}>
            {subtitle}
          </Text>
        ) : null}
        <View style={{ gap: spacing.sm, marginTop: spacing.base }}>
          {children}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
        backgroundColor: colors.background.main,
      }}>
        <Button
          label={nextLabel}
          variant="primary"
          onPress={onNext}
          disabled={nextDisabled}
        />
      </View>
    </SafeAreaView>
  );
}
