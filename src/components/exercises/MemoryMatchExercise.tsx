// src/components/exercises/MemoryMatchExercise.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import ArabicText from '../arabic/ArabicText';
import type { ExerciseComponentProps, MemoryMatchResult, LocalizedText } from '../../types/exercise';

interface MemoryMatchPair {
  id: string;
  left: LocalizedText;
  right: LocalizedText;
  left_vocalized?: string;
  right_vocalized?: string;
}

interface MemoryCard {
  id: string;
  pairId: string;
  content: string;
  contentVocalized?: string;
  isArabic: boolean;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Props extends ExerciseComponentProps {
  pairs?: MemoryMatchPair[];
  durationSeconds?: number;
}

export function MemoryMatchExercise({
  pairs = [],
  durationSeconds = 60,
  onComplete,
}: Props) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [cards, setCards] = useState<MemoryCard[]>(() => {
    const all: MemoryCard[] = [];
    pairs.forEach(p => {
      all.push({
        id: `${p.id}-a`,
        pairId: p.id,
        content: p.left.ar || '',
        contentVocalized: p.left_vocalized,
        isArabic: true,
        isFlipped: false,
        isMatched: false,
      });
      all.push({
        id: `${p.id}-b`,
        pairId: p.id,
        content: p.right.fr || '',
        contentVocalized: p.right_vocalized,
        isArabic: false,
        isFlipped: false,
        isMatched: false,
      });
    });
    return all.sort(() => Math.random() - 0.5);
  });

  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [flipCount, setFlipCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isLocked, setIsLocked] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const startTime = useRef(Date.now());

  const matchedCount = cards.filter(c => c.isMatched).length / 2;

  useEffect(() => {
    if (timeLeft <= 0 || matchedCount === pairs.length || isFinished) {
      if (isFinished) return;
      setIsFinished(true);
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);

      const result: MemoryMatchResult = {
        exercise_id: 'memory_match',
        correct: matchedCount === pairs.length,
        time_ms: elapsed * 1000,
        attempts: flipCount,
        user_answer: `${matchedCount}/${pairs.length}`,
        type: 'memory_match',
        matches_found: matchedCount,
        total_pairs: pairs.length,
        time_used_seconds: elapsed,
        moves_count: flipCount,
      };

      onComplete(result);
      return;
    }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, matchedCount, pairs.length, isFinished, flipCount, onComplete]);

  const handleFlip = useCallback((cardId: string) => {
    if (isLocked || isFinished) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlipped = [...flippedIds, cardId];
    setFlipCount(f => f + 1);
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      const [idA, idB] = newFlipped;
      const cardA = cards.find(c => c.id === idA);
      const cardB = cards.find(c => c.id === idB);

      if (cardA && cardB) {
        const isMatch = cardA.pairId === cardB.pairId && cardA.id !== cardB.id;

        if (isMatch) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        setTimeout(() => {
          setCards(prev => prev.map(c => {
            if (c.id === idA || c.id === idB) {
              return isMatch ? { ...c, isMatched: true } : { ...c, isFlipped: false };
            }
            return c;
          }));
          setFlippedIds([]);
          setIsLocked(false);
        }, isMatch ? 600 : 900);
      } else {
        setFlippedIds([]);
        setIsLocked(false);
      }
    }
  }, [isLocked, isFinished, flippedIds, cards]);

  const renderCard = (card: MemoryCard) => {
    const isRevealed = card.isFlipped || card.isMatched;

    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          {
            backgroundColor: isRevealed
              ? (card.isMatched ? colors.status.successLight : colors.background.card)
              : colors.brand.primary,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: card.isMatched ? colors.status.success : colors.border.medium,
          },
        ]}
        onPress={() => handleFlip(card.id)}
        activeOpacity={0.7}
        disabled={isRevealed}
      >
        {isRevealed ? (
          card.isArabic ? (
            <ArabicText
              size="medium"
              harakatsMode="always"
              style={{ color: colors.text.heroArabic, textAlign: 'center' }}
            >
              {card.contentVocalized || card.content}
            </ArabicText>
          ) : (
            <Text style={{ fontSize: typography.size.body, fontFamily: typography.family.ui, color: colors.text.primary, textAlign: 'center' }}>
              {card.content}
            </Text>
          )
        ) : (
          <Text style={{ fontSize: typography.size.h2, fontFamily: typography.family.uiBold, color: colors.text.inverse }}>
            ?
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { padding: spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.h2, fontFamily: typography.family.ui, color: colors.text.primary }}>
          {matchedCount}/{pairs.length} paires
        </Text>
        <Text style={{
          fontSize: typography.size.h2,
          fontFamily: typography.family.uiBold,
          color: timeLeft <= 10 ? '#EF4444' : colors.brand.primary
        }}>
          {timeLeft}s
        </Text>
      </View>

      {/* Grid */}
      <View style={[styles.grid, { gap: spacing.sm }]}>
        {cards.map(card => (
          <View key={card.id} style={styles.cardWrapper}>
            {renderCard(card)}
          </View>
        ))}
      </View>

      {/* Progress */}
      <View style={[styles.progressBar, { backgroundColor: colors.border.medium, borderRadius: borderRadius.sm }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.brand.primary,
              borderRadius: borderRadius.sm,
              width: `${(matchedCount / pairs.length) * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '23%',
    aspectRatio: 1,
    marginBottom: 4,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  progressBar: {
    height: 6,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});