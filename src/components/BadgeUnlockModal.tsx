// src/components/BadgeUnlockModal.tsx

import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BadgeUnlock } from '../engines/badge-engine';

interface BadgeUnlockModalProps {
  badge: BadgeUnlock | null;
  onDismiss: () => void;
}

export function BadgeUnlockModal({ badge, onDismiss }: BadgeUnlockModalProps) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (badge) {
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      // Déclencher les confettis après un court délai
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
      <View style={styles.overlay}>
        {/* Confetti centré en haut */}
        <ConfettiCannon
          ref={confettiRef}
          count={60}
          origin={{ x: 200, y: -10 }}
          autoStart={false}
          fadeOut
          colors={['#F4C430', '#3CB371', '#4682B4', '#DC143C', '#9370DB']}
          explosionSpeed={350}
          fallSpeed={3000}
        />

        <Animated.View style={[styles.card, cardStyle]}>
          {/* Badge icon */}
          <Text style={styles.icon}>{badge.icon}</Text>

          {/* Titre */}
          <Text style={styles.newBadgeLabel}>NOUVEAU BADGE</Text>
          <Text style={styles.title}>{badge.title_fr}</Text>
          <Text style={styles.description}>{badge.description_fr}</Text>

          {/* XP reward */}
          <View style={styles.xpRow}>
            <Text style={styles.xpText}>+{badge.xp_reward} XP</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Super !</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFDF7',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  icon: { fontSize: 72, marginBottom: 12 },
  newBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#B8860B',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  xpRow: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
  },
  button: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
