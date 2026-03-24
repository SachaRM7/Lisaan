// src/screens/ModuleCompleteScreen.tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { router } from 'expo-router';

interface ModuleCompleteScreenProps {
  moduleTitle: string;
  moduleIcon: string;
  totalXP: number;
  lessonsCount: number;
  timeMinutes: number;
  onContinue?: () => void;
}

export function ModuleCompleteScreen({
  moduleTitle, moduleIcon, totalXP, lessonsCount, timeMinutes, onContinue,
}: ModuleCompleteScreenProps) {
  const confettiRef1 = useRef<ConfettiCannon>(null);
  const confettiRef2 = useRef<ConfettiCannon>(null);
  const iconScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    // Séquence d'entrée
    iconScale.value = withSpring(1, { damping: 8, stiffness: 100 });
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    statsOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    btnOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));

    // Confettis en deux vagues
    setTimeout(() => confettiRef1.current?.start(), 200);
    setTimeout(() => confettiRef2.current?.start(), 800);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const statsStyle = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  const handleContinue = () => {
    if (onContinue) onContinue();
    else router.replace('/(tabs)/learn');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Deux canons à confettis, positions opposées */}
      <ConfettiCannon
        ref={confettiRef1}
        count={80}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut
        colors={['#F4C430', '#3CB371', '#4682B4', '#DC143C']}
        explosionSpeed={300}
        fallSpeed={3500}
      />
      <ConfettiCannon
        ref={confettiRef2}
        count={60}
        origin={{ x: 420, y: 0 }}
        autoStart={false}
        fadeOut
        colors={['#9370DB', '#FF8C00', '#20B2AA', '#FF69B4']}
        explosionSpeed={280}
        fallSpeed={3200}
      />

      {/* Contenu centré */}
      <View style={styles.content}>
        {/* Icône animée */}
        <Animated.Text style={[styles.moduleIcon, iconStyle]}>
          {moduleIcon}
        </Animated.Text>

        {/* Titre */}
        <Animated.View style={titleStyle}>
          <Text style={styles.completedLabel}>MODULE COMPLÉTÉ</Text>
          <Text style={styles.moduleTitle}>{moduleTitle}</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statsRow, statsStyle]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalXP}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{lessonsCount}</Text>
            <Text style={styles.statLabel}>Leçons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{timeMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={btnStyle}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>Continuer →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B3A2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  moduleIcon: { fontSize: 88 },
  completedLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#A8D5BA',
    textAlign: 'center',
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFDF7',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 24,
    marginTop: 8,
  },
  statItem: { alignItems: 'center', minWidth: 60 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#F4C430' },
  statLabel: { fontSize: 12, color: '#A8D5BA', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  continueButton: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 8,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B3A2D',
    letterSpacing: 0.5,
  },
});
