import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type Props = {
  style?: ViewStyle;
};

export function Divider({ style }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Ligne gauche */}
      <View style={[styles.line, { flex: 1, backgroundColor: colors.border.subtle }]} />
      {/* Losange central 4×4 */}
      <View
        style={[
          styles.diamond,
          {
            backgroundColor: colors.border.subtle,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      {/* Ligne droite */}
      <View style={[styles.line, { flex: 1, backgroundColor: colors.border.subtle }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 12,
    gap: 8,
  },
  line: {
    height: 1,
  },
  diamond: {
    width: 4,
    height: 4,
  },
});
