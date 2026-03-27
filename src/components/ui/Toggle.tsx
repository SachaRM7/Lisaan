import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 26;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - (TRACK_HEIGHT - THUMB_SIZE);

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function Toggle({ value, onValueChange }: Props) {
  const { colors, borderRadius, shadows } = useTheme();

  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      stiffness: 200,
      damping: 20,
    });
  }, [value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  const trackAnimated = useDerivedValue(() => progress.value);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      trackAnimated.value,
      [0, 1],
      [colors.background.group, colors.brand.primary]
    ),
  }));

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View
        style={[
          styles.track,
          { borderRadius: borderRadius.pill },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: colors.background.card,
              borderRadius: borderRadius.pill,
              ...shadows.subtle,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: (TRACK_HEIGHT - THUMB_SIZE) / 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
});
