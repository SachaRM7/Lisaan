// src/components/XPFloatingLabel.tsx

import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface XPFloatingLabelProps {
  xp: number;
  visible: boolean;
  onAnimationEnd?: () => void;
}

export function XPFloatingLabel({ xp, visible, onAnimationEnd }: XPFloatingLabelProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    opacity.value = 0;
    translateY.value = 0;

    // Apparition
    opacity.value = withTiming(1, { duration: 200 });
    // Montée
    translateY.value = withTiming(-60, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
    // Disparition avec délai
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
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>+{xp} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 80,
    zIndex: 999,
    backgroundColor: 'rgba(255, 193, 7, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
});
