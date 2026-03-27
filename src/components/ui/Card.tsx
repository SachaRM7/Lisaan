import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type CardVariant = 'default' | 'lesson' | 'exercise';
type LessonState = 'locked' | 'available' | 'in_progress' | 'completed';
type ExerciseState = 'default' | 'selected' | 'correct' | 'incorrect';

type Props = {
  variant?: CardVariant;
  lessonState?: LessonState;
  exerciseState?: ExerciseState;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Card({
  variant = 'default',
  lessonState = 'available',
  exerciseState = 'default',
  children,
  style,
}: Props) {
  const { colors, borderRadius, shadows } = useTheme();

  const cardStyle: ViewStyle[] = [styles.base, { borderRadius: borderRadius.md }];

  if (variant === 'default') {
    cardStyle.push({
      backgroundColor: colors.background.card,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.subtle,
    });
  }

  if (variant === 'lesson') {
    switch (lessonState) {
      case 'locked':
        cardStyle.push({
          backgroundColor: colors.background.main,
          opacity: 0.5,
        });
        break;
      case 'available':
        cardStyle.push({
          backgroundColor: colors.background.card,
          borderWidth: 1,
          borderColor: colors.border.subtle,
          ...shadows.subtle,
        });
        break;
      case 'in_progress':
        cardStyle.push({
          backgroundColor: colors.background.card,
          borderWidth: 1,
          borderColor: colors.brand.primary,
          ...shadows.medium,
        });
        break;
      case 'completed':
        cardStyle.push({
          backgroundColor: colors.background.card,
          ...shadows.subtle,
        });
        break;
    }
  }

  if (variant === 'exercise') {
    switch (exerciseState) {
      case 'default':
        cardStyle.push({
          backgroundColor: colors.background.card,
          borderWidth: 1,
          borderColor: colors.border.subtle,
          ...shadows.subtle,
          minHeight: 64,
        });
        break;
      case 'selected':
        cardStyle.push({
          backgroundColor: colors.brand.light,
          borderWidth: 2,
          borderColor: colors.brand.primary,
          ...shadows.medium,
          minHeight: 64,
        });
        break;
      case 'correct':
        cardStyle.push({
          backgroundColor: colors.status.successLight,
          borderWidth: 2,
          borderColor: colors.status.success,
          minHeight: 64,
        });
        break;
      case 'incorrect':
        cardStyle.push({
          backgroundColor: colors.status.errorLight,
          borderWidth: 2,
          borderColor: colors.status.error,
          minHeight: 64,
        });
        break;
    }
  }

  cardStyle.push(styles.padding);
  if (style) cardStyle.push(style);

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  padding: {
    padding: 24,
  },
});
