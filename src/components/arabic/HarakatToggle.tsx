// src/components/arabic/HarakatToggle.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, FontSizes } from '../../constants/theme';

type HarakatsMode = 'always' | 'tap_reveal' | 'never';

interface HarakatToggleProps {
  value: HarakatsMode;
  onChange: (mode: HarakatsMode) => void;
}

const OPTIONS: { value: HarakatsMode; icon: string; label: string }[] = [
  { value: 'always',    icon: '👁️', label: 'Toujours' },
  { value: 'tap_reveal', icon: '👆', label: 'Au tap' },
  { value: 'never',     icon: '🚫', label: 'Masqués' },
];

export default function HarakatToggle({ value, onChange }: HarakatToggleProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => onChange(opt.value)}
            hitSlop={4}
          >
            <Text style={styles.icon}>{opt.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F5F0EB',
    borderRadius: 18,
    height: 36,
    alignItems: 'center',
    padding: 3,
    gap: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
  },
  optionActive: {
    backgroundColor: Colors.primary,
  },
  icon: {
    fontSize: 13,
  },
  label: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
});
