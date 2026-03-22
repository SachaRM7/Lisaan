// src/components/arabic/DialogueDisplay.tsx

import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSizes } from '../../constants/theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { DialogueWithTurns, DialogueTurn } from '../../hooks/useDialogues';

interface DialogueDisplayProps {
  dialogue: DialogueWithTurns;
  revealedTurnIds?: string[];
  highlightTurnId?: string;
  showTranslation?: boolean;
  showTransliteration?: boolean;
  onTurnTap?: (turn: DialogueTurn) => void;
}

export default function DialogueDisplay({
  dialogue,
  revealedTurnIds,
  highlightTurnId,
  showTranslation,
  showTransliteration,
  onTurnTap,
}: DialogueDisplayProps) {
  const settings = useSettingsStore();

  const shouldShowTranslit = showTransliteration !== undefined
    ? showTransliteration
    : settings.transliteration_mode !== 'never';

  const shouldShowTranslation = showTranslation !== undefined
    ? showTranslation
    : settings.translation_mode !== 'never';

  const visibleTurns = revealedTurnIds
    ? dialogue.turns.filter(t => revealedTurnIds.includes(t.id))
    : dialogue.turns;

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <Text style={styles.title}>💬 {dialogue.title_fr}</Text>
      {dialogue.context_fr && (
        <Text style={styles.context}>"{dialogue.context_fr}"</Text>
      )}

      {/* Répliques */}
      <View style={styles.turns}>
        {visibleTurns.map(turn => (
          <TurnBubble
            key={turn.id}
            turn={turn}
            isHighlighted={turn.id === highlightTurnId}
            showTransliteration={shouldShowTranslit}
            showTranslation={shouldShowTranslation}
            onTap={onTurnTap ? () => onTurnTap(turn) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

// ── Bulle individuelle ────────────────────────────────────────────────────────

interface TurnBubbleProps {
  turn: DialogueTurn;
  isHighlighted: boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
  onTap?: () => void;
}

function TurnBubble({
  turn,
  isHighlighted,
  showTransliteration,
  showTranslation,
  onTap,
}: TurnBubbleProps) {
  const isA = turn.speaker === 'A';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const bubble = (
    <Animated.View
      style={[
        styles.bubble,
        isA ? styles.bubbleA : styles.bubbleB,
        isHighlighted && styles.bubbleHighlighted,
        { opacity: fadeAnim },
      ]}
    >
      {/* Label locuteur */}
      <Text style={[styles.speaker, isA ? styles.speakerA : styles.speakerB]}>
        {turn.speaker}
      </Text>

      {/* Texte arabe */}
      <Text style={styles.arabicText}>{turn.arabic_vocalized}</Text>

      {/* Translittération */}
      {showTransliteration && (
        <Text style={styles.transliteration}>{turn.transliteration}</Text>
      )}

      {/* Traduction */}
      {showTranslation && (
        <Text style={styles.translation}>{turn.translation_fr}</Text>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.turnRow, isA ? styles.turnRowA : styles.turnRowB]}>
      {onTap ? (
        <Pressable onPress={onTap} style={isA ? styles.bubbleWrapA : styles.bubbleWrapB}>
          {bubble}
        </Pressable>
      ) : (
        <View style={isA ? styles.bubbleWrapA : styles.bubbleWrapB}>
          {bubble}
        </View>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAF5',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },

  title: {
    fontFamily: 'Inter',
    fontSize: FontSizes.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  context: {
    fontFamily: 'Inter',
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },

  turns: {
    gap: Spacing.sm,
  },

  turnRow: {
    flexDirection: 'row',
  },
  turnRowA: {
    justifyContent: 'flex-start',
  },
  turnRowB: {
    justifyContent: 'flex-end',
  },

  bubbleWrapA: {
    maxWidth: '80%',
    alignItems: 'flex-start',
  },
  bubbleWrapB: {
    maxWidth: '80%',
    alignItems: 'flex-end',
  },

  bubble: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 2,
  },
  bubbleA: {
    backgroundColor: '#F5F5F0',
    borderTopLeftRadius: 4,
  },
  bubbleB: {
    backgroundColor: '#E8F5E9',
    borderTopRightRadius: 4,
    alignItems: 'flex-end',
  },
  bubbleHighlighted: {
    borderWidth: 2,
    borderColor: Colors.gold,
  },

  speaker: {
    fontFamily: 'Inter',
    fontSize: FontSizes.caption,
    fontWeight: '700',
    marginBottom: 2,
  },
  speakerA: {
    color: Colors.primary,
  },
  speakerB: {
    color: Colors.gold,
  },

  arabicText: {
    fontFamily: 'Amiri',
    fontSize: 28,
    lineHeight: 52,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  transliteration: {
    fontFamily: 'Inter',
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
  },
  translation: {
    fontFamily: 'Inter',
    fontSize: FontSizes.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
