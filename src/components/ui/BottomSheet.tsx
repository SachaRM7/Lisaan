// src/components/ui/BottomSheet.tsx

import { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const { colors, typography, spacing } = useTheme();
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(600);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withSpring(0, { damping: 28, stiffness: 300 });
      overlayOpacity.value = withTiming(1, { duration: 220 });
    } else if (mounted) {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(600, { duration: 280 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      statusBarTranslucent
      onRequestClose={onClose}
      animationType="none"
    >
      {/* Overlay */}
      <Reanimated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.3)' }, bgStyle]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Reanimated.View>

      {/* Sheet */}
      <Reanimated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.background.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
          },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', paddingTop: spacing.base, paddingBottom: spacing.xs }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border.medium }} />
        </View>

        {title ? (
          <Text
            style={{
              fontFamily: typography.family.uiBold,
              fontSize: typography.size.h2,
              color: colors.text.primary,
              textAlign: 'center',
              paddingBottom: spacing.xs,
              paddingHorizontal: spacing.lg,
            }}
          >
            {title}
          </Text>
        ) : null}

        {children}
      </Reanimated.View>
    </Modal>
  );
}
