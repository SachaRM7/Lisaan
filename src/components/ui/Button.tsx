import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type Props = {
  variant?: ButtonVariant;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: object;
};

export function Button({
  variant = 'primary',
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
}: Props) {
  const { colors, typography, borderRadius, shadows } = useTheme();
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 2,
    }).start();
  }, [scale]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 2,
    }).start();
  }, [scale]);

  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    variant === 'primary' && {
      height: 56,
      borderRadius: borderRadius.pill,
      backgroundColor: isDisabled ? colors.status.disabled : colors.brand.primary,
      ...(!isDisabled ? shadows.prominent : {}),
    },
    variant === 'secondary' && {
      height: 56,
      borderRadius: borderRadius.pill,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: isDisabled ? colors.status.disabled : colors.brand.primary,
    },
    variant === 'ghost' && {
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: 'transparent',
      paddingHorizontal: 16,
    },
    style,
  ];

  const textStyle = [
    styles.label,
    {
      fontFamily: typography.family.uiBold,
      fontSize: typography.size.body,
    },
    variant === 'primary' && {
      color: isDisabled ? colors.text.secondary : colors.text.inverse,
    },
    variant === 'secondary' && {
      color: isDisabled ? colors.status.disabled : colors.brand.primary,
    },
    variant === 'ghost' && {
      color: colors.text.secondary,
    },
  ];

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        style={containerStyle}
        onPress={isDisabled ? undefined : onPress}
        onPressIn={isDisabled ? undefined : onPressIn}
        onPressOut={isDisabled ? undefined : onPressOut}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? colors.text.inverse : colors.brand.primary}
            size="small"
          />
        ) : (
          <Text style={textStyle}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    letterSpacing: 0.2,
  },
});
