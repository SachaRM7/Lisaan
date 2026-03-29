import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type BadgeVariant = 'status' | 'difficulty' | 'category';

type Props = {
  variant?: BadgeVariant;
  label: string;
  style?: ViewStyle;
};

export function Badge({ variant = 'category', label, style }: Props) {
  const { colors, typography, borderRadius } = useTheme();

  const containerStyle: ViewStyle = {
    height: 32,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  };

  let bgColor: string = colors.background.group;
  let textColor: string = colors.text.secondary;

  if (variant === 'status') {
    bgColor = colors.brand.light;
    textColor = colors.brand.dark;
  } else if (variant === 'difficulty') {
    bgColor = colors.status.errorLight;
    textColor = colors.status.error;
  }

  return (
    <View style={[containerStyle, { backgroundColor: bgColor }, style]}>
      <Text
        style={[
          styles.label,
          {
            fontFamily: typography.family.uiMedium,
            fontSize: typography.size.small,
            color: textColor,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    letterSpacing: 0,
  },
});
