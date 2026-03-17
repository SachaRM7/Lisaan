// src/components/onboarding/OptionCard.tsx
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors, Spacing, Radius, FontSizes } from '../../constants/theme';

interface OptionCardProps {
  label: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
  mode: 'single' | 'multi';
}

export default function OptionCard({ label, icon, selected, onPress, mode }: OptionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        <View style={[
          mode === 'multi' ? styles.checkbox : styles.radio,
          selected && styles.checkSelected,
        ]}>
          {selected && <View style={mode === 'multi' ? styles.checkmark : styles.radioDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.bgCard,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    flex: 1,
    fontSize: FontSizes.body,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textOnPrimary,
  },
  checkmark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.textOnPrimary,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
});
