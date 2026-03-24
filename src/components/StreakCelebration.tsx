// src/components/StreakCelebration.tsx

import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface StreakCelebrationProps {
  streakDays: number;
  visible: boolean;
  onHide?: () => void;
}

const MILESTONE_MESSAGES: Record<number, string> = {
  3:  '🔥 3 jours de suite !',
  7:  '💎 Une semaine parfaite !',
  14: '🌟 Deux semaines sans relâche !',
  30: '🏆 Un mois de régularité !',
};

export function StreakCelebration({ streakDays, visible, onHide }: StreakCelebrationProps) {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  const message = MILESTONE_MESSAGES[streakDays];

  useEffect(() => {
    if (visible && message) {
      translateY.value = withSpring(0, { damping: 14 });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto-hide après 3 secondes
      translateY.value = withDelay(3000, withTiming(-80, { duration: 400 }));
      opacity.value = withDelay(3000, withTiming(0, { duration: 400 }, (finished) => {
        if (finished && onHide) runOnJS(onHide)();
      }));
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!message || !visible) return null;

  return (
    <Animated.View style={[styles.banner, animatedStyle]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    backgroundColor: '#1B3A2D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFDF7',
    letterSpacing: 0.3,
  },
});
