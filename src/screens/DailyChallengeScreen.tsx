// src/screens/DailyChallengeScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui';
import { useDailyChallenges } from '../hooks/useDailyChallenges';
import { useAuthStore } from '../stores/useAuthStore';

interface DailyChallengeScreenProps {
  onComplete?: () => void;
}

// Pattern Zellige : grille de losanges unicode à opacité décroissante
function ZelligePattern({ color }: { color: string }) {
  const rows = [0.04, 0.032, 0.024, 0.016, 0.008, 0.003];
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220, overflow: 'hidden' }} pointerEvents="none">
      {rows.map((opacity, i) => (
        <Text
          key={i}
          style={{
            color,
            opacity,
            fontSize: 18,
            letterSpacing: 8,
            textAlign: 'center',
            lineHeight: 34,
          }}
        >
          {i % 2 === 0
            ? '◆  ◇  ◆  ◇  ◆  ◇  ◆  ◇  ◆  ◇  ◆'
            : '◇  ◆  ◇  ◆  ◇  ◆  ◇  ◆  ◇  ◆  ◇'}
        </Text>
      ))}
    </View>
  );
}

function getThemeIcon(theme: string): keyof typeof Ionicons.glyphMap {
  switch (theme) {
    case 'conjugaison': return 'git-commit';
    case 'vocabulaire': return 'book';
    case 'alphabet': return 'grid';
    case 'situations': return 'chatbubbles';
    case 'mixte': return 'shuffle';
    default: return 'star';
  }
}

function getThemeColor(theme: string, colors: any): string {
  switch (theme) {
    case 'conjugaison': return colors.brand.primary;
    case 'vocabulaire': return colors.accent.gold;
    case 'alphabet': return colors.brand.dark;
    case 'situations': return colors.status.success;
    case 'mixte': return colors.brand.primary;
    default: return colors.brand.primary;
  }
}

export function DailyChallengeScreen({ onComplete }: DailyChallengeScreenProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const { todayChallenge, isTodayCompleted, todayScore, loading, completeChallenge } = useDailyChallenges();
  const effectiveUserId = useAuthStore(state => state.effectiveUserId());

  const iconScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withSpring(1, { damping: 8, stiffness: 100 });
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    statsOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    btnOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const statsStyle = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  const handleStartChallenge = () => {
    // TODO: Implémenter le launcher d'exercices selon exercise_refs
    // Pour l'instant, on simule une complétion
    if (todayChallenge) {
      completeChallenge(100, todayChallenge.xp_reward);
    }
  };

  const handleContinue = () => {
    if (onComplete) onComplete();
    else router.replace('/(tabs)/learn');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.main, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: typography.size.body, fontFamily: typography.family.ui, color: colors.text.secondary }}>Chargement...</Text>
      </View>
    );
  }

  if (!todayChallenge) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.main, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: typography.size.body, fontFamily: typography.family.ui, color: colors.text.secondary }}>Aucun défi aujourd'hui</Text>
      </View>
    );
  }

  const themeColor = getThemeColor(todayChallenge.theme, colors);
  const themeIcon = getThemeIcon(todayChallenge.theme);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.main }}>
      <StatusBar barStyle="dark-content" />

      {/* Pattern Zellige dans le tiers supérieur */}
      <ZelligePattern color={colors.brand.primary} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 80, paddingBottom: 48, alignItems: 'center', gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icône défi quotidienne */}
        <Animated.View style={[{
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: colors.background.card,
          borderWidth: 2, borderColor: themeColor,
          alignItems: 'center', justifyContent: 'center',
          ...shadows.medium,
        }, iconStyle]}>
          <Ionicons name={themeIcon} size={52} color={themeColor} />
        </Animated.View>

        {/* Titres */}
        <Animated.View style={[{ alignItems: 'center', gap: spacing.xs }, titleStyle]}>
          <Text style={{ fontSize: typography.size.h2, fontFamily: typography.family.uiBold, color: colors.text.primary, textAlign: 'center' }}>
            {todayChallenge.title_fr}
          </Text>
          {todayChallenge.title_ar && (
            <Text style={{ fontSize: typography.size.arabicTitle, fontFamily: typography.family.arabic, color: colors.text.heroArabic, lineHeight: typography.size.arabicTitle * 1.9 }}>
              {todayChallenge.title_ar}
            </Text>
          )}
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[{
          flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: spacing.md,
        }, statsStyle]}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="star" size={24} color={colors.accent.gold} />
            <Text style={{ fontSize: typography.size.h2, fontFamily: typography.family.ui, color: colors.text.primary }}>
              +{todayChallenge.xp_reward} XP
            </Text>
          </View>

          {todayChallenge.badge_reward && (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="ribbon" size={24} color={colors.accent.gold} />
              <Text style={{ fontSize: typography.size.body, fontFamily: typography.family.ui, color: colors.text.secondary }}>Badge</Text>
            </View>
          )}
        </Animated.View>

        {/* StatuttodayScore */}
        {isTodayCompleted && (
          <Animated.View style={[{
            backgroundColor: colors.status.successLight,
            paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
            borderRadius: borderRadius.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          }, statsStyle]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
            <Text style={{ fontSize: typography.size.body, fontFamily: typography.family.ui, color: colors.status.success }}>
              Défi complété ! Score: {todayScore}
            </Text>
          </Animated.View>
        )}

        {/* Bouton */}
        <Animated.View style={[{ width: '100%', marginTop: spacing.md }, btnStyle]}>
          {isTodayCompleted ? (
            <Button variant="secondary" label="Continuer" onPress={handleContinue} />
          ) : (
            <Button label="Commencer le défi" onPress={handleStartChallenge} />
          )}
        </Animated.View>

        {/* Total XP */}
        <Animated.View style={[{
          flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md,
        }, statsStyle]}>
          <Ionicons name="trophy" size={16} color={colors.accent.gold} />
          <Text style={{ fontSize: typography.size.body, fontFamily: typography.family.ui, color: colors.text.secondary }}>
            ID: {effectiveUserId?.slice(0,8) ?? '—'}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}