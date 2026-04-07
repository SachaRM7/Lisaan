/**
 * FeedbackWidget.tsx — Widget de feedback bêta.
 *
 * Affiche une invite de feedback (rating + commentaire optionnel)
 * visible uniquement pour les beta-testeurs.
 * Après soumission, affiche un message de remerciement.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { submitBetaFeedback } from '../../services/feedback-service';

const STAR_LABELS = ['Pas satisfait', 'Moyennement', 'Correct', 'Bien', 'Excellent'];

interface Props {
  /** Called when feedback is successfully submitted */
  onSubmitted?: () => void;
}

export function FeedbackWidget({ onSubmitted }: Props) {
  const { colors, typography, borderRadius, spacing, shadows } = useTheme();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    const result = await submitBetaFeedback({ rating, comment: comment.trim() || undefined });
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      onSubmitted?.();
    } else {
      setError(result.error ?? 'Erreur lors de la soumission');
    }
  }

  if (submitted) {
    return (
      <View style={{
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginHorizontal: spacing.lg,
        marginTop: spacing.xl,
        alignItems: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.brand.primary + '33',
        ...shadows.subtle,
      }}>
        <Ionicons name="checkmark-circle" size={32} color={colors.brand.primary} />
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.body,
          color: colors.brand.dark,
          textAlign: 'center',
        }}>
          Merci pour ton feedback !
        </Text>
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.small,
          color: colors.text.secondary,
          textAlign: 'center',
        }}>
          Ta contribution aide à améliorer Lisaan.
        </Text>
      </View>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <View style={{
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginTop: spacing.xl,
      gap: spacing.base,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.subtle,
    }}>
      <Text style={{
        fontFamily: typography.family.uiBold,
        fontSize: typography.size.body,
        color: colors.text.primary,
      }}>
        Donne ton avis sur Lisaan
      </Text>
      <Text style={{
        fontFamily: typography.family.ui,
        fontSize: typography.size.small,
        color: colors.text.secondary,
      }}>
        Comment évalues-tu ton expérience en tant que bêta-testeur ?
      </Text>

      {/* Stars */}
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => setRating(star)}
            onPressIn={() => setHoverRating(star)}
            onPressOut={() => setHoverRating(0)}
            hitSlop={8}
          >
            <Ionicons
              name={star <= displayRating ? 'star' : 'star-outline'}
              size={32}
              color={star <= displayRating ? colors.accent.gold : colors.text.secondary}
            />
          </Pressable>
        ))}
      </View>
      {rating > 0 && (
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.small,
          color: colors.text.secondary,
          fontStyle: 'italic',
        }}>
          {STAR_LABELS[rating - 1]}
        </Text>
      )}

      {/* Comment */}
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Commentaire (optionnel)"
        placeholderTextColor={colors.text.secondary}
        multiline
        numberOfLines={3}
        style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.body,
          color: colors.text.primary,
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.md,
          padding: spacing.base,
          minHeight: 80,
          textAlignVertical: 'top',
          borderWidth: 1,
          borderColor: colors.border.subtle,
        }}
      />

      {error && (
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.small,
          color: colors.status.error,
        }}>
          {error}
        </Text>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={rating === 0 || submitting}
        style={({ pressed }) => ({
          backgroundColor: rating === 0 ? colors.text.secondary : pressed ? colors.brand.dark : colors.brand.primary,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.base,
          alignItems: 'center',
          opacity: (submitting ? 0.7 : 1) as number,
        })}
      >
        {submitting ? (
          <ActivityIndicator color={colors.text.inverse} size="small" />
        ) : (
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.body,
            color: colors.text.inverse,
          }}>
            Envoyer mon avis
          </Text>
        )}
      </Pressable>
    </View>
  );
}
