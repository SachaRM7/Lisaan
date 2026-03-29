// src/components/ui/SegmentedControl.tsx

import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

interface Segment {
  value: string;
  label: string;
  fontSize?: number;
  fontFamily?: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ segments, value, onChange }: SegmentedControlProps) {
  const { colors, typography, borderRadius, shadows } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const thumbX = useSharedValue(-1000);

  const selectedIndex = Math.max(0, segments.findIndex(s => s.value === value));

  useEffect(() => {
    if (containerWidth > 0) {
      const segW = (containerWidth - 8) / segments.length;
      thumbX.value = withSpring(selectedIndex * segW, { damping: 22, stiffness: 220 });
    }
  }, [selectedIndex, containerWidth]);

  const thumbStyle = useAnimatedStyle(() => {
    if (containerWidth === 0) return { opacity: 0 };
    return {
      width: (containerWidth - 8) / segments.length,
      transform: [{ translateX: thumbX.value }],
    };
  });

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.background.group,
        borderRadius: borderRadius.lg,
        padding: 4,
        position: 'relative',
        height: 52,
      }}
    >
      {/* Animated thumb */}
      <Reanimated.View
        style={[
          {
            position: 'absolute',
            top: 4,
            left: 4,
            bottom: 4,
            borderRadius: borderRadius.md,
            backgroundColor: colors.background.card,
            ...shadows.subtle,
          },
          thumbStyle,
        ]}
      />

      {/* Segments */}
      {segments.map((seg) => {
        const isSelected = value === seg.value;
        return (
          <Pressable
            key={seg.value}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(seg.value);
            }}
          >
            <Text
              style={{
                fontFamily: seg.fontFamily ?? typography.family.arabic,
                fontSize: seg.fontSize ?? typography.size.arabicBody,
                color: isSelected ? colors.text.primary : colors.text.secondary,
                lineHeight: (seg.fontSize ?? typography.size.arabicBody) * 1.4,
              }}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
