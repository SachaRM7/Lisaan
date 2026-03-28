// src/components/ui/RichSelectionRow.tsx

import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface RichSelectionRowProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}

export function RichSelectionRow({ title, subtitle, selected, onPress }: RichSelectionRowProps) {
  const { colors, typography, spacing } = useTheme();

  function handlePress() {
    Haptics.selectionAsync();
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.base,
        paddingHorizontal: spacing.lg,
        backgroundColor: selected ? colors.brand.light : 'transparent',
        opacity: pressed ? 0.75 : 1,
        gap: spacing.sm,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: selected ? typography.family.uiBold : typography.family.uiMedium,
            fontSize: typography.size.body,
            color: selected ? colors.brand.dark : colors.text.primary,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.small,
              color: colors.text.secondary,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <Ionicons name="checkmark" size={20} color={colors.brand.primary} />
      ) : (
        <View style={{ width: 20 }} />
      )}
    </Pressable>
  );
}
