// src/components/arabic/DialogueDisplay.tsx

import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { DialogueWithTurns, DialogueTurn } from '../../hooks/useDialogues';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { colors, typography, spacing, borderRadius } = useTheme();

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
    <View style={{ backgroundColor: colors.background.group, borderRadius: borderRadius.lg, padding: spacing.base, gap: spacing.xs }}>
      {/* En-tête */}
      <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.primary }}>
        💬 {dialogue.title_fr}
      </Text>
      {dialogue.context_fr && (
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, fontStyle: 'italic', marginBottom: spacing.xs }}>
          &ldquo;{dialogue.context_fr}&rdquo;
        </Text>
      )}

      {/* Répliques */}
      <View style={{ gap: spacing.xs }}>
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

interface TurnBubbleProps {
  turn: DialogueTurn;
  isHighlighted: boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
  onTap?: () => void;
}

function TurnBubble({ turn, isHighlighted, showTransliteration, showTranslation, onTap }: TurnBubbleProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const isA = turn.speaker === 'A';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const arabicLineHeight = Math.round(28 * 1.9);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
  }, []);

  const bubbleBg = isA ? colors.background.card : colors.brand.light;

  const bubble = (
    <Animated.View style={[
      {
        backgroundColor: bubbleBg,
        borderRadius: borderRadius.md,
        borderTopLeftRadius: isA ? 4 : borderRadius.md,
        borderTopRightRadius: isA ? borderRadius.md : 4,
        padding: spacing.sm,
        gap: 2,
        borderWidth: isHighlighted ? 2 : 0,
        borderColor: isHighlighted ? colors.accent.gold : 'transparent',
      },
      { opacity: fadeAnim },
    ]}>
      {/* Label locuteur */}
      <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.tiny, color: isA ? colors.brand.primary : colors.accent.gold, marginBottom: 2 }}>
        {turn.speaker}
      </Text>

      {/* Texte arabe */}
      <Text style={{
        fontFamily: typography.family.arabic,
        fontSize: typography.size.arabicBody,
        lineHeight: arabicLineHeight,
        color: colors.text.heroArabic,
        textAlign: 'right',
        writingDirection: 'rtl',
      }}>
        {turn.arabic_vocalized}
      </Text>

      {/* Translittération */}
      {showTransliteration && (
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
          {turn.transliteration}
        </Text>
      )}

      {/* Traduction */}
      {showTranslation && (
        <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, fontStyle: 'italic' }}>
          {turn.translation_fr}
        </Text>
      )}
    </Animated.View>
  );

  return (
    <View style={{ flexDirection: 'row', justifyContent: isA ? 'flex-start' : 'flex-end' }}>
      {onTap ? (
        <Pressable onPress={onTap} style={{ maxWidth: '80%', alignItems: isA ? 'flex-start' : 'flex-end' }}>
          {bubble}
        </Pressable>
      ) : (
        <View style={{ maxWidth: '80%', alignItems: isA ? 'flex-start' : 'flex-end' }}>
          {bubble}
        </View>
      )}
    </View>
  );
}
