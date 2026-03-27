// src/components/arabic/HarakatToggle.tsx
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type HarakatsMode = 'always' | 'tap_reveal' | 'never';

interface HarakatToggleProps {
  value: HarakatsMode;
  onChange: (mode: HarakatsMode) => void;
}

const OPTIONS: { value: HarakatsMode; icon: string; label: string }[] = [
  { value: 'always',     icon: '👁️', label: 'Toujours' },
  { value: 'tap_reveal', icon: '👆', label: 'Au tap' },
  { value: 'never',      icon: '🚫', label: 'Masqués' },
];

export default function HarakatToggle({ value, onChange }: HarakatToggleProps) {
  const { colors, typography, borderRadius } = useTheme();

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.background.group,
      borderRadius: borderRadius.pill,
      height: 36,
      alignItems: 'center',
      padding: 3,
      gap: 2,
    }}>
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                height: 30,
                borderRadius: borderRadius.pill,
              },
              active && { backgroundColor: colors.brand.primary },
            ]}
            onPress={() => onChange(opt.value)}
            hitSlop={4}
          >
            <Text style={{ fontSize: 13 }}>{opt.icon}</Text>
            <Text style={{
              fontFamily: active ? typography.family.uiBold : typography.family.uiMedium,
              fontSize: typography.size.small,
              color: active ? colors.text.inverse : colors.text.secondary,
            }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
