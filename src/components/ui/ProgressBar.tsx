import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

type Props = {
  progress: number; // 0 à 1
  height?: number;
  variant?: 'standard' | 'thin';
  style?: ViewStyle;
};

export function ProgressBar({ progress, height, variant = 'standard', style }: Props) {
  const { colors, borderRadius } = useTheme();
  const barHeight = height ?? (variant === 'thin' ? 4 : 6);

  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(Math.min(Math.max(progress, 0), 1), {
      stiffness: 90,
      damping: 15,
    });
  }, [progress]);

  const animatedFill = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        {
          height: barHeight,
          borderRadius: borderRadius.pill,
          backgroundColor: colors.background.group,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height: barHeight,
            borderRadius: borderRadius.pill,
            backgroundColor: colors.brand.primary,
          },
          animatedFill,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
