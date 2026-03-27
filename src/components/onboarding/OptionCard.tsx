// src/components/onboarding/OptionCard.tsx
import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface OptionCardProps {
  label: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
  mode: 'single' | 'multi';
}

export default function OptionCard({ label, icon, selected, onPress, mode }: OptionCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <TouchableOpacity
      style={{
        borderWidth: 1.5,
        borderColor: selected ? colors.brand.primary : colors.border.medium,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.base,
        backgroundColor: selected ? colors.brand.light : colors.background.card,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {icon ? <Text style={{ fontSize: 22 }}>{icon}</Text> : null}
        <Text style={{
          flex: 1,
          fontFamily: selected ? typography.family.uiMedium : typography.family.ui,
          fontSize: typography.size.body,
          color: selected ? colors.brand.primary : colors.text.primary,
        }}>
          {label}
        </Text>
        <View style={{
          width: 20,
          height: 20,
          borderRadius: mode === 'multi' ? 4 : 10,
          borderWidth: 2,
          borderColor: selected ? colors.brand.primary : colors.border.medium,
          backgroundColor: selected ? colors.brand.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {selected && (
            mode === 'multi' ? (
              <View style={{
                width: 10,
                height: 6,
                borderLeftWidth: 2,
                borderBottomWidth: 2,
                borderColor: colors.text.inverse,
                transform: [{ rotate: '-45deg' }, { translateY: -1 }],
              }} />
            ) : (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.inverse }} />
            )
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
