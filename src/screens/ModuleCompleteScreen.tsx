// src/screens/ModuleCompleteScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui';

interface ModuleCompleteScreenProps {
  moduleTitle: string;
  moduleTitleAr?: string;
  moduleNumber?: number;
  moduleIcon: string;
  totalXP: number;
  lessonsCount: number;
  timeMinutes: number;
  onContinue?: () => void;
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

export function ModuleCompleteScreen({
  moduleTitle, moduleTitleAr, moduleNumber, moduleIcon: _moduleIcon, totalXP, lessonsCount, timeMinutes, onContinue,
}: ModuleCompleteScreenProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

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

  const handleContinue = () => {
    if (onContinue) onContinue();
    else router.replace('/(tabs)/learn');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.main }}>
      <StatusBar barStyle="dark-content" />

      {/* Pattern Zellige dans le tiers supérieur */}
      <ZelligePattern color={colors.brand.primary} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 80, paddingBottom: 48, alignItems: 'center', gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icône couronne animée */}
        <Animated.View style={[{
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: colors.background.card,
          borderWidth: 2, borderColor: colors.accent.gold,
          alignItems: 'center', justifyContent: 'center',
          ...shadows.medium,
        }, iconStyle]}>
          <Ionicons name="trophy" size={52} color={colors.accent.gold} />
        </Animated.View>

        {/* Titres */}
        <Animated.View style={[{ alignItems: 'center', gap: spacing.xs }, titleStyle]}>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary }}>
            Félicitations !
          </Text>
          {moduleNumber != null && (
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary }}>
              Tu as terminé le Module {moduleNumber}
            </Text>
          )}
          <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center' }}>
            {moduleTitle}
          </Text>
          {moduleTitleAr ? (
            <Text style={{ fontFamily: typography.family.arabic, fontSize: typography.size.arabicTitle, color: colors.text.heroArabic, lineHeight: typography.size.arabicTitle * 1.9, marginTop: spacing.xs }}>
              {moduleTitleAr}
            </Text>
          ) : null}
        </Animated.View>

        {/* Carte tableau d'honneur */}
        <Animated.View style={[{
          width: '100%', marginTop: spacing.base,
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.lg,
          padding: 24,
          flexDirection: 'row',
          ...shadows.prominent,
        }, statsStyle]}>
          {/* XP total */}
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Ionicons name="star" size={22} color={colors.accent.gold} />
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.brand.dark }}>
              {totalXP}
            </Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary }}>
              XP total
            </Text>
          </View>

          {/* Séparateur gold */}
          <View style={{ width: 1, backgroundColor: colors.accent.gold, opacity: 0.2 }} />

          {/* Leçons */}
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Ionicons name="book-outline" size={22} color={colors.accent.gold} />
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.brand.dark }}>
              {lessonsCount}
            </Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary }}>
              Leçons
            </Text>
          </View>

          {/* Séparateur gold */}
          <View style={{ width: 1, backgroundColor: colors.accent.gold, opacity: 0.2 }} />

          {/* Minutes */}
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={22} color={colors.accent.gold} />
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.brand.dark }}>
              {timeMinutes}
            </Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary }}>
              Minutes
            </Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[{ width: '100%', marginTop: spacing.sm }, btnStyle]}>
          <Button
            label="Retour à l'accueil →"
            variant="primary"
            onPress={handleContinue}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}
