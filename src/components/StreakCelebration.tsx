// src/components/StreakCelebration.tsx

import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

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
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  const message = MILESTONE_MESSAGES[streakDays];

  useEffect(() => {
    if (visible && message) {
      translateY.value = withSpring(0, { damping: 14 });
      opacity.value = withTiming(1, { duration: 300 });

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
    <Animated.View style={[{
      position: 'absolute',
      top: 56,
      alignSelf: 'center',
      backgroundColor: colors.brand.dark,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.pill,
      zIndex: 9999,
      ...shadows.medium,
    }, animatedStyle]}>
      <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.inverse, letterSpacing: 0.3 }}>
        {message}
      </Text>
    </Animated.View>
  );
}
