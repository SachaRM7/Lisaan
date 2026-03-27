// src/components/BadgeUnlockModal.tsx

import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BadgeUnlock } from '../engines/badge-engine';
import { useTheme } from '../contexts/ThemeContext';

interface BadgeUnlockModalProps {
  badge: BadgeUnlock | null;
  onDismiss: () => void;
}

export function BadgeUnlockModal({ badge, onDismiss }: BadgeUnlockModalProps) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (badge) {
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      setTimeout(() => confettiRef.current?.start(), 400);
    } else {
      scale.value = 0.5;
      opacity.value = 0;
    }
  }, [badge]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!badge) return null;

  return (
    <Modal transparent animationType="none" visible={!!badge} onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' }}>
        <ConfettiCannon
          ref={confettiRef}
          count={60}
          origin={{ x: 200, y: -10 }}
          autoStart={false}
          fadeOut
          colors={[colors.accent.gold, colors.brand.primary, '#4682B4', '#DC143C', '#9370DB']}
          explosionSpeed={350}
          fallSpeed={3000}
        />

        <Animated.View style={[{
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.xl,
          padding: spacing.xl,
          alignItems: 'center',
          width: 300,
          ...shadows.prominent,
        }, cardStyle]}>
          <Text style={{ fontSize: 72, marginBottom: spacing.sm }}>
            {badge.icon}
          </Text>

          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.tiny,
            letterSpacing: 2,
            color: colors.accent.gold,
            marginBottom: spacing.xs,
            textTransform: 'uppercase',
          }}>
            Nouveau badge
          </Text>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.h2,
            color: colors.text.primary,
            marginBottom: spacing.xs,
            textAlign: 'center',
          }}>
            {badge.title_fr}
          </Text>
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.small,
            color: colors.text.secondary,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: spacing.base,
          }}>
            {badge.description_fr}
          </Text>

          <View style={{
            backgroundColor: colors.background.group,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.pill,
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: colors.accent.gold,
          }}>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.accent.gold }}>
              +{badge.xp_reward} XP
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: colors.brand.primary,
              paddingHorizontal: spacing.xxl,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.md,
            }}
            onPress={onDismiss}
          >
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.inverse }}>
              Super !
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
