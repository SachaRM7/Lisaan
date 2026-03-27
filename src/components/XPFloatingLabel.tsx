// src/components/XPFloatingLabel.tsx

import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

interface XPFloatingLabelProps {
  xp: number;
  visible: boolean;
  onAnimationEnd?: () => void;
}

export function XPFloatingLabel({ xp, visible, onAnimationEnd }: XPFloatingLabelProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    opacity.value = 0;
    translateY.value = 0;

    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(-60, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withDelay(
      500,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onAnimationEnd) runOnJS(onAnimationEnd)();
      })
    );
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[{
      position: 'absolute',
      alignSelf: 'center',
      bottom: 80,
      zIndex: 999,
      backgroundColor: colors.accent.gold,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.pill,
      ...shadows.medium,
    }, animatedStyle]}>
      <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary, letterSpacing: 0.5 }}>
        +{xp} XP
      </Text>
    </Animated.View>
  );
}
